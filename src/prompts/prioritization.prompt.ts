export interface PrioritizationPromptInput {
  tasks: {
    id: string;
    title: string;
    category: string;
    deadline?: string;
    estimatedEffort: number;
    description?: string;
  }[];
  userContext: {
    currentTime: string;
    timezone: string;
    workStartTime: string;
    workEndTime: string;
    productiveHours: number[];
  };
}

export const PRIORITIZATION_SYSTEM = `You are an expert productivity coach and time management specialist.
Your job is to analyze a list of tasks and assign priority levels using the Eisenhower Matrix (Urgent/Important framework).
Always return valid JSON matching the exact schema requested.
Be concise in reasoning — maximum 2 sentences per task.`;

export function buildPrioritizationPrompt(
  input: PrioritizationPromptInput
): string {
  return JSON.stringify({
    instruction:
      "Analyze these tasks and return prioritization data. For each task determine: priority (critical/high/medium/low), urgency (urgent/not_urgent), importance (important/not_important), recommendedOrder (1=first), and a brief reasoning.",
    tasks: input.tasks,
    userContext: input.userContext,
    responseSchema: {
      results: [
        {
          taskId: "string",
          priority: "critical|high|medium|low",
          urgency: "urgent|not_urgent",
          importance: "important|not_important",
          recommendedOrder: "number",
          reasoning: "string (max 2 sentences)",
        },
      ],
    },
  });
}
