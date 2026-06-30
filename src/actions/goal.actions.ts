"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Goal } from "@/models/Goal";
import { Habit } from "@/models/Habit";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";

// ─── Goal Actions ─────────────────────────────────────────────────────────────

export async function createGoalAction(input: {
  title: string;
  description?: string;
  type: "daily" | "weekly" | "monthly";
  targetDate: string;
  milestones?: { title: string; dueDate?: string }[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const goal = await Goal.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    ...input,
    targetDate: new Date(input.targetDate),
    milestones: input.milestones?.map((m) => ({
      ...m,
      completed: false,
      dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
    })) ?? [],
  });

  revalidatePath("/goals");
  return { success: true, data: JSON.parse(JSON.stringify(goal)) };
}

export async function updateGoalProgressAction(
  goalId: string,
  progress: number
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const goal = await Goal.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(goalId),
      userId: new mongoose.Types.ObjectId(session.user.id),
    },
    {
      $set: {
        progress,
        status: progress >= 100 ? "completed" : "active",
      },
    },
    { new: true }
  );

  revalidatePath("/goals");
  return { success: true, data: JSON.parse(JSON.stringify(goal)) };
}

export async function toggleMilestoneAction(
  goalId: string,
  milestoneIndex: number
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const goal = await Goal.findOne({
    _id: new mongoose.Types.ObjectId(goalId),
    userId: new mongoose.Types.ObjectId(session.user.id),
  });
  if (!goal) throw new Error("Goal not found");

  goal.milestones[milestoneIndex].completed =
    !goal.milestones[milestoneIndex].completed;
  const completedCount = goal.milestones.filter((m: { completed: boolean }) => m.completed).length;
  goal.progress =
    goal.milestones.length > 0
      ? Math.round((completedCount / goal.milestones.length) * 100)
      : 0;
  if (goal.progress === 100) goal.status = "completed";

  await goal.save();
  revalidatePath("/goals");
  return { success: true, data: JSON.parse(JSON.stringify(goal)) };
}

// ─── Habit Actions ────────────────────────────────────────────────────────────

export async function createHabitAction(input: {
  title: string;
  description?: string;
  frequency: "daily" | "weekly";
  targetDays?: number[];
  color?: string;
  icon?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const habit = await Habit.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    ...input,
    targetDays: input.targetDays ?? [1, 2, 3, 4, 5],
  });

  revalidatePath("/habits");
  return { success: true, data: JSON.parse(JSON.stringify(habit)) };
}

export async function logHabitAction(
  habitId: string,
  completed: boolean,
  date?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const habit = await Habit.findOne({
    _id: new mongoose.Types.ObjectId(habitId),
    userId: new mongoose.Types.ObjectId(session.user.id),
  });
  if (!habit) throw new Error("Habit not found");

  const logDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());
  habit.completionLog = habit.completionLog.filter((l: { date: Date; completed: boolean }) => {
    return startOfDay(new Date(l.date)).getTime() !== logDate.getTime();
  });
  habit.completionLog.push({ date: logDate, completed });

  // Recalculate streak
  const sortedCompleted = [...habit.completionLog]
    .filter((l: { date: Date; completed: boolean }) => l.completed)
    .sort((a: { date: Date }, b: { date: Date }) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let streak = 0;
  let checkDate = startOfDay(new Date());
  for (const log of sortedCompleted) {
    const logDay = startOfDay(new Date(log.date));
    const diff = (checkDate.getTime() - logDay.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) { streak++; checkDate = logDay; } else break;
  }

  habit.currentStreak = streak;
  if (streak > habit.longestStreak) habit.longestStreak = streak;
  await habit.save();

  revalidatePath("/habits");
  return { success: true, data: JSON.parse(JSON.stringify(habit)) };
}
