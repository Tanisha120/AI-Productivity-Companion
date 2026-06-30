import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { getCalendarGaps } from "@/services/calendar.service";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();

  await connectDB();
  const pendingTasks = await Task.find({
    userId: new mongoose.Types.ObjectId(session.user.id),
    status: { $in: ["pending", "in_progress"] },
  }).sort({ riskScore: -1 }).limit(20);

  const gaps = await getCalendarGaps(session.user.id, date, pendingTasks);
  return NextResponse.json({ success: true, data: gaps });
}
