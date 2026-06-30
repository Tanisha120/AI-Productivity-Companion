import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { SubTask } from "@/models/SubTask";
import { User } from "@/models/User";
import { CalendarEvent } from "@/models/CalendarEvent";
import { assessTaskRisk } from "@/services/ai/risk.service";
import { prioritizeTasks } from "@/services/ai/prioritization.service";
import { getActionSuggestions } from "@/services/ai/action-suggestions.service";
import { format } from "date-fns";
import type { CreateTaskInput, UpdateTaskInput } from "@/types/task.types";
import mongoose from "mongoose";

export async function createTask(userId: string, input: CreateTaskInput) {
  await connectDB();

  const task = await Task.create({
    userId: new mongoose.Types.ObjectId(userId),
    ...input,
    deadline: input.deadline ? new Date(input.deadline) : undefined,
  });

  // Async AI enrichment (non-blocking)
  enrichTaskAsync(task._id.toString(), userId).catch(console.error);

  return task;
}

export async function getTasks(
  userId: string,
  filters: {
    status?: string;
    priority?: string;
    category?: string;
    limit?: number;
  } = {}
) {
  await connectDB();
  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.category) query.category = filters.category;

  return Task.find(query)
    .sort({ riskScore: -1, deadline: 1 })
    .limit(filters.limit ?? 100);
}

export async function getTaskById(userId: string, taskId: string) {
  await connectDB();
  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(taskId),
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!task) return null;

  const subtasks = await SubTask.find({ taskId: task._id }).sort({ order: 1 });
  return { task, subtasks };
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
) {
  await connectDB();
  const update: Record<string, unknown> = { ...input };
  if (input.deadline) update.deadline = new Date(input.deadline);

  const task = await Task.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(taskId),
      userId: new mongoose.Types.ObjectId(userId),
    },
    { $set: update },
    { new: true }
  );

  if (!task) return null;

  // Re-enrich if deadline or effort changed
  if (input.deadline || input.estimatedEffort) {
    enrichTaskAsync(taskId, userId).catch(console.error);
  }

  return task;
}

export async function deleteTask(userId: string, taskId: string) {
  await connectDB();
  const result = await Task.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(taskId),
    userId: new mongoose.Types.ObjectId(userId),
  });
  if (result) {
    await SubTask.deleteMany({ taskId: new mongoose.Types.ObjectId(taskId) });
  }
  return result;
}

export async function enrichTaskAsync(
  taskId: string,
  userId: string
): Promise<void> {
  await connectDB();

  const [task, user, calendarEvents, highPriorityCount] = await Promise.all([
    Task.findById(taskId),
    User.findById(userId).select("preferences behaviorProfile"),
    CalendarEvent.find({ userId }).select("startTime endTime isBlocked"),
    Task.countDocuments({
      userId,
      status: "pending",
      priority: { $in: ["critical", "high"] },
    }),
  ]);

  if (!task) return;

  const historicalMissRate = user?.behaviorProfile?.avgCompletionRate
    ? 1 - user.behaviorProfile.avgCompletionRate / 100
    : 0.2;

  // Calculate risk
  const riskResult = await assessTaskRisk(
    {
      id: task._id.toString(),
      title: task.title,
      category: task.category,
      deadline: task.deadline,
      estimatedEffort: task.estimatedEffort,
      status: task.status,
    },
    calendarEvents.map((e) => ({
      _id: e._id.toString(),
      userId: e.userId?.toString() ?? userId,
      googleEventId: e.googleEventId,
      title: e.title ?? "",
      startTime: e.startTime,
      endTime: e.endTime,
      isBlocked: e.isBlocked,
      source: e.source ?? "manual",
      createdAt: e.createdAt,
    })),
    highPriorityCount,
    historicalMissRate,
    true
  );

  // Get AI action suggestions
  const suggestions = await getActionSuggestions({
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    category: task.category,
    deadline: task.deadline?.toISOString(),
    estimatedEffort: task.estimatedEffort,
    status: task.status,
  });

  await Task.findByIdAndUpdate(taskId, {
    $set: {
      riskScore: riskResult.riskScore,
      riskExplanation: riskResult.explanation,
      aiSuggestions: suggestions.map((s) => s.label),
    },
  });
}

export async function reprioritizeAllTasks(userId: string): Promise<void> {
  await connectDB();

  const [pendingTasks, user] = await Promise.all([
    Task.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ["pending", "in_progress"] },
    }),
    User.findById(userId).select("preferences timezone"),
  ]);

  if (pendingTasks.length === 0) return;

  const taskInputs = pendingTasks.map((t) => ({
    id: t._id.toString(),
    title: t.title,
    category: t.category,
    deadline: t.deadline?.toISOString(),
    estimatedEffort: t.estimatedEffort,
    description: t.description,
  }));

  const results = await prioritizeTasks(taskInputs, {
    currentTime: format(new Date(), "yyyy-MM-dd HH:mm"),
    timezone: user?.timezone ?? "Asia/Kolkata",
    workStartTime: user?.preferences?.workStartTime ?? "09:00",
    workEndTime: user?.preferences?.workEndTime ?? "18:00",
    productiveHours: user?.preferences?.productiveHours ?? [],
  });

  // Bulk update priorities
  const updates = results.map((r) =>
    Task.findByIdAndUpdate(r.taskId, {
      $set: {
        priority: r.priority,
        urgency: r.urgency,
        importance: r.importance,
        priorityReasoning: r.reasoning,
      },
    })
  );

  await Promise.all(updates);
}
