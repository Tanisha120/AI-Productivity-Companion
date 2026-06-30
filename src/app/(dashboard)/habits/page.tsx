"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { Plus, Flame, CheckCircle2, Circle, Loader2, Zap } from "lucide-react";
import { logHabitAction, createHabitAction } from "@/actions/goal.actions";
import { useToast } from "@/components/ui/toaster";
import { format, startOfDay, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface Habit {
  _id: string;
  title: string;
  description?: string;
  frequency: string;
  currentStreak: number;
  longestStreak: number;
  completionLog: { date: string; completed: boolean }[];
  color: string;
  icon: string;
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
}

export default function HabitsPage() {
  const { toast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState({ title: "", icon: "⚡", color: "#6172f3" });

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      setHabits(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const isCompletedToday = (habit: Habit) => {
    const today = format(startOfDay(new Date()), "yyyy-MM-dd");
    return habit.completionLog.some(
      (l) => format(startOfDay(new Date(l.date)), "yyyy-MM-dd") === today && l.completed
    );
  };

  const getWeekCompletion = (habit: Habit) => {
    const days = getLast7Days();
    return days.map((day) => {
      const dayStr = format(startOfDay(day), "yyyy-MM-dd");
      const log = habit.completionLog.find(
        (l) => format(startOfDay(new Date(l.date)), "yyyy-MM-dd") === dayStr
      );
      return { day, completed: log?.completed ?? false };
    });
  };

  const handleToggle = async (habit: Habit) => {
    setTogglingId(habit._id);
    try {
      await logHabitAction(habit._id, !isCompletedToday(habit));
      fetchHabits();
    } catch {
      toast({ title: "Failed to log habit", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHabitAction({ title: newHabit.title, icon: newHabit.icon, color: newHabit.color, frequency: "daily" });
      toast({ title: "Habit created!", variant: "success" as never });
      setFormOpen(false);
      setNewHabit({ title: "", icon: "⚡", color: "#6172f3" });
      fetchHabits();
    } catch {
      toast({ title: "Failed to create habit", variant: "destructive" });
    }
  };

  const totalCompleted = habits.filter(isCompletedToday).length;
  const overallRate = habits.length > 0 ? Math.round((totalCompleted / habits.length) * 100) : 0;

  return (
    <div>
      <Header title="Habits" subtitle={`${totalCompleted}/${habits.length} completed today`} />
      <div className="p-6 space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Today's Rate", value: `${overallRate}%`, icon: "🎯" },
            { label: "Avg Streak", value: habits.length > 0 ? Math.round(habits.reduce((s, h) => s + h.currentStreak, 0) / habits.length) : 0, icon: "🔥" },
            { label: "Total Habits", value: habits.length, icon: "⚡" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Habit list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Your Habits</h2>
            <Button variant="brand" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4" />
              New Habit
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : habits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Zap className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground mb-2">No habits yet</p>
                <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
                  <Plus className="w-3.5 h-3.5" />
                  Create your first habit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => {
                const done = isCompletedToday(habit);
                const week = getWeekCompletion(habit);
                const weekRate = Math.round((week.filter((d) => d.completed).length / 7) * 100);

                return (
                  <Card key={habit._id} className={cn(done && "border-green-500/20 bg-green-500/5")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Toggle */}
                        <button
                          onClick={() => handleToggle(habit)}
                          disabled={togglingId === habit._id}
                          className="flex-shrink-0"
                        >
                          {togglingId === habit._id ? (
                            <Loader2 className="w-7 h-7 animate-spin text-primary" />
                          ) : done ? (
                            <CheckCircle2 className="w-7 h-7 text-green-500" />
                          ) : (
                            <Circle className="w-7 h-7 text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </button>

                        {/* Icon + title */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xl">{habit.icon}</span>
                          <div className="min-w-0">
                            <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>
                              {habit.title}
                            </p>
                            <Progress value={weekRate} className="h-1 mt-1.5 w-24" />
                          </div>
                        </div>

                        {/* Streak */}
                        <div className="flex items-center gap-1 text-amber-400">
                          <Flame className="w-4 h-4" />
                          <span className="text-sm font-bold">{habit.currentStreak}</span>
                        </div>

                        {/* 7-day dots */}
                        <div className="hidden md:flex items-center gap-1">
                          {week.map(({ day, completed }) => (
                            <div
                              key={day.toISOString()}
                              title={format(day, "MMM d")}
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
                                completed
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-secondary text-muted-foreground"
                              )}
                            >
                              {format(day, "d")}
                            </div>
                          ))}
                        </div>

                        {done && <Badge variant="success" className="text-[10px]">Done</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create habit dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Habit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Morning meditation"
                value={newHabit.title}
                onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Icon (emoji)</Label>
              <Input
                placeholder="⚡"
                value={newHabit.icon}
                onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                maxLength={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" variant="brand">Create Habit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
