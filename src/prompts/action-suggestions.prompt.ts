import type { TaskCategory } from "@/types/task.types";

export const ACTION_SUGGESTIONS_SYSTEM = `You are a productivity coach who gives specific, immediately actionable suggestions.
Generate context-aware action buttons for tasks based on their category and content.
Each action should be something the user can do RIGHT NOW to make progress.
Return valid JSON only.`;

// Category-specific action templates for fallback/hint
export const CATEGORY_ACTION_HINTS: Record<TaskCategory, string[]> = {
  resume: [
    "Improve ATS Score",
    "Suggest Missing Skills",
    "Generate LinkedIn Summary",
    "Create Cover Letter",
    "Rewrite Bullet Points",
  ],
  interview: [
    "Generate Mock Questions",
    "Create Study Plan",
    "Behavioral Interview Practice",
    "Identify Weak Topics",
    "Research Company",
  ],
  assignment: [
    "Break Into Subtasks",
    "Generate Study Plan",
    "Find Learning Resources",
    "Create Outline",
    "Summarize Key Concepts",
  ],
  bill: [
    "Find Payment Link",
    "Set Up Auto-Pay Reminder",
    "Calculate Budget Impact",
    "Check Payment History",
  ],
  meeting: [
    "Generate Agenda",
    "Prepare Discussion Points",
    "Create Follow-up Template",
    "Research Attendees",
  ],
  work: [
    "Break Into Subtasks",
    "Create Project Plan",
    "Identify Blockers",
    "Draft Status Update",
  ],
  personal: ["Create Action Plan", "Find Resources", "Set Milestones"],
  other: ["Break Into Subtasks", "Create Action Plan", "Set Reminders"],
};

export function buildActionSuggestionsPrompt(input: {
  taskTitle: string;
  taskDescription?: string;
  taskCategory: TaskCategory;
  deadline?: string;
  estimatedEffort: number;
  currentStatus: string;
}): string {
  const hints = CATEGORY_ACTION_HINTS[input.taskCategory] ?? [];
  return JSON.stringify({
    instruction:
      "Generate 4-6 specific, actionable AI-powered action buttons for this task. Each action should directly help complete this task. Consider the task title, category, and deadline.",
    task: input,
    categoryHints: hints,
    responseSchema: {
      actions: [
        {
          label: "Short button label (2-4 words)",
          description: "What this action does (1 sentence)",
          actionType: "unique_action_identifier",
          promptTemplate:
            "The AI prompt that will execute this action when clicked",
        },
      ],
    },
  });
}

export function buildExecuteActionPrompt(
  taskTitle: string,
  taskDescription: string | undefined,
  actionType: string,
  actionLabel: string
): string {
  return JSON.stringify({
    instruction: `Execute the following productivity action for the given task. Provide a detailed, immediately useful response.`,
    task: { title: taskTitle, description: taskDescription },
    action: { type: actionType, label: actionLabel },
    responseFormat:
      "Markdown formatted response with clear sections. Be specific and actionable. Minimum 200 words.",
  });
}
