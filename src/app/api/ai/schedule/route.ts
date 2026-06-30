import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { CalendarEvent } from "@/models/CalendarEvent";
import { generateDailySchedule } from "@/services/ai/scheduling.service";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const body = await req.json().catch(() => ({}));
  const date = body.date ? new Date(body.date) : new Date();

  const [pendingTasks, user, calendarEvents] = await Promise.all([
    Task.find({
      userId: new mongoose.Types.ObjectId(session.user.id),
      status: { $in: ["pending", "in_progress"] },
    })
      .sort({ riskScore: -1, priority: 1 })
      .limit(15),
    User.findById(session.user.id).select("preferences timezone"),
    CalendarEvent.find({
      userId: new mongoose.Types.ObjectId(session.user.id),
      startTime: { $gte: new Date(date.setHours(0, 0, 0, 0)) },
      endTime: { $lte: new Date(date.setHours(23, 59, 59, 999)) },
    }),
  ]);

  const taskInputs = pendingTasks.map((t) => ({
    id: t._id.toString(),
    title: t.title,
    estimatedEffort: t.estimatedEffort,
    priority: t.priority,
    deadline: t.deadline?.toISOString(),
    category: t.category,
  }));

  const calendarInputs = calendarEvents.map((e) => ({
    _id: e._id.toString(),
    userId: session.user.id,
    title: e.title,
    startTime: e.startTime,
    endTime: e.endTime,
    isBlocked: e.isBlocked,
    source: e.source,
    createdAt: e.createdAt,
  }));

  const schedule = await generateDailySchedule(
    taskInputs,
    calendarInputs,
    {
      workStartTime: user?.preferences?.workStartTime ?? "09:00",
      workEndTime: user?.preferences?.workEndTime ?? "18:00",
      productiveHours: user?.preferences?.productiveHours ?? [],
      timezone: user?.timezone ?? "Asia/Kolkata",
    },
    new Date(body.date ?? Date.now())
  );

  return NextResponse.json({ success: true, data: schedule });
}
