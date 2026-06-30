export interface ICalendarEvent {
  _id: string;
  userId: string;
  googleEventId?: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isBlocked: boolean;
  source: "google" | "manual";
  createdAt: Date;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  status?: string;
}
