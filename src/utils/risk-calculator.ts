import { differenceInHours } from "date-fns";
import type { ICalendarEvent } from "@/types/calendar.types";

interface RiskInputs {
  deadline?: Date;
  estimatedEffort: number; // minutes
  calendarEvents: ICalendarEvent[];
  pendingHighPriorityCount: number;
  historicalMissRate: number; // 0-1
  status: string;
}

interface RiskFactors {
  hoursRemaining: number;
  freeHoursBeforeDeadline: number;
  effortHours: number;
  workloadFactor: number;
  historicalMissRate: number;
  isOverdue: boolean;
}

export function calculateRiskScore(inputs: RiskInputs): {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: RiskFactors;
} {
  const {
    deadline,
    estimatedEffort,
    calendarEvents,
    pendingHighPriorityCount,
    historicalMissRate,
    status,
  } = inputs;

  // Completed tasks have zero risk
  if (status === "completed") {
    return {
      score: 0,
      level: "low",
      factors: {
        hoursRemaining: 0,
        freeHoursBeforeDeadline: 0,
        effortHours: 0,
        workloadFactor: 0,
        historicalMissRate: 0,
        isOverdue: false,
      },
    };
  }

  if (!deadline) {
    return {
      score: 10,
      level: "low",
      factors: {
        hoursRemaining: 9999,
        freeHoursBeforeDeadline: 9999,
        effortHours: estimatedEffort / 60,
        workloadFactor: pendingHighPriorityCount,
        historicalMissRate,
        isOverdue: false,
      },
    };
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursRemaining = differenceInHours(deadlineDate, now);
  const isOverdue = hoursRemaining < 0;
  const effortHours = estimatedEffort / 60;

  if (isOverdue && status !== "completed") {
    return {
      score: 100,
      level: "critical",
      factors: {
        hoursRemaining,
        freeHoursBeforeDeadline: 0,
        effortHours,
        workloadFactor: pendingHighPriorityCount,
        historicalMissRate,
        isOverdue: true,
      },
    };
  }

  // Calculate free hours before deadline (subtract blocked calendar time)
  const blockedHoursBeforeDeadline = calendarEvents
    .filter((e) => {
      const eventStart = new Date(e.startTime);
      const eventEnd = new Date(e.endTime);
      return eventStart >= now && eventEnd <= deadlineDate && e.isBlocked;
    })
    .reduce((total, e) => {
      return (
        total +
        differenceInHours(new Date(e.endTime), new Date(e.startTime))
      );
    }, 0);

  const freeHoursBeforeDeadline = Math.max(
    0,
    hoursRemaining - blockedHoursBeforeDeadline
  );

  // Weights
  let score = 0;

  // Factor 1: Time pressure (40% weight)
  // Score 0 if 2× effort hours available, 100 if effort > free time
  const timePressure =
    freeHoursBeforeDeadline > 0
      ? Math.max(0, 1 - freeHoursBeforeDeadline / (effortHours * 2))
      : 1;
  score += timePressure * 40;

  // Factor 2: Effort ratio (30% weight)
  // High effort with little time remaining
  const effortRatio =
    hoursRemaining > 0
      ? Math.min(1, effortHours / Math.max(1, hoursRemaining))
      : 1;
  score += effortRatio * 30;

  // Factor 3: Workload (15% weight)
  // Number of other high-priority pending tasks
  const workloadScore = Math.min(1, pendingHighPriorityCount / 5);
  score += workloadScore * 15;

  // Factor 4: Historical miss rate (15% weight)
  score += historicalMissRate * 15;

  const finalScore = Math.round(Math.min(100, Math.max(0, score)));

  const level =
    finalScore >= 80
      ? "critical"
      : finalScore >= 60
        ? "high"
        : finalScore >= 35
          ? "medium"
          : "low";

  return {
    score: finalScore,
    level,
    factors: {
      hoursRemaining,
      freeHoursBeforeDeadline,
      effortHours,
      workloadFactor: pendingHighPriorityCount,
      historicalMissRate,
      isOverdue,
    },
  };
}

export function getRiskColor(score: number): string {
  if (score >= 80) return "text-purple-500";
  if (score >= 60) return "text-red-500";
  if (score >= 35) return "text-amber-500";
  return "text-green-500";
}

export function getRiskBgColor(score: number): string {
  if (score >= 80) return "bg-purple-500/10 border-purple-500/20";
  if (score >= 60) return "bg-red-500/10 border-red-500/20";
  if (score >= 35) return "bg-amber-500/10 border-amber-500/20";
  return "bg-green-500/10 border-green-500/20";
}
