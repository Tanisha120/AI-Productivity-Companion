import { getCalendarClient } from "@/lib/google-calendar";
import { connectDB } from "@/lib/db";
import { CalendarEvent } from "@/models/CalendarEvent";
import { User } from "@/models/User";
import { generateJSON } from "@/lib/gemini";
import {
  GAP_INTELLIGENCE_SYSTEM,
  buildGapIntelligencePrompt,
} from "@/prompts/reminder.prompt";
import { differenceInMinutes, startOfDay, endOfDay, addDays } from "date-fns";
import type { CalendarGap } from "@/types/ai.types";
import type { TaskDocument } from "@/models/Task";

export async function syncGoogleCalendar(userId: string): Promise<number> {
  await connectDB();

  const user = await User.findById(userId).select(
    "+googleAccessToken +googleRefreshToken"
  );
  if (!user?.googleAccessToken) return 0;

  const calendar = getCalendarClient(
    user.googleAccessToken,
    user.googleRefreshToken
  );

  const now = new Date();
  const thirtyDaysOut = addDays(now, 30);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: thirtyDaysOut.toISOString(),
    maxResults: 250,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items ?? [];
  let synced = 0;

  for (const event of events) {
    if (!event.id || event.status === "cancelled") continue;

    const startTime = event.start?.dateTime
      ? new Date(event.start.dateTime)
      : new Date(event.start?.date + "T00:00:00");
    const endTime = event.end?.dateTime
      ? new Date(event.end.dateTime)
      : new Date(event.end?.date + "T23:59:59");

    await CalendarEvent.findOneAndUpdate(
      { userId, googleEventId: event.id },
      {
        $set: {
          userId,
          googleEventId: event.id,
          title: event.summary ?? "Untitled Event",
          startTime,
          endTime,
          isBlocked: true,
          source: "google",
        },
      },
      { upsert: true }
    );
    synced++;
  }

  return synced;
}

export async function getCalendarEvents(
  userId: string,
  start: Date,
  end: Date
) {
  await connectDB();
  return CalendarEvent.find({
    userId,
    startTime: { $gte: start },
    endTime: { $lte: end },
  }).sort({ startTime: 1 });
}

export async function getCalendarGaps(
  userId: string,
  date: Date,
  pendingTasks: TaskDocument[]
): Promise<CalendarGap[]> {
  await connectDB();

  const user = await User.findById(userId).select(
    "preferences behaviorProfile"
  );
  const workStart = user?.preferences?.workStartTime ?? "09:00";
  const workEnd = user?.preferences?.workEndTime ?? "18:00";
  const [startH, startM] = workStart.split(":").map(Number);
  const [endH, endM] = workEnd.split(":").map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(startH, startM, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(endH, endM, 0, 0);

  const events = await CalendarEvent.find({
    userId,
    startTime: { $gte: startOfDay(date) },
    endTime: { $lte: endOfDay(date) },
    isBlocked: true,
  }).sort({ startTime: 1 });

  // Compute free gaps
  const rawGaps: { start: Date; end: Date }[] = [];
  let cursor = dayStart;

  for (const event of events) {
    const es = new Date(event.startTime);
    const ee = new Date(event.endTime);
    if (es > cursor) rawGaps.push({ start: cursor, end: es });
    if (ee > cursor) cursor = ee;
  }
  if (cursor < dayEnd) rawGaps.push({ start: cursor, end: dayEnd });

  const significantGaps = rawGaps
    .filter((g) => differenceInMinutes(g.end, g.start) >= 30)
    .map((g) => ({
      start: g.start.toISOString(),
      end: g.end.toISOString(),
      durationMinutes: differenceInMinutes(g.end, g.start),
    }));

  if (significantGaps.length === 0 || pendingTasks.length === 0) {
    return significantGaps.map((g) => ({ ...g }));
  }

  // AI-powered gap intelligence
  const taskList = pendingTasks.map((t) => ({
    id: t._id.toString(),
    title: t.title,
    priority: t.priority,
    estimatedEffort: t.estimatedEffort,
    deadline: t.deadline?.toISOString(),
  }));

  const prompt = buildGapIntelligencePrompt({
    gaps: significantGaps,
    pendingTasks: taskList,
    productiveHours: user?.behaviorProfile?.bestWorkHours ?? [],
  });

  type GapSuggestionsResponse = {
    suggestions: {
      gapStart: string;
      gapEnd: string;
      suggestedTaskId: string;
      suggestedTaskTitle: string;
      reasoning: string;
    }[];
  };

  const aiResponse = await generateJSON<GapSuggestionsResponse>(
    prompt,
    GAP_INTELLIGENCE_SYSTEM
  );

  return significantGaps.map((gap) => {
    const suggestion = aiResponse.suggestions?.find(
      (s) => s.gapStart === gap.start
    );
    return {
      ...gap,
      aiSuggestion: suggestion?.reasoning,
      suggestedTaskId: suggestion?.suggestedTaskId,
      suggestedTaskTitle: suggestion?.suggestedTaskTitle,
    };
  });
}
