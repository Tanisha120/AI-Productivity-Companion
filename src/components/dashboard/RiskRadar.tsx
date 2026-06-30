import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/tasks/RiskBadge";
import { AlertTriangle, Clock } from "lucide-react";
import { formatDeadline } from "@/utils/date";
import Link from "next/link";
import type { ITask } from "@/types/task.types";
import { cn } from "@/lib/utils";

interface RiskRadarProps {
  tasks: ITask[];
}

export function RiskRadar({ tasks }: RiskRadarProps) {
  const atRisk = tasks
    .filter((t) => t.riskScore >= 35 && t.status !== "completed")
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Risk Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {atRisk.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">All tasks on track!</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">No high-risk tasks right now</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {atRisk.map((task) => (
              <Link
                key={task._id}
                href={`/tasks/${task._id}`}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg border transition-all hover:border-border/80",
                  task.riskScore >= 80
                    ? "border-purple-500/20 bg-purple-500/5"
                    : task.riskScore >= 60
                      ? "border-red-500/20 bg-red-500/5"
                      : "border-amber-500/20 bg-amber-500/5"
                )}
              >
                <RiskBadge score={task.riskScore} size="sm" showScore />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{task.title}</p>
                  {task.deadline && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDeadline(task.deadline)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
