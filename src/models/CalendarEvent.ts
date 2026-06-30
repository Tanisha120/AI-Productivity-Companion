import mongoose, { Document, Schema } from "mongoose";

export interface CalendarEventDocument extends Document {
  userId: mongoose.Types.ObjectId;
  googleEventId?: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isBlocked: boolean;
  source: "google" | "manual";
  createdAt: Date;
}

const CalendarEventSchema = new Schema<CalendarEventDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    googleEventId: { type: String, sparse: true },
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isBlocked: { type: Boolean, default: true },
    source: { type: String, enum: ["google", "manual"], default: "manual" },
  },
  { timestamps: true }
);

CalendarEventSchema.index({ userId: 1, startTime: 1 });
CalendarEventSchema.index({ userId: 1, googleEventId: 1 }, { sparse: true });

export const CalendarEvent =
  mongoose.models.CalendarEvent ||
  mongoose.model<CalendarEventDocument>("CalendarEvent", CalendarEventSchema);
