import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isPast,
  addHours,
  differenceInHours,
  differenceInMinutes,
  startOfDay,
  endOfDay,
} from "date-fns";

export function formatDeadline(date: Date | string | undefined): string {
  if (!date) return "No deadline";
  const d = new Date(date);
  if (isToday(d)) return `Today ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow ${format(d, "h:mm a")}`;
  if (isPast(d)) return `Overdue (${format(d, "MMM d")})`;
  return format(d, "MMM d, h:mm a");
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getHoursUntilDeadline(deadline: Date | string): number {
  return differenceInHours(new Date(deadline), new Date());
}

export function getMinutesUntilDeadline(deadline: Date | string): number {
  return differenceInMinutes(new Date(deadline), new Date());
}

export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  return { start: startOfDay(now), end: endOfDay(now) };
}

export function getTimeSlots(
  startHour: number,
  endHour: number,
  intervalMinutes = 30
): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

export function addHoursToDate(date: Date, hours: number): Date {
  return addHours(date, hours);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
