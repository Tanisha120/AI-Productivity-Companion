import { generateJSON } from "@/lib/gemini";
import {
  WEEKLY_REVIEW_SYSTEM,
  buildWeeklyReviewPrompt,
} from "@/prompts/reminder.prompt";
import { startOfWeek, endOfWeek, format } from "date-fns";
import type { WeeklyReviewData } from "@/types/ai.types";

interface WeeklyReviewResponse {
  title: string;
  summary: string;
  achievements: string[];
  areasForImprovement: string[];
  patterns: string[];
  recommendations: string[];
  motivationalMessage: string;
}

export async function generateWeeklyReview(
  userId: string,
  weekDate: Date = new Date()
): Promise<WeeklyReviewResponse & { weekStart: Date; weekEnd: Date }> {
  const { connectDB } = await import("@/lib/db");
  const { Task } = await import("@/models/Task");
  const { Goal } = await import("@/models/Goal");
  const { Habit } = await import("@/models/Habit");

  await connectDB();

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });

  // Aggregate data for the week
  const [completedTasks, missedTasks, goals, habits] = await Promise.all([
    Task.find({
      userId,
      status: "completed",
      updatedAt: { $gte: weekStart, $lte: weekEnd },
    }).select("title category updatedAt"),

    Task.find({
      userId,
      status: "missed",
      deadline: { $gte: weekStart, $lte: weekEnd },
    }).select("title category deadline"),

    Goal.find({
      userId,
      status: { $in: ["active", "completed"] },
      targetDate: { $gte: weekStart, $lte: weekEnd },
    }).select("title status progress"),

    Habit.find({ userId }).select("title completionLog"),
  ]);

  const goalCompletionRate =
    goals.length > 0
      ? (goals.filter((g) => g.status === "completed").length / goals.length) *
        100
      : 0;

  // Habit performance for the week
  const habitPerformance = habits.map((h) => {
    const weekLogs = h.completionLog.filter((log: { date: Date; completed: boolean }) => {
      const d = new Date(log.date);
      return d >= weekStart && d <= weekEnd;
    });
    const rate =
      weekLogs.length > 0
        ? (weekLogs.filter((l: { completed: boolean }) => l.completed).length / weekLogs.length) * 100
        : 0;
    return { name: h.title, completionRate: Math.round(rate) };
  });

  // Group tasks by category
  const tasksByCategory: Record<
    string,
    { completed: number; missed: number }
  > = {};
  for (const t of completedTasks) {
    if (!tasksByCategory[t.category])
      tasksByCategory[t.category] = { completed: 0, missed: 0 };
    tasksByCategory[t.category].completed++;
  }
  for (const t of missedTasks) {
    if (!tasksByCategory[t.category])
      tasksByCategory[t.category] = { completed: 0, missed: 0 };
    tasksByCategory[t.category].missed++;
  }

  const prompt = buildWeeklyReviewPrompt({
    completedTasks: completedTasks.map((t) => ({
      title: t.title,
      category: t.category,
      completedAt: format(new Date(t.updatedAt), "yyyy-MM-dd HH:mm"),
    })),
    missedTasks: missedTasks.map((t) => ({
      title: t.title,
      category: t.category,
      deadline: format(new Date(t.deadline), "yyyy-MM-dd HH:mm"),
    })),
    goalCompletionRate: Math.round(goalCompletionRate),
    habitPerformance,
    tasksByCategory,
    weekStart: format(weekStart, "yyyy-MM-dd"),
    weekEnd: format(weekEnd, "yyyy-MM-dd"),
  });

  const review = await generateJSON<WeeklyReviewResponse>(
    prompt,
    WEEKLY_REVIEW_SYSTEM
  );

  return { ...review, weekStart, weekEnd };
}
