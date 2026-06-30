"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Sparkles, Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toggleSubtaskAction } from "@/actions/task.actions";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { ISubTask } from "@/types/task.types";
import { formatDuration } from "@/utils/date";

interface SubTaskListProps {
  taskId: string;
  subtasks: ISubTask[];
  onUpdate?: () => void;
}

export function SubTaskList({ taskId, subtasks, onUpdate }: SubTaskListProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const completedCount = subtasks.filter((s) => s.status === "completed").length;
  const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  const handleToggle = async (subtask: ISubTask) => {
    setToggling(subtask._id);
    try {
      await toggleSubtaskAction(subtask._id, subtask.status !== "completed");
      onUpdate?.();
    } catch {
      toast({ title: "Failed to update subtask", variant: "destructive" });
    } finally {
      setToggling(null);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Subtasks generated!", variant: "success" as never });
      onUpdate?.();
    } catch {
      toast({ title: "Failed to generate subtasks", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Subtasks
          {subtasks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {completedCount}/{subtasks.length}
            </span>
          )}
        </button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          AI Generate
        </Button>
      </div>

      {subtasks.length > 0 && (
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full gradient-brand transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {expanded && (
        <div className="space-y-1.5">
          {subtasks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              No subtasks yet. Use AI to auto-generate them.
            </p>
          ) : (
            subtasks.map((subtask) => (
              <button
                key={subtask._id}
                onClick={() => handleToggle(subtask)}
                disabled={toggling === subtask._id}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all",
                  "hover:bg-secondary border border-transparent hover:border-border",
                  subtask.status === "completed" && "opacity-60"
                )}
              >
                {toggling === subtask._id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                ) : subtask.status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={cn("flex-1", subtask.status === "completed" && "line-through text-muted-foreground")}>
                  {subtask.title}
                </span>
                {subtask.estimatedEffort > 0 && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDuration(subtask.estimatedEffort)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
