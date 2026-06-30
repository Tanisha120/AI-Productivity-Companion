import type mongoose from "mongoose";
import type { ITask } from "@/types/task.types";

export type LeanTaskDoc = Omit<ITask, "_id" | "userId" | "subtasks"> & {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
};

export function toITask(task: LeanTaskDoc): ITask {
  return {
    ...task,
    _id: task._id.toString(),
    userId: task.userId.toString(),
    subtasks: [],
  };
}
