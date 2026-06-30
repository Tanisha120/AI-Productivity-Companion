import { generateJSON } from "@/lib/gemini";
import {
  RISK_EXPLANATION_SYSTEM,
  buildRiskExplanationPrompt,
} from "@/prompts/risk-explanation.prompt";
import { calculateRiskScore } from "@/utils/risk-calculator";
import type { RiskResult } from "@/types/ai.types";
import type { ICalendarEvent } from "@/types/calendar.types";

interface RiskExplanationResponse {
  explanation: string;
  recommendations: string[];
  urgentAction: string;
}

export async function assessTaskRisk(
  task: {
    id: string;
    title: string;
    category: string;
    deadline?: Date;
    estimatedEffort: number;
    status: string;
  },
  calendarEvents: ICalendarEvent[],
  pendingHighPriorityCount: number,
  historicalMissRate: number,
  withExplanation = true
): Promise<RiskResult> {
  // Step 1: Pure backend risk score calculation
  const { score, level, factors } = calculateRiskScore({
    deadline: task.deadline,
    estimatedEffort: task.estimatedEffort,
    calendarEvents,
    pendingHighPriorityCount,
    historicalMissRate,
    status: task.status,
  });

  if (!withExplanation) {
    return {
      taskId: task.id,
      riskScore: score,
      riskLevel: level,
      explanation: "",
      recommendations: [],
      factors,
    };
  }

  // Step 2: Gemini explains the score (does NOT recalculate)
  const prompt = buildRiskExplanationPrompt({
    taskTitle: task.title,
    taskCategory: task.category,
    riskScore: score,
    riskLevel: level,
    factors,
  });

  const explanation = await generateJSON<RiskExplanationResponse>(
    prompt,
    RISK_EXPLANATION_SYSTEM
  );

  return {
    taskId: task.id,
    riskScore: score,
    riskLevel: level,
    explanation: explanation.explanation,
    recommendations: explanation.recommendations,
    factors,
  };
}
