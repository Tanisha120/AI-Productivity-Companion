import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { Header } from "@/components/shared/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DailySchedule } from "@/components/dashboard/DailySchedule";
import { RiskRadar } from "@/components/dashboard/RiskRadar";
import { ProductivityInsights } from "@/components/dashboard/ProductivityInsights";
import { TaskCard } from "@/components/tasks/TaskCard";
import mongoose from "mongoose";
import { startOfDay, endOfDay } from "date-fns";
import { format } from "date-fns";
import { toITask, type LeanTaskDoc } from "@/utils/task";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  await connectDB();
  const uid = new mongoose.Types.ObjectId(session.user.id);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [allTasks, completedToday] = await Promise.all([
    Task.find({ userId: uid, status: { $in: ["pending", "in_progress", "missed"] } })
      .sort({ riskScore: -1, deadline: 1 })
      .limit(50)
      .lean<LeanTaskDoc[]>(),
    Task.countDocuments({
      userId: uid,
      status: "completed",
      updatedAt: { $gte: todayStart, $lte: todayEnd },
    }),
  ]);

  const overdue = allTasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed"
  ).length;
  const highRisk = allTasks.filter((t) => t.riskScore >= 60).length;
  const totalCompleted = await Task.countDocuments({ userId: uid, status: "completed" });
  const totalAll = await Task.countDocuments({ userId: uid });
  const completionRate =
    totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0;

  // Category breakdown
  const categoryMap: Record<string, { completed: number; pending: number }> = {};
  for (const t of allTasks) {
    if (!categoryMap[t.category]) categoryMap[t.category] = { completed: 0, pending: 0 };
    categoryMap[t.category].pending++;
  }
  const completedTasks = await Task.find({ userId: uid, status: "completed" })
    .select("category")
    .lean();
  for (const t of completedTasks) {
    if (!categoryMap[t.category]) categoryMap[t.category] = { completed: 0, pending: 0 };
    categoryMap[t.category].completed++;
  }
  const tasksByCategory = Object.entries(categoryMap).map(([category, counts]) => ({
    category, ...counts,
  }));

  const urgentTasks = allTasks.slice(0, 5).map(toITask);
  const serializedTasks = allTasks.map(toITask);

  const todayDate = format(new Date(), "EEEE, MMMM d");

  return (
    <div>
      <Header title="Dashboard" subtitle={todayDate} />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <StatsCards
          stats={{
            totalPending: allTasks.length,
            completedToday,
            highRisk,
            overdue,
            completionRate,
          }}
        />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Schedule + urgent tasks */}
          <div className="lg:col-span-2 space-y-6">
            <DailySchedule />

            {/* Urgent tasks */}
            <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                🔥 Priority Tasks
                <span className="text-xs text-muted-foreground font-normal">
                  ({allTasks.length} total)
                </span>
              </h2>
              <div className="space-y-2">
                {urgentTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    🎉 No pending tasks! Enjoy your day.
                  </p>
                ) : (
                  urgentTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      compact
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Risk + Insights */}
          <div className="space-y-6">
            <RiskRadar tasks={serializedTasks} />
            <ProductivityInsights
              tasksByCategory={tasksByCategory}
              completionRate={completionRate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
