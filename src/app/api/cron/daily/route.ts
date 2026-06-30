import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { updateBehaviorProfile } from "@/services/ai/context-awareness.service";

// Called by Cloud Scheduler daily — protected by x-cron-secret header (middleware)
export async function POST() {
  await connectDB();

  // 1. Mark overdue tasks as missed
  const now = new Date();
  const overdueResult = await Task.updateMany(
    {
      status: { $in: ["pending", "in_progress"] },
      deadline: { $lt: now },
    },
    { $set: { status: "missed" } }
  );

  // 2. Update behavior profiles for all active users
  const recentUsers = await User.find({
    updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  }).select("_id");

  let profilesUpdated = 0;
  for (const user of recentUsers) {
    try {
      await updateBehaviorProfile(user._id.toString());
      profilesUpdated++;
    } catch {
      // Silent fail per user - don't block the cron
    }
  }

  return NextResponse.json({
    success: true,
    overdueTasksMarked: overdueResult.modifiedCount,
    profilesUpdated,
    timestamp: now.toISOString(),
  });
}
