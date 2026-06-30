import mongoose, { Document, Schema } from "mongoose";

export interface UserDocument extends Document {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  timezone: string;
  preferences: {
    workStartTime: string;
    workEndTime: string;
    preferredTaskTypes: string[];
    productiveHours: number[];
    darkMode: boolean;
  };
  behaviorProfile: {
    completionPatterns: {
      category: string;
      avgCompletionTime: string;
      completionRate: number;
    }[];
    postponePatterns: string[];
    avgCompletionRate: number;
    bestWorkHours: number[];
    lastUpdated: Date;
  };
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
  calendarConnected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatar: { type: String },
    timezone: { type: String, default: "Asia/Kolkata" },
    preferences: {
      workStartTime: { type: String, default: "09:00" },
      workEndTime: { type: String, default: "18:00" },
      preferredTaskTypes: { type: [String], default: [] },
      productiveHours: { type: [Number], default: [9, 10, 11, 14, 15, 16] },
      darkMode: { type: Boolean, default: true },
    },
    behaviorProfile: {
      completionPatterns: [
        {
          category: String,
          avgCompletionTime: String,
          completionRate: Number,
        },
      ],
      postponePatterns: { type: [String], default: [] },
      avgCompletionRate: { type: Number, default: 0 },
      bestWorkHours: { type: [Number], default: [] },
      lastUpdated: { type: Date, default: Date.now },
    },
    googleAccessToken: { type: String, select: false },
    googleRefreshToken: { type: String, select: false },
    googleTokenExpiry: { type: Date, select: false },
    calendarConnected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);
