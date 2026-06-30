"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, Sparkles, Clock } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import type { ScheduleResult } from "@/types/ai.types";

export function DailySchedule() {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: new Date().toISOString() }),
      });
      const data = await res.json();
      setSchedule(data.data);
    } catch {
      toast({ title: "Failed to generate schedule", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["bg-blue-500/20 border-blue-500/30 text-blue-300",
    "bg-purple-500/20 border-purple-500/30 text-purple-300",
    "bg-green-500/20 border-green-500/30 text-green-300",
    "bg-amber-500/20 border-amber-500/30 text-amber-300",
    "bg-pink-500/20 border-pink-500/30 text-pink-300"];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Today&apos;s Schedule
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={generateSchedule}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {schedule ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!schedule ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No schedule yet</p>
            <p className="text-xs text-muted-foreground/60">
              Click Generate to get an AI-optimized schedule
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedule.blocks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks could be scheduled for today.
              </p>
            ) : (
              schedule.blocks.map((block, i) => (
                <div
                  key={`${block.taskId}-${i}`}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${COLORS[i % COLORS.length]}`}
                >
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span className="font-mono font-medium">
                      {block.startTime}–{block.endTime}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{block.taskTitle}</p>
                    {block.note && (
                      <p className="opacity-70 mt-0.5 line-clamp-1">{block.note}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {schedule.unscheduledTasks?.length > 0 && (
              <p className="text-xs text-muted-foreground pt-2">
                ⚠️ {schedule.unscheduledTasks.length} task(s) could not fit today
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
