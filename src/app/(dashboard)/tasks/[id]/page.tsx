import { auth } from "@/lib/auth";
import { getTaskById } from "@/services/task.service";
import { Header } from "@/components/shared/Header";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/tasks/RiskBadge";
import { AIActionButtons } from "@/components/tasks/AIActionButtons";
import { SubTaskList } from "@/components/tasks/SubTaskList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Tag, AlertTriangle, Sparkles } from "lucide-react";
import { formatDeadline, formatDuration } from "@/utils/date";
import { notFound } from "next/navigation";

const PRIORITY_BADGES = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
} as const;

type PageProps = { params: Promise<{ id: string }> };

export default async function TaskDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const result = await getTaskById(session.user.id, id);
  if (!result) notFound();

  const { task, subtasks } = result;
  const taskData = task.toObject ? task.toObject() : task;

  return (
    <div>
      <Header
        title={taskData.title}
        subtitle={`${taskData.category} · ${taskData.status}`}
      />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title + badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant={PRIORITY_BADGES[taskData.priority as keyof typeof PRIORITY_BADGES]}>
                  {taskData.priority} priority
                </Badge>
                <Badge variant={taskData.status === "completed" ? "success" : "secondary"}>
                  {taskData.status}
                </Badge>
                {taskData.riskScore > 0 && <RiskBadge score={taskData.riskScore} />}
              </div>

              {taskData.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {taskData.description}
                </p>
              )}
            </div>

            {/* Metadata */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {taskData.deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Deadline</p>
                        <p className="font-medium">{formatDeadline(taskData.deadline)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated Effort</p>
                      <p className="font-medium">{formatDuration(taskData.estimatedEffort)}</p>
                    </div>
                  </div>
                  {taskData.tags?.length > 0 && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {taskData.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subtasks */}
            <Card>
              <CardContent className="p-5">
                <SubTaskList
                  taskId={id}
                  subtasks={subtasks.map((s) => ({
                    _id: s._id.toString(),
                    taskId: taskId(s),
                    title: s.title,
                    status: s.status,
                    estimatedEffort: s.estimatedEffort,
                    order: s.order,
                    createdAt: s.createdAt,
                  }))}
                />
              </CardContent>
            </Card>

            {/* AI Actions */}
            <AIActionButtons taskId={id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Risk details */}
            {taskData.riskScore > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <RiskBadge score={taskData.riskScore} />
                    <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500 transition-all"
                        style={{ width: `${taskData.riskScore}%` }}
                      />
                    </div>
                  </div>
                  {taskData.riskExplanation && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {taskData.riskExplanation}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Reasoning */}
            {taskData.priorityReasoning && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Priority Reasoning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {taskData.priorityReasoning}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function taskId(s: { taskId: unknown }) {
  if (typeof s.taskId === "string") return s.taskId;
  if (s.taskId && typeof (s.taskId as { toString(): string }).toString === "function") {
    return (s.taskId as { toString(): string }).toString();
  }
  return "";
}
