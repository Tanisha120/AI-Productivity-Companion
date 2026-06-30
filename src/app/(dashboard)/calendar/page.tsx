"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, Loader2, Sparkles, Clock, Zap } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { ICalendarEvent } from "@/types/calendar.types";
import type { CalendarGap } from "@/types/ai.types";

export default function CalendarPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<ICalendarEvent[]>([]);
  const [gaps, setGaps] = useState<CalendarGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loadingGaps, setLoadingGaps] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/events?days=14");
      const data = await res.json();
      setEvents(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGaps = useCallback(async (date: Date) => {
    setLoadingGaps(true);
    try {
      const res = await fetch(`/api/calendar/gaps?date=${date.toISOString()}`);
      const data = await res.json();
      setGaps(data.data ?? []);
    } finally {
      setLoadingGaps(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchGaps(selectedDate); }, [selectedDate, fetchGaps]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/events?sync=true");
      const data = await res.json();
      toast({ title: `Synced ${data.synced} events from Google Calendar`, variant: "success" as never });
      fetchEvents();
    } catch {
      toast({ title: "Calendar sync failed", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const eventsForDay = (date: Date) =>
    events.filter((e) => isSameDay(new Date(e.startTime), date));

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const formatTime = (d: string | Date) => format(new Date(d), "h:mm a");

  return (
    <div>
      <Header title="Calendar" subtitle="Smart scheduling & free time detection" />
      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            {syncing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />}
            Sync Google Calendar
          </Button>
          <span className="text-xs text-muted-foreground">{events.length} events synced</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Week view */}
          <div className="lg:col-span-2 space-y-4">
            {/* Day selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {next7Days.map((day) => {
                const dayEvents = eventsForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border transition-all",
                      isSelected
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border hover:border-border/80 hover:bg-secondary"
                    )}
                  >
                    <span className="text-xs text-muted-foreground">{format(day, "EEE")}</span>
                    <span className="text-lg font-bold">{format(day, "d")}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Events for selected day */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {format(selectedDate, "EEEE, MMMM d")}
                  <Badge variant="secondary" className="text-xs ml-1">
                    {eventsForDay(selectedDate).length} events
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : eventsForDay(selectedDate).length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No events scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventsForDay(selectedDate)
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map((event) => (
                        <div
                          key={event._id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border/50"
                        >
                          <div className="w-1 h-10 rounded-full bg-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{event.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatTime(event.startTime)} – {formatTime(event.endTime)}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {event.source}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Gap Intelligence */}
          <div>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Free Time Slots
                  <span className="text-xs text-muted-foreground font-normal">AI-suggested</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingGaps ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : gaps.length === 0 ? (
                  <div className="text-center py-8">
                    <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No free slots found</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Your day looks fully booked!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gaps.map((gap, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-border/50 bg-primary/5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Clock className="w-3 h-3 text-primary" />
                            {formatTime(gap.start)} – {formatTime(gap.end)}
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {gap.durationMinutes}m free
                          </Badge>
                        </div>

                        {gap.suggestedTaskTitle && (
                          <div className="flex items-start gap-1.5">
                            <Sparkles className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-primary">
                                {gap.suggestedTaskTitle}
                              </p>
                              {gap.aiSuggestion && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                  {gap.aiSuggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
