// ─── Reminder Prompt ──────────────────────────────────────────────────────────
export const REMINDER_SYSTEM = `You are a proactive productivity coach sending smart reminders.
Do NOT send generic reminders. Every reminder must be personalized, specific, and actionable.
Include how much time is needed, what's at risk, and what to do right now.`;

export function buildReminderPrompt(input: {
  taskTitle: string;
  taskCategory: string;
  deadline: string;
  estimatedEffort: number;
  hoursRemaining: number;
  freeHoursAvailable: number;
  userPattern?: string;
}): string {
  return JSON.stringify({
    instruction:
      "Generate a single personalized, actionable reminder message for this task. It should state the risk, estimated time needed, and a specific recommended action.",
    task: input,
    responseSchema: {
      message: "The reminder message (2-3 sentences, specific and actionable)",
      urgencyLevel: "low|medium|high|critical",
      recommendedAction: "Single most important next step",
    },
  });
}

// ─── Weekly Review Prompt ─────────────────────────────────────────────────────
export const WEEKLY_REVIEW_SYSTEM = `You are a personal productivity analyst generating weekly performance reviews.
Be encouraging but honest. Identify specific patterns, celebrate wins, and give actionable advice.
Base your analysis entirely on the provided data.`;

export function buildWeeklyReviewPrompt(input: {
  completedTasks: { title: string; category: string; completedAt: string }[];
  missedTasks: { title: string; category: string; deadline: string }[];
  goalCompletionRate: number;
  habitPerformance: { name: string; completionRate: number }[];
  tasksByCategory: Record<string, { completed: number; missed: number }>;
  weekStart: string;
  weekEnd: string;
}): string {
  return JSON.stringify({
    instruction:
      "Generate a comprehensive weekly productivity review. Identify patterns, celebrate achievements, explain what went wrong, and give 3 specific recommendations for next week.",
    weekPeriod: { start: input.weekStart, end: input.weekEnd },
    performance: {
      completedTasks: input.completedTasks,
      missedTasks: input.missedTasks,
      goalCompletionRate: input.goalCompletionRate,
      habitPerformance: input.habitPerformance,
      tasksByCategory: input.tasksByCategory,
    },
    responseSchema: {
      title: "Weekly review title",
      summary:
        "2-3 paragraph narrative summary of the week",
      achievements: ["List of specific achievements"],
      areasForImprovement: ["Specific things that need work"],
      patterns: [
        "Behavioral patterns identified (e.g., 'You complete coding tasks best after 8pm')",
      ],
      recommendations: ["3 specific, actionable recommendations for next week"],
      motivationalMessage: "One encouraging closing sentence",
    },
  });
}

// ─── Context Awareness Prompt ─────────────────────────────────────────────────
export const CONTEXT_AWARENESS_SYSTEM = `You are a behavioral productivity analyst.
Analyze task completion data to identify patterns in user behavior.
Focus on time-of-day patterns, category strengths/weaknesses, and postponement triggers.`;

export function buildContextAwarenessPrompt(input: {
  recentCompletions: {
    taskTitle: string;
    category: string;
    completedAt: string;
    estimatedEffort: number;
    actualEffort?: number;
  }[];
  recentMisses: { taskTitle: string; category: string; deadline: string }[];
  existingProfile: {
    bestWorkHours: number[];
    postponePatterns: string[];
    avgCompletionRate: number;
  };
}): string {
  return JSON.stringify({
    instruction:
      "Analyze this user's task completion behavior and update their productivity profile. Identify their best working hours, categories they struggle with, and patterns.",
    data: input,
    responseSchema: {
      bestWorkHours: [
        "Array of hours (0-23) when user is most productive based on completions",
      ],
      postponePatterns: ["Categories or task types the user frequently postpones"],
      insights: [
        "3-5 specific behavioral insights",
      ],
      schedulingRecommendations: [
        "Specific advice for scheduling future tasks",
      ],
    },
  });
}

// ─── Subtask Decomposition Prompt ────────────────────────────────────────────
export const SUBTASK_SYSTEM = `You are an expert project manager.
Break complex tasks into concrete, actionable subtasks that can each be completed in 30-90 minutes.
Order them logically. Be specific.`;

export function buildSubtaskPrompt(input: {
  taskTitle: string;
  taskDescription?: string;
  taskCategory: string;
  totalEstimatedEffort: number;
  deadline?: string;
}): string {
  return JSON.stringify({
    instruction:
      "Break this task into 4-8 specific, actionable subtasks. Each should be completable in 30-90 minutes. Order them logically.",
    task: input,
    responseSchema: {
      subtasks: [
        {
          title: "Specific subtask title",
          estimatedEffort: "minutes (30-90)",
          order: "number starting at 1",
        },
      ],
      executionNotes: "Brief note on the recommended approach",
    },
  });
}

// ─── Calendar Gap Intelligence Prompt ────────────────────────────────────────
export const GAP_INTELLIGENCE_SYSTEM = `You are a smart scheduling assistant.
Given free time slots and pending tasks, suggest the best task-to-slot assignments.
Consider task priority, effort required, and user productive hours.`;

export function buildGapIntelligencePrompt(input: {
  gaps: { start: string; end: string; durationMinutes: number }[];
  pendingTasks: {
    id: string;
    title: string;
    priority: string;
    estimatedEffort: number;
    deadline?: string;
  }[];
  productiveHours: number[];
}): string {
  return JSON.stringify({
    instruction:
      "Match free calendar slots with pending tasks. Suggest the best task for each significant gap (>30 minutes). Explain why each match is optimal.",
    gaps: input.gaps,
    pendingTasks: input.pendingTasks,
    userProductiveHours: input.productiveHours,
    responseSchema: {
      suggestions: [
        {
          gapStart: "ISO datetime",
          gapEnd: "ISO datetime",
          suggestedTaskId: "task id",
          suggestedTaskTitle: "task title",
          reasoning: "Why this task fits this slot",
          confidence: "high|medium|low",
        },
      ],
    },
  });
}
