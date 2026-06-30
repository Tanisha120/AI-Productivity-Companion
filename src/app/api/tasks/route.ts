import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createTask, getTasks } from "@/services/task.service";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum([
    "assignment",
    "bill",
    "interview",
    "resume",
    "meeting",
    "personal",
    "work",
    "other",
  ]),
  deadline: z.string().datetime().optional(),
  estimatedEffort: z.number().min(5).max(480),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filters = {
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    limit: searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined,
  };

  const tasks = await getTasks(session.user.id, filters);
  return NextResponse.json({ success: true, data: tasks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );

  const task = await createTask(session.user.id, parsed.data);
  return NextResponse.json({ success: true, data: task }, { status: 201 });
}
