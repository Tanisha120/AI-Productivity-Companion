import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Habit } from "@/models/Habit";
import mongoose from "mongoose";
import { z } from "zod";
import { startOfDay } from "date-fns";

type RouteParams = { params: Promise<{ id: string }> };

const logHabitSchema = z.object({
  date: z.string().datetime().optional(),
  completed: z.boolean(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const habit = await Habit.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(session.user.id),
  });
  if (!habit)
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });

  const body = await req.json();

  // Handle completion log
  if ("completed" in body) {
    const parsed = logHabitSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const logDate = parsed.data.date
      ? startOfDay(new Date(parsed.data.date))
      : startOfDay(new Date());

    // Remove existing log for this date then add new one
    habit.completionLog = habit.completionLog.filter((l: { date: Date; completed: boolean }) => {
      return startOfDay(new Date(l.date)).getTime() !== logDate.getTime();
    });
    habit.completionLog.push({ date: logDate, completed: parsed.data.completed });

    // Recalculate streak
    const sortedLogs = [...habit.completionLog]
      .filter((l: { date: Date; completed: boolean }) => l.completed)
      .sort((a: { date: Date }, b: { date: Date }) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let checkDate = startOfDay(new Date());
    for (const log of sortedLogs) {
      const logDay = startOfDay(new Date(log.date));
      const diff =
        (checkDate.getTime() - logDay.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 1) {
        streak++;
        checkDate = logDay;
      } else break;
    }

    habit.currentStreak = streak;
    if (streak > habit.longestStreak) habit.longestStreak = streak;

    await habit.save();
    return NextResponse.json({ success: true, data: habit });
  }

  // Handle general updates (title, color, etc.)
  const allowedUpdates = ["title", "description", "targetDays", "color", "icon", "frequency"];
  const updates: Record<string, unknown> = {};
  for (const key of allowedUpdates) {
    if (key in body) updates[key] = body[key];
  }

  const updated = await Habit.findByIdAndUpdate(id, { $set: updates }, { new: true });
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const habit = await Habit.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(session.user.id),
  });
  if (!habit)
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });

  return NextResponse.json({ success: true, message: "Habit deleted" });
}
