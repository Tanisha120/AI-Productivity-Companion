import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import {
  getActionSuggestions,
  executeAction,
} from "@/services/ai/action-suggestions.service";
import mongoose from "mongoose";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const aiHelpSchema = z.object({
  action: z.enum(["get_suggestions", "execute"]),
  actionType: z.string().optional(),
  actionLabel: z.string().optional(),
});

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
  const parsed = aiHelpSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (parsed.data.action === "get_suggestions") {
    const suggestions = await getActionSuggestions({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      category: task.category,
      deadline: task.deadline?.toISOString(),
      estimatedEffort: task.estimatedEffort,
      status: task.status,
    });
    return NextResponse.json({ success: true, data: suggestions });
  }

  if (parsed.data.action === "execute") {
    if (!parsed.data.actionType || !parsed.data.actionLabel) {
      return NextResponse.json(
        { error: "actionType and actionLabel required for execute" },
        { status: 400 }
      );
    }

    const result = await executeAction(
      task.title,
      task.description,
      parsed.data.actionType,
      parsed.data.actionLabel
    );

    return NextResponse.json({ success: true, data: { result } });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
