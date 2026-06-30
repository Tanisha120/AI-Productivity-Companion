import mongoose, { Document, Schema } from "mongoose";

export interface SubTaskDocument extends Document {
  taskId: mongoose.Types.ObjectId;
  title: string;
  status: "pending" | "completed";
  estimatedEffort: number;
  order: number;
  createdAt: Date;
}

const SubTaskSchema = new Schema<SubTaskDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    title: { type: String, required: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    estimatedEffort: { type: Number, default: 30 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SubTask =
  mongoose.models.SubTask ||
  mongoose.model<SubTaskDocument>("SubTask", SubTaskSchema);
