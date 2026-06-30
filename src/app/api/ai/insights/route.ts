import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AIInsight } from "@/models/AIInsight";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(session.user.id),
  };
  if (type) query.type = type;

  const insights = await AIInsight.find(query)
    .sort({ generatedAt: -1 })
    .limit(limit);

  // Mark fetched as read
  await AIInsight.updateMany(
    { userId: new mongoose.Types.ObjectId(session.user.id), read: false },
    { $set: { read: true } }
  );

  return NextResponse.json({ success: true, data: insights });
}
