import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Reminder } from "@/models/Reminder";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { generateJSON } from "@/lib/gemini";
import {
  REMINDER_SYSTEM,
  buildReminderPrompt,
} from "@/prompts/reminder.prompt";
import { differenceInHours, addHours } from "date-fns";
import mongoose from "mongoose";

interface ReminderResponse {
  message: string;
  urgencyLevel: string;
  recommendedAction: string;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const undeliveredOnly = searchParams.get("undelivered") === "true";

  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(session.user.id),
  };
  if (undeliveredOnly) query.delivered = false;

  const reminders = await Reminder.find(query)
    .sort({ scheduledAt: 1 })
    .limit(20)
    .populate("taskId", "title category status");

  return NextResponse.json({ success: true, data: reminders });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json().catch(() => ({}));

  // auto=true: generate AI reminders for all due-soon tasks
  if (body.auto) {
    const user = await User.findById(session.user.id).select("behaviorProfile");
    const dueSoonTasks = await Task.find({
      userId: new mongoose.Types.ObjectId(session.user.id),
      status: { $in: ["pending", "in_progress"] },
      deadline: {
        $gte: new Date(),
        $lte: addHours(new Date(), 48),
      },
    });

    const created = [];
    for (const task of dueSoonTasks) {
      if (!task.deadline) continue;

      const existing = await Reminder.findOne({
        taskId: task._id,
        delivered: false,
        scheduledAt: { $gte: new Date() },
      });
      if (existing) continue;

      const hoursRemaining = differenceInHours(task.deadline, new Date());
      const prompt = buildReminderPrompt({
        taskTitle: task.title,
        taskCategory: task.category,
        deadline: task.deadline.toISOString(),
        estimatedEffort: task.estimatedEffort,
        hoursRemaining,
        freeHoursAvailable: Math.max(0, hoursRemaining - 2),
        userPattern: user?.behaviorProfile?.avgCompletionRate
          ? `User completes ${user.behaviorProfile.avgCompletionRate}% of tasks on time`
          : undefined,
      });

      const aiReminder = await generateJSON<ReminderResponse>(
        prompt,
        REMINDER_SYSTEM
      );

      const reminder = await Reminder.create({
        userId: new mongoose.Types.ObjectId(session.user.id),
        taskId: task._id,
        scheduledAt: new Date(),
        message: aiReminder.message,
        type: "ai_contextual",
        delivered: false,
        channel: "in_app",
      });
      created.push(reminder);
    }

    return NextResponse.json({ success: true, data: created });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
