import mongoose, { Document, Schema } from "mongoose";

export interface GoalDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: "daily" | "weekly" | "monthly";
  targetDate: Date;
  progress: number;
  status: "active" | "completed" | "abandoned";
  milestones: {
    title: string;
    completed: boolean;
    dueDate?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<GoalDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "weekly",
    },
    targetDate: { type: Date, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    milestones: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        dueDate: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, targetDate: 1 });

export const Goal =
  mongoose.models.Goal || mongoose.model<GoalDocument>("Goal", GoalSchema);
