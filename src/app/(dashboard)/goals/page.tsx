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
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Target, CheckCircle2, Circle, Loader2, Trophy } from "lucide-react";
import { createGoalAction, toggleMilestoneAction } from "@/actions/goal.actions";
import { useToast } from "@/components/ui/toaster";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Milestone { title: string; completed: boolean; dueDate?: string }
interface Goal {
  _id: string;
  title: string;
  description?: string;
  type: "daily" | "weekly" | "monthly";
  targetDate: string;
  progress: number;
  status: "active" | "completed" | "abandoned";
  milestones: Milestone[];
}

const TYPE_COLORS = {
  daily: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  weekly: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  monthly: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function GoalsPage() {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [togglingMilestone, setTogglingMilestone] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", type: "weekly" as "daily"|"weekly"|"monthly",
    targetDate: "", milestoneText: "",
    milestones: [] as { title: string }[],
  });

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      setGoals(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const addMilestone = () => {
    if (!form.milestoneText.trim()) return;
    setForm({ ...form, milestones: [...form.milestones, { title: form.milestoneText }], milestoneText: "" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.targetDate) return;
    try {
      await createGoalAction({
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        targetDate: new Date(form.targetDate).toISOString(),
        milestones: form.milestones,
      });
      toast({ title: "Goal created!", variant: "success" as never });
      setFormOpen(false);
      setForm({ title: "", description: "", type: "weekly", targetDate: "", milestoneText: "", milestones: [] });
      fetchGoals();
    } catch {
      toast({ title: "Failed to create goal", variant: "destructive" });
    }
  };

  const handleToggleMilestone = async (goalId: string, index: number) => {
    setTogglingMilestone(`${goalId}-${index}`);
    try {
      await toggleMilestoneAction(goalId, index);
      fetchGoals();
    } catch {
      toast({ title: "Failed to update milestone", variant: "destructive" });
    } finally {
      setTogglingMilestone(null);
    }
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <div>
      <Header title="Goals" subtitle={`${activeGoals.length} active goal${activeGoals.length !== 1 ? "s" : ""}`} />
      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active", value: activeGoals.length, icon: "🎯" },
            { label: "Completed", value: completedGoals.length, icon: "🏆" },
            {
              label: "Avg Progress",
              value: activeGoals.length > 0
                ? `${Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length)}%`
                : "0%",
              icon: "📈",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Goals list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Active Goals</h2>
            <Button variant="brand" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4" />
              New Goal
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : activeGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Target className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground mb-2">No active goals</p>
                <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
                  <Plus className="w-3.5 h-3.5" /> Set your first goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => (
                <Card key={goal._id} className={cn(goal.progress >= 100 && "border-green-500/20")}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm leading-snug">{goal.title}</CardTitle>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-md border flex-shrink-0", TYPE_COLORS[goal.type])}>
                        {goal.type}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-xs text-muted-foreground">{goal.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} />
                    </div>

                    {/* Target date */}
                    <p className="text-xs text-muted-foreground">
                      Target: {format(new Date(goal.targetDate), "MMM d, yyyy")}
                    </p>

                    {/* Milestones */}
                    {goal.milestones.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium">
                          Milestones ({goal.milestones.filter((m) => m.completed).length}/{goal.milestones.length})
                        </p>
                        {goal.milestones.map((m, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleToggleMilestone(goal._id, idx)}
                            disabled={togglingMilestone === `${goal._id}-${idx}`}
                            className="w-full flex items-center gap-2 text-xs text-left hover:bg-secondary/50 px-2 py-1.5 rounded-md transition-colors"
                          >
                            {togglingMilestone === `${goal._id}-${idx}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary flex-shrink-0" />
                            ) : m.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className={cn(m.completed && "line-through text-muted-foreground")}>{m.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Completed Goals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedGoals.map((goal) => (
                <Card key={goal._id} className="opacity-70 border-green-500/20 bg-green-500/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Completed · Target was {format(new Date(goal.targetDate), "MMM d")}
                      </p>
                    </div>
                    <Badge variant="success" className="ml-auto flex-shrink-0">Done</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create goal dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="What do you want to achieve?"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Why is this goal important?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "daily"|"weekly"|"monthly" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target Date *</Label>
                <Input
                  type="datetime-local"
                  value={form.targetDate}
                  onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                  required
                />
              </div>
            </div>
            {/* Milestones */}
            <div className="space-y-1.5">
              <Label>Milestones</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a milestone…"
                  value={form.milestoneText}
                  onChange={(e) => setForm({ ...form, milestoneText: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMilestone())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addMilestone}>Add</Button>
              </div>
              {form.milestones.length > 0 && (
                <div className="space-y-1 mt-2">
                  {form.milestones.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs px-2 py-1 bg-secondary rounded-md">
                      <Circle className="w-3 h-3 text-muted-foreground" />
                      <span>{m.title}</span>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, milestones: form.milestones.filter((_, j) => j !== i) })}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" variant="brand">Create Goal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
