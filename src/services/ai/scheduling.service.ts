import { generateJSON } from "@/lib/gemini";
import { SCHEDULING_SYSTEM, buildSchedulingPrompt } from "@/prompts/scheduling.prompt";
import type { ScheduleResult } from "@/types/ai.types";
import { format, differenceInMinutes } from "date-fns";
import type { ICalendarEvent } from "@/types/calendar.types";

function computeFreeSlots(
  calendarEvents: ICalendarEvent[],
  workStart: string,
  workEnd: string,
  date: Date
): { start: string; end: string; durationMinutes: number }[] {
  const dateStr = format(date, "yyyy-MM-dd");
  const [startH, startM] = workStart.split(":").map(Number);
  const [endH, endM] = workEnd.split(":").map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(startH, startM, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(endH, endM, 0, 0);

  // Get blocked events for this day
  const blocks = calendarEvents
    .filter((e) => {
      const es = new Date(e.startTime);
      return (
        format(es, "yyyy-MM-dd") === dateStr && e.isBlocked
      );
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

  const slots: { start: string; end: string; durationMinutes: number }[] = [];
  let cursor = dayStart;

  for (const block of blocks) {
    const blockStart = new Date(block.startTime);
    const blockEnd = new Date(block.endTime);

    if (blockStart > cursor) {
      const dur = differenceInMinutes(blockStart, cursor);
      if (dur >= 30) {
        slots.push({
          start: cursor.toISOString(),
          end: blockStart.toISOString(),
          durationMinutes: dur,
        });
      }
    }
    if (blockEnd > cursor) cursor = blockEnd;
  }

  // Remaining time after last block
  if (cursor < dayEnd) {
    const dur = differenceInMinutes(dayEnd, cursor);
    if (dur >= 30) {
      slots.push({
        start: cursor.toISOString(),
        end: dayEnd.toISOString(),
        durationMinutes: dur,
      });
    }
  }

  return slots;
}

export async function generateDailySchedule(
  tasks: {
    id: string;
    title: string;
    estimatedEffort: number;
    priority: string;
    deadline?: string;
    category: string;
  }[],
  calendarEvents: ICalendarEvent[],
  preferences: {
    workStartTime: string;
    workEndTime: string;
    productiveHours: number[];
    timezone: string;
  },
  date: Date = new Date()
): Promise<ScheduleResult> {
  const freeSlots = computeFreeSlots(
    calendarEvents,
    preferences.workStartTime,
    preferences.workEndTime,
    date
  );

  const calendarBlocks = calendarEvents
    .filter((e) => {
      return (
        format(new Date(e.startTime), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );
    })
    .map((e) => ({
      start: new Date(e.startTime).toISOString(),
      end: new Date(e.endTime).toISOString(),
      title: e.title,
    }));

  const prompt = buildSchedulingPrompt({
    tasks,
    calendarBlocks,
    freeSlots,
    date: format(date, "yyyy-MM-dd"),
    workStartTime: preferences.workStartTime,
    workEndTime: preferences.workEndTime,
    productiveHours: preferences.productiveHours,
  });

  return generateJSON<ScheduleResult>(prompt, SCHEDULING_SYSTEM);
}
