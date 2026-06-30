"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/select";
import { RiskBadge } from "./RiskBadge";
import {
  CheckCircle2, Circle, Clock, ChevronDown, ChevronUp,
  Trash2, Sparkles, Calendar, Tag,
} from "lucide-react";
import { formatDeadline, formatDuration } from "@/utils/date";
import { completeTaskAction, deleteTaskAction } from "@/actions/task.actions";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { ITask } from "@/types/task.types";
import Link from "next/link";

const PRIORITY_COLORS = {
  critical: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  high: "text-red-400 border-red-500/30 bg-red-500/10",
  medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  low: "text-green-400 border-green-500/30 bg-green-500/10",
};

const CATEGORY_ICONS: Record<string, string> = {
  assignment: "📚", bill: "💳", interview: "🎯", resume: "📄",
  meeting: "🤝", personal: "⭐", work: "💼", other: "📌",
};

interface TaskCardProps {
  task: ITask;
  onUpdate?: () => void;
  compact?: boolean;
}

export function TaskCard({ task, onUpdate, compact = false }: TaskCardProps) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const isCompleted = task.status === "completed";
  const isMissed = task.status === "missed";

  const handleComplete = async () => {
    if (isCompleted) return;
    setLoading(true);
    try {
      await completeTaskAction(task._id);
      toast({ title: "Task completed! 🎉", variant: "success" as never });
      onUpdate?.();
    } catch {
      toast({ title: "Failed to update task", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteTaskAction(task._id);
      toast({ title: "Task deleted" });
      onUpdate?.();
    } catch {
      toast({ title: "Failed to delete task", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:border-border/80 group",
        isCompleted && "opacity-60",
        isMissed && "border-red-500/20 bg-red-500/5",
        !compact && "hover:shadow-md hover:shadow-black/20"
      )}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex items-start gap-3">
          {/* Completion toggle */}
          <button
            onClick={handleComplete}
            disabled={loading || isCompleted}
            className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/tasks/${task._id}`}
                className={cn(
                  "text-sm font-medium leading-snug hover:text-primary transition-colors",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {CATEGORY_ICONS[task.category] ?? "📌"} {task.title}
              </Link>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0 border",
                    PRIORITY_COLORS[task.priority]
                  )}
                >
                  {task.priority}
                </Badge>
                {task.riskScore > 0 && (
                  <RiskBadge score={task.riskScore} size="sm" />
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
              {task.deadline && (
                <span className={cn("flex items-center gap-1", task.riskScore >= 60 && "text-red-400")}>
                  <Calendar className="w-3 h-3" />
                  {formatDeadline(task.deadline)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(task.estimatedEffort)}
              </span>
              {task.tags?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {task.tags.slice(0, 2).join(", ")}
                </span>
              )}
            </div>

            {/* AI suggestions preview */}
            {!compact && task.aiSuggestions?.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  {task.aiSuggestions.length} AI actions
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {expanded && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {task.aiSuggestions.slice(0, 4).map((s) => (
                      <Link
                        key={s}
                        href={`/tasks/${task._id}`}
                        className="text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        {s}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Risk explanation */}
            {!compact && task.riskExplanation && task.riskScore >= 60 && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                ⚠️ {task.riskExplanation}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
