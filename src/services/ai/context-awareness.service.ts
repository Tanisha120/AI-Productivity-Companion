import { generateJSON } from "@/lib/gemini";
import {
  CONTEXT_AWARENESS_SYSTEM,
  buildContextAwarenessPrompt,
} from "@/prompts/reminder.prompt";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { subDays, format } from "date-fns";

interface ContextAnalysisResponse {
  bestWorkHours: number[];
  postponePatterns: string[];
  insights: string[];
  schedulingRecommendations: string[];
}

export async function updateBehaviorProfile(userId: string): Promise<void> {
  await connectDB();

  const thirtyDaysAgo = subDays(new Date(), 30);

  const [completedTasks, missedTasks, user] = await Promise.all([
    Task.find({
      userId,
      status: "completed",
      updatedAt: { $gte: thirtyDaysAgo },
    }).select("title category updatedAt estimatedEffort actualEffort"),

    Task.find({
      userId,
      status: "missed",
      updatedAt: { $gte: thirtyDaysAgo },
    }).select("title category deadline"),

    User.findById(userId).select("behaviorProfile preferences"),
  ]);

  if (!user) return;

  const prompt = buildContextAwarenessPrompt({
    recentCompletions: completedTasks.map((t) => ({
      taskTitle: t.title,
      category: t.category,
      completedAt: format(new Date(t.updatedAt), "yyyy-MM-dd HH:mm"),
      estimatedEffort: t.estimatedEffort,
      actualEffort: t.actualEffort,
    })),
    recentMisses: missedTasks.map((t) => ({
      taskTitle: t.title,
      category: t.category,
      deadline: format(new Date(t.deadline ?? t.updatedAt), "yyyy-MM-dd HH:mm"),
    })),
    existingProfile: {
      bestWorkHours: user.behaviorProfile?.bestWorkHours ?? [],
      postponePatterns: user.behaviorProfile?.postponePatterns ?? [],
      avgCompletionRate: user.behaviorProfile?.avgCompletionRate ?? 0,
    },
  });

  const analysis = await generateJSON<ContextAnalysisResponse>(
    prompt,
    CONTEXT_AWARENESS_SYSTEM
  );

  const totalTasks = completedTasks.length + missedTasks.length;
  const avgCompletionRate =
    totalTasks > 0
      ? Math.round((completedTasks.length / totalTasks) * 100)
      : user.behaviorProfile?.avgCompletionRate ?? 0;

  await User.findByIdAndUpdate(userId, {
    $set: {
      "behaviorProfile.bestWorkHours": analysis.bestWorkHours,
      "behaviorProfile.postponePatterns": analysis.postponePatterns,
      "behaviorProfile.avgCompletionRate": avgCompletionRate,
      "behaviorProfile.lastUpdated": new Date(),
    },
  });
}
