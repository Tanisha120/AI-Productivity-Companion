import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Habit } from "@/models/Habit";
import mongoose from "mongoose";
import { z } from "zod";

const createHabitSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  frequency: z.enum(["daily", "weekly"]),
  targetDays: z.array(z.number().min(0).max(6)).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const habits = await Habit.find({
    userId: new mongoose.Types.ObjectId(session.user.id),
  }).sort({ createdAt: -1 });

  return NextResponse.json({ success: true, data: habits });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createHabitSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  const habit = await Habit.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    ...parsed.data,
    targetDays: parsed.data.targetDays ?? [1, 2, 3, 4, 5],
  });

  return NextResponse.json({ success: true, data: habit }, { status: 201 });
}
