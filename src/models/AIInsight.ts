import mongoose, { Document, Schema } from "mongoose";

export interface AIInsightDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: "weekly_review" | "productivity_pattern" | "recommendation";
  title: string;
  content: string;
  data?: Record<string, unknown>;
  generatedAt: Date;
  weekStart?: Date;
  read: boolean;
}

const AIInsightSchema = new Schema<AIInsightDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["weekly_review", "productivity_pattern", "recommendation"],
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    generatedAt: { type: Date, default: Date.now },
    weekStart: { type: Date },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AIInsightSchema.index({ userId: 1, type: 1 });
AIInsightSchema.index({ userId: 1, generatedAt: -1 });

export const AIInsight =
  mongoose.models.AIInsight ||
  mongoose.model<AIInsightDocument>("AIInsight", AIInsightSchema);
