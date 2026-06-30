import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncGoogleCalendar, getCalendarEvents } from "@/services/calendar.service";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sync = searchParams.get("sync") === "true";
  const daysAhead = parseInt(searchParams.get("days") ?? "7");

  if (sync) {
    const count = await syncGoogleCalendar(session.user.id);
    return NextResponse.json({ success: true, synced: count });
  }

  const start = startOfDay(new Date());
  const end = endOfDay(addDays(new Date(), daysAhead));
  const events = await getCalendarEvents(session.user.id, start, end);

  return NextResponse.json({ success: true, data: events });
}
