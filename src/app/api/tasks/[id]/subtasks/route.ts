import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { SubTask } from "@/models/SubTask";
import { generateSubtasks } from "@/services/ai/action-suggestions.service";
import mongoose from "mongoose";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const createSubtaskSchema = z.object({
  title: z.string().min(1).max(200),
  estimatedEffort: z.number().min(5).max(240).optional(),
  order: z.number().optional(),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(session.user.id),
  });
  if (!task)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const subtasks = await SubTask.find({ taskId: task._id }).sort({ order: 1 });
  return NextResponse.json({ success: true, data: subtasks });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(session.user.id),
  });
  if (!task)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = await req.json();

  // If action=generate, use AI to break down
  if (body.action === "generate") {
    const generated = await generateSubtasks({
      title: task.title,
      description: task.description,
      category: task.category,
      estimatedEffort: task.estimatedEffort,
      deadline: task.deadline?.toISOString(),
    });

    const subtasks = await SubTask.insertMany(
      generated.map((s) => ({
        taskId: task._id,
        title: s.title,
        estimatedEffort: s.estimatedEffort,
        order: s.order,
        status: "pending",
      }))
    );

    return NextResponse.json({ success: true, data: subtasks }, { status: 201 });
  }

  // Manual subtask creation
  const parsed = createSubtaskSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existingCount = await SubTask.countDocuments({ taskId: task._id });
  const subtask = await SubTask.create({
    taskId: task._id,
    ...parsed.data,
    order: parsed.data.order ?? existingCount,
    status: "pending",
  });

  return NextResponse.json({ success: true, data: subtask }, { status: 201 });
}
