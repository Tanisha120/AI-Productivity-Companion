import mongoose, { Document, Schema } from "mongoose";

export interface HabitDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  frequency: "daily" | "weekly";
  targetDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  currentStreak: number;
  longestStreak: number;
  completionLog: {
    date: Date;
    completed: boolean;
  }[];
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<HabitDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    frequency: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
    },
    targetDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // Mon-Fri
    },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    completionLog: [
      {
        date: { type: Date, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    color: { type: String, default: "#6172f3" },
    icon: { type: String, default: "⚡" },
  },
  { timestamps: true }
);

HabitSchema.index({ userId: 1 });

export const Habit =
  mongoose.models.Habit || mongoose.model<HabitDocument>("Habit", HabitSchema);
