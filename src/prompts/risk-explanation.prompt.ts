export const RISK_EXPLANATION_SYSTEM = `You are a deadline risk analyst.
Given a pre-calculated risk score and its factors, explain the risk clearly and provide actionable recommendations.
Be direct and specific. Do not recalculate the score — only explain it and suggest next steps.
Return valid JSON only.`;

export function buildRiskExplanationPrompt(input: {
  taskTitle: string;
  taskCategory: string;
  riskScore: number;
  riskLevel: string;
  factors: {
    hoursRemaining: number;
    freeHoursBeforeDeadline: number;
    effortHours: number;
    workloadFactor: number;
    historicalMissRate: number;
    isOverdue: boolean;
  };
}): string {
  return JSON.stringify({
    instruction:
      "Explain this risk score in plain language and provide 3 specific, actionable recommendations to reduce the risk. Be concise.",
    task: {
      title: input.taskTitle,
      category: input.taskCategory,
    },
    riskScore: input.riskScore,
    riskLevel: input.riskLevel,
    factors: input.factors,
    responseSchema: {
      explanation: "2-3 sentence plain language explanation of why this risk score",
      recommendations: ["3 specific actionable steps"],
      urgentAction: "The single most important thing to do right now",
    },
  });
}
