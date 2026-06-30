import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTaskById, updateTask, deleteTask } from "@/services/task.service";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z
    .enum([
      "assignment",
      "bill",
      "interview",
      "resume",
      "meeting",
      "personal",
      "work",
      "other",
    ])
    .optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "missed", "postponed"])
    .optional(),
  deadline: z.string().datetime().optional(),
  estimatedEffort: z.number().min(5).max(480).optional(),
  tags: z.array(z.string()).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getTaskById(session.user.id, id);
  if (!result)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: result });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );

  const task = await updateTask(session.user.id, id, parsed.data);
  if (!task)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: task });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await deleteTask(session.user.id, id);
  if (!task)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json({ success: true, message: "Task deleted" });
}
