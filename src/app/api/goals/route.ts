import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Goal } from "@/models/Goal";
import mongoose from "mongoose";
import { z } from "zod";

const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(["daily", "weekly", "monthly"]),
  targetDate: z.string().datetime(),
  milestones: z
    .array(
      z.object({
        title: z.string(),
        dueDate: z.string().datetime().optional(),
      })
    )
    .optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(session.user.id),
  };
  if (status) query.status = status;

  const goals = await Goal.find(query).sort({ targetDate: 1 });
  return NextResponse.json({ success: true, data: goals });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  const goal = await Goal.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    ...parsed.data,
    targetDate: new Date(parsed.data.targetDate),
    milestones:
      parsed.data.milestones?.map((m) => ({
        ...m,
        completed: false,
        dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
      })) ?? [],
  });

  return NextResponse.json({ success: true, data: goal }, { status: 201 });
}
