"use server";

import { auth } from "@/lib/auth";
import {
  createTask,
  updateTask,
  deleteTask,
  reprioritizeAllTasks,
} from "@/services/task.service";
import { connectDB } from "@/lib/db";
import { SubTask } from "@/models/SubTask";
import { Task } from "@/models/Task";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import type { CreateTaskInput, UpdateTaskInput } from "@/types/task.types";

export async function createTaskAction(input: CreateTaskInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await createTask(session.user.id, input);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { success: true, data: JSON.parse(JSON.stringify(task)) };
}

export async function updateTaskAction(taskId: string, input: UpdateTaskInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await updateTask(session.user.id, taskId, input);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { success: true, data: JSON.parse(JSON.stringify(task)) };
}

export async function deleteTaskAction(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await deleteTask(session.user.id, taskId);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { success: true };
}

export async function completeTaskAction(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const task = await updateTask(session.user.id, taskId, { status: "completed" });
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { success: true, data: JSON.parse(JSON.stringify(task)) };
}

export async function toggleSubtaskAction(subtaskId: string, completed: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  const subtask = await SubTask.findByIdAndUpdate(
    subtaskId,
    { $set: { status: completed ? "completed" : "pending" } },
    { new: true }
  );

  if (!subtask) throw new Error("Subtask not found");

  // Update parent task progress
  const siblings = await SubTask.find({ taskId: subtask.taskId });
  const completedCount = siblings.filter((s) => s.status === "completed").length;
  if (completedCount === siblings.length && siblings.length > 0) {
    await Task.findOneAndUpdate(
      {
        _id: subtask.taskId,
        userId: new mongoose.Types.ObjectId(session.user.id),
      },
      { $set: { status: "completed" } }
    );
  }

  revalidatePath("/tasks");
  return { success: true };
}

export async function reprioritizeAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await reprioritizeAllTasks(session.user.id);
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { success: true };
}
