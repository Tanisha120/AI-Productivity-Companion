import mongoose, { Document, Schema } from "mongoose";

export interface ReminderDocument extends Document {
  userId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  scheduledAt: Date;
  message: string;
  type: "standard" | "ai_contextual";
  delivered: boolean;
  channel: "in_app" | "email";
  createdAt: Date;
}

const ReminderSchema = new Schema<ReminderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    taskId: { type: Schema.Types.ObjectId, ref: "Task" },
    scheduledAt: { type: Date, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["standard", "ai_contextual"],
      default: "ai_contextual",
    },
    delivered: { type: Boolean, default: false },
    channel: { type: String, enum: ["in_app", "email"], default: "in_app" },
  },
  { timestamps: true }
);

ReminderSchema.index({ userId: 1, scheduledAt: 1 });
ReminderSchema.index({ userId: 1, delivered: 1 });

export const Reminder =
  mongoose.models.Reminder ||
  mongoose.model<ReminderDocument>("Reminder", ReminderSchema);
