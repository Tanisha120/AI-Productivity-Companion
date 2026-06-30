"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface ProductivityInsightsProps {
  tasksByCategory: { category: string; completed: number; pending: number }[];
  completionRate: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  work: "#6172f3",
  assignment: "#8b5cf6",
  interview: "#06b6d4",
  resume: "#10b981",
  meeting: "#f59e0b",
  personal: "#ec4899",
  bill: "#ef4444",
  other: "#6b7280",
};

export function ProductivityInsights({
  tasksByCategory,
  completionRate,
}: ProductivityInsightsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Productivity Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Completion rate ring */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32" cy="32" r="26"
                fill="none" stroke="hsl(var(--secondary))" strokeWidth="6"
              />
              <circle
                cx="32" cy="32" r="26"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(completionRate / 100) * 163.4} 163.4`}
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {completionRate}%
            </span>
          </div>
          <div>
            <p className="text-sm font-medium">Overall Completion</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completionRate >= 80
                ? "🔥 Excellent performance!"
                : completionRate >= 60
                  ? "👍 Good progress"
                  : completionRate >= 40
                    ? "📈 Room to improve"
                    : "💪 Keep pushing"}
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        {tasksByCategory.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Tasks by Category</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={tasksByCategory} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="completed" stackId="a" radius={[0, 0, 0, 0]}>
                  {tasksByCategory.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[entry.category] ?? "#6b7280"}
                    />
                  ))}
                </Bar>
                <Bar dataKey="pending" stackId="a" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
