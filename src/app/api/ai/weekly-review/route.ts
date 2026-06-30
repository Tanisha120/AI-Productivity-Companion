import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AIInsight } from "@/models/AIInsight";
import { generateWeeklyReview } from "@/services/ai/weekly-review.service";
import mongoose from "mongoose";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const review = await generateWeeklyReview(session.user.id);

  const insight = await AIInsight.create({
    userId: new mongoose.Types.ObjectId(session.user.id),
    type: "weekly_review",
    title: review.title,
    content: review.summary,
    data: {
      achievements: review.achievements,
      areasForImprovement: review.areasForImprovement,
      patterns: review.patterns,
      recommendations: review.recommendations,
      motivationalMessage: review.motivationalMessage,
    },
    weekStart: review.weekStart,
    generatedAt: new Date(),
  });

  return NextResponse.json({ success: true, data: insight });
}
