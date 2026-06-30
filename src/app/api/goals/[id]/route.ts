import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Goal } from "@/models/Goal";
import mongoose from "mongoose";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(["active", "completed", "abandoned"]).optional(),
  targetDate: z.string().datetime().optional(),
  milestoneIndex: z.number().optional(),
  milestoneCompleted: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const goal = await Goal.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(session.user.id),
  });
  if (!goal)
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { milestoneIndex, milestoneCompleted, ...updates } = parsed.data;

  // Handle milestone toggle
  if (milestoneIndex !== undefined && milestoneCompleted !== undefined) {
    goal.milestones[milestoneIndex].completed = milestoneCompleted;
    const completedCount = goal.milestones.filter((m: { completed: boolean }) => m.completed).length;
    goal.progress =
      goal.milestones.length > 0
        ? Math.round((completedCount / goal.milestones.length) * 100)
        : 0;
    if (goal.progress === 100) goal.status = "completed";
    await goal.save();
    return NextResponse.json({ success: true, data: goal });
  }

  if (updates.targetDate) {
    (updates as Record<string, unknown>).targetDate = new Date(updates.targetDate);
  }

  const updated = await Goal.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true }
  );
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const goal = await Goal.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(session.user.id),
  });
  if (!goal)
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  return NextResponse.json({ success: true, message: "Goal deleted" });
}
