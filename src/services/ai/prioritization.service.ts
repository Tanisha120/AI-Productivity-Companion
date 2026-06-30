import { generateJSON } from "@/lib/gemini";
import {
  PRIORITIZATION_SYSTEM,
  buildPrioritizationPrompt,
} from "@/prompts/prioritization.prompt";
import type { PrioritizationResult } from "@/types/ai.types";

interface PrioritizationResponse {
  results: PrioritizationResult[];
}

export async function prioritizeTasks(
  tasks: {
    id: string;
    title: string;
    category: string;
    deadline?: string;
    estimatedEffort: number;
    description?: string;
  }[],
  userContext: {
    currentTime: string;
    timezone: string;
    workStartTime: string;
    workEndTime: string;
    productiveHours: number[];
  }
): Promise<PrioritizationResult[]> {
  if (tasks.length === 0) return [];

  const prompt = buildPrioritizationPrompt({ tasks, userContext });
  const response = await generateJSON<PrioritizationResponse>(
    prompt,
    PRIORITIZATION_SYSTEM
  );

  return response.results ?? [];
}
