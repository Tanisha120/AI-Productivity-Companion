import type { TaskPriority } from "./task.types";

export interface PrioritizationResult {
  taskId: string;
  priority: TaskPriority;
  urgency: "urgent" | "not_urgent";
  importance: "important" | "not_important";
  reasoning: string;
  recommendedOrder: number;
}

export interface ScheduleResult {
  date: string;
  blocks: {
    taskId: string;
    taskTitle: string;
    startTime: string;
    endTime: string;
    note?: string;
  }[];
  totalScheduledMinutes: number;
  unscheduledTasks: string[];
}

export interface RiskResult {
  taskId: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  explanation: string;
  recommendations: string[];
  factors: {
    hoursRemaining: number;
    freeHoursBeforeDeadline: number;
    effortHours: number;
    workloadFactor: number;
    historicalMissRate: number;
    isOverdue: boolean;
  };
}

export interface ActionSuggestion {
  label: string;
  description: string;
  actionType: string;
  prompt?: string;
}

export interface AIActionResult {
  taskId: string;
  action: string;
  result: string;
}

export interface WeeklyReviewData {
  completedTasks: number;
  missedTasks: number;
  goalCompletionRate: number;
  habitPerformance: number;
  productivityPatterns: string[];
  recommendations: string[];
  summary: string;
  weekStart: Date;
  weekEnd: Date;
}

export interface CalendarGap {
  start: string; // ISO
  end: string;
  durationMinutes: number;
  aiSuggestion?: string;
  suggestedTaskId?: string;
  suggestedTaskTitle?: string;
}

export interface ProductivityInsight {
  type: "pattern" | "recommendation" | "achievement";
  title: string;
  description: string;
  metric?: string;
}
