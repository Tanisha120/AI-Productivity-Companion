import mongoose, { Document, Schema } from "mongoose";

export interface TaskDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category:
    | "assignment"
    | "bill"
    | "interview"
    | "resume"
    | "meeting"
    | "personal"
    | "work"
    | "other";
  priority: "critical" | "high" | "medium" | "low";
  urgency: "urgent" | "not_urgent";
  importance: "important" | "not_important";
  status: "pending" | "in_progress" | "completed" | "missed" | "postponed";
  deadline?: Date;
  estimatedEffort: number;
  actualEffort?: number;
  riskScore: number;
  riskExplanation?: string;
  aiSuggestions: string[];
  calendarEventId?: string;
  tags: string[];
  priorityReasoning?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<TaskDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: [
        "assignment",
        "bill",
        "interview",
        "resume",
        "meeting",
        "personal",
        "work",
        "other",
      ],
      default: "other",
    },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      default: "medium",
    },
    urgency: {
      type: String,
      enum: ["urgent", "not_urgent"],
      default: "not_urgent",
    },
    importance: {
      type: String,
      enum: ["important", "not_important"],
      default: "important",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "missed", "postponed"],
      default: "pending",
    },
    deadline: { type: Date },
    estimatedEffort: { type: Number, default: 60 },
    actualEffort: { type: Number },
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    riskExplanation: { type: String },
    aiSuggestions: { type: [String], default: [] },
    calendarEventId: { type: String },
    tags: { type: [String], default: [] },
    priorityReasoning: { type: String },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
TaskSchema.index({ userId: 1, deadline: 1 });
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ userId: 1, riskScore: -1 });

export const Task =
  mongoose.models.Task || mongoose.model<TaskDocument>("Task", TaskSchema);
