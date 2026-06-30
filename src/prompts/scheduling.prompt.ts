export const SCHEDULING_SYSTEM = `You are an expert daily planner and scheduling assistant.
Create realistic, optimized schedules that respect user preferences and calendar constraints.
Always return valid JSON. Do not schedule tasks during blocked calendar times.
Leave buffer time between tasks. Respect work hours unless tasks are personal.`;

export function buildSchedulingPrompt(input: {
  tasks: {
    id: string;
    title: string;
    estimatedEffort: number;
    priority: string;
    deadline?: string;
    category: string;
  }[];
  calendarBlocks: { start: string; end: string; title: string }[];
  freeSlots: { start: string; end: string; durationMinutes: number }[];
  date: string;
  workStartTime: string;
  workEndTime: string;
  productiveHours: number[];
}): string {
  return JSON.stringify({
    instruction:
      "Create an optimized daily schedule for the given date. Assign tasks to free time slots. Respect calendar blocks. Place high-priority tasks during productive hours. Add short breaks. Return a schedule with specific time blocks.",
    date: input.date,
    tasks: input.tasks,
    calendarBlocks: input.calendarBlocks,
    freeSlots: input.freeSlots,
    preferences: {
      workStartTime: input.workStartTime,
      workEndTime: input.workEndTime,
      productiveHours: input.productiveHours,
    },
    responseSchema: {
      date: "YYYY-MM-DD",
      blocks: [
        {
          taskId: "string",
          taskTitle: "string",
          startTime: "HH:MM",
          endTime: "HH:MM",
          note: "optional string",
        },
      ],
      totalScheduledMinutes: "number",
      unscheduledTasks: ["taskId strings that could not fit"],
      dailySummary: "string",
    },
  });
}
