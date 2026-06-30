import { generateJSON, generateText } from "@/lib/gemini";
import {
  ACTION_SUGGESTIONS_SYSTEM,
  buildActionSuggestionsPrompt,
  buildExecuteActionPrompt,
} from "@/prompts/action-suggestions.prompt";
import type { ActionSuggestion } from "@/types/ai.types";
import type { TaskCategory } from "@/types/task.types";

interface ActionSuggestionsResponse {
  actions: ActionSuggestion[];
}

export async function getActionSuggestions(task: {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  deadline?: string;
  estimatedEffort: number;
  status: string;
}): Promise<ActionSuggestion[]> {
  const prompt = buildActionSuggestionsPrompt({
    taskTitle: task.title,
    taskDescription: task.description,
    taskCategory: task.category,
    deadline: task.deadline,
    estimatedEffort: task.estimatedEffort,
    currentStatus: task.status,
  });

  const response = await generateJSON<ActionSuggestionsResponse>(
    prompt,
    ACTION_SUGGESTIONS_SYSTEM
  );

  return response.actions ?? [];
}

export async function executeAction(
  taskTitle: string,
  taskDescription: string | undefined,
  actionType: string,
  actionLabel: string
): Promise<string> {
  const systemInstruction = `You are a highly capable AI productivity assistant.
Provide detailed, specific, immediately actionable responses.
Format your response in clean Markdown with headers and bullet points where appropriate.`;

  const prompt = buildExecuteActionPrompt(
    taskTitle,
    taskDescription,
    actionType,
    actionLabel
  );

  return generateText(prompt, systemInstruction);
}

export async function generateSubtasks(task: {
  title: string;
  description?: string;
  category: string;
  estimatedEffort: number;
  deadline?: string;
}): Promise<{ title: string; estimatedEffort: number; order: number }[]> {
  const { buildSubtaskPrompt, SUBTASK_SYSTEM } = await import(
    "@/prompts/reminder.prompt"
  );

  const prompt = buildSubtaskPrompt({
    taskTitle: task.title,
    taskDescription: task.description,
    taskCategory: task.category,
    totalEstimatedEffort: task.estimatedEffort,
    deadline: task.deadline,
  });

  const response = await generateJSON<{
    subtasks: { title: string; estimatedEffort: number; order: number }[];
  }>(prompt, SUBTASK_SYSTEM);

  return response.subtasks ?? [];
}
