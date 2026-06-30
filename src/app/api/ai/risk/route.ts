import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { CalendarEvent } from "@/models/CalendarEvent";
import { assessTaskRisk } from "@/services/ai/risk.service";
import mongoose from "mongoose";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const [pendingTasks, user, calendarEvents] = await Promise.all([
    Task.find({
      userId: new mongoose.Types.ObjectId(session.user.id),
      status: { $in: ["pending", "in_progress"] },
    }),
    User.findById(session.user.id).select("behaviorProfile"),
    CalendarEvent.find({
      userId: new mongoose.Types.ObjectId(session.user.id),
      isBlocked: true,
    }).select("startTime endTime isBlocked"),
  ]);

  const highPriorityCount = pendingTasks.filter((t) =>
    ["critical", "high"].includes(t.priority)
  ).length;

  const historicalMissRate = user?.behaviorProfile?.avgCompletionRate
    ? 1 - user.behaviorProfile.avgCompletionRate / 100
    : 0.2;

  const calInputs = calendarEvents.map((e) => ({
    _id: e._id.toString(),
    userId: session.user.id,
    title: "",
    startTime: e.startTime,
    endTime: e.endTime,
    isBlocked: e.isBlocked,
    source: "google" as const,
    createdAt: e.createdAt,
  }));

  const results = await Promise.all(
    pendingTasks.map((task) =>
      assessTaskRisk(
        {
          id: task._id.toString(),
          title: task.title,
          category: task.category,
          deadline: task.deadline,
          estimatedEffort: task.estimatedEffort,
          status: task.status,
        },
        calInputs,
        highPriorityCount,
        historicalMissRate,
        false // no AI explanation on bulk refresh
      ).then((r) =>
        Task.findByIdAndUpdate(task._id, {
          $set: { riskScore: r.riskScore },
        })
      )
    )
  );

  return NextResponse.json({
    success: true,
    message: `Risk scores updated for ${results.length} tasks`,
  });
}
