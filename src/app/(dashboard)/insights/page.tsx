"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Sparkles, Loader2, RefreshCw, Trophy, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AIInsight {
  _id: string;
  type: "weekly_review" | "productivity_pattern" | "recommendation";
  title: string;
  content: string;
  data?: {
    achievements?: string[];
    areasForImprovement?: string[];
    patterns?: string[];
    recommendations?: string[];
    motivationalMessage?: string;
  };
  generatedAt: string;
  read: boolean;
}

const TYPE_CONFIG = {
  weekly_review: { icon: Trophy, label: "Weekly Review", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  productivity_pattern: { icon: TrendingUp, label: "Pattern", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  recommendation: { icon: AlertCircle, label: "Recommendation", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
};

export default function InsightsPage() {
  const { toast } = useToast();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/insights?limit=20");
      const data = await res.json();
      setInsights(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  const handleGenerateReview = async () => {
    setGenerating(true);
    try {
      await fetch("/api/ai/weekly-review", { method: "POST" });
      toast({ title: "Weekly review generated! ✨", variant: "success" as never });
      fetchInsights();
    } catch {
      toast({ title: "Failed to generate review", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <Header title="AI Insights" subtitle="Personalized productivity analysis" />
      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="brand" size="sm" onClick={handleGenerateReview} disabled={generating}>
            {generating
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Sparkles className="w-4 h-4" />}
            Generate Weekly Review
          </Button>
          <Button variant="outline" size="sm" onClick={fetchInsights} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Insights list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : insights.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Lightbulb className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-1">No insights yet</p>
              <p className="text-sm text-muted-foreground/60 mb-4">
                Generate your first weekly review to get personalized AI insights
              </p>
              <Button variant="outline" size="sm" onClick={handleGenerateReview}>
                <Sparkles className="w-3.5 h-3.5" />
                Generate Review
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => {
              const config = TYPE_CONFIG[insight.type];
              const Icon = config.icon;
              const isExpanded = expanded === insight._id;

              return (
                <Card
                  key={insight._id}
                  className={cn("transition-all", !insight.read && "border-primary/30")}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg border", config.bg)}>
                          <Icon className={cn("w-3.5 h-3.5", config.color)} />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{insight.title}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(insight.generatedAt), "MMM d, yyyy · h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={cn("text-[10px]", config.bg, config.color, "border")}>
                          {config.label}
                        </Badge>
                        {!insight.read && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Summary */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {insight.content}
                    </p>

                    {/* Expandable details */}
                    {insight.data && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : insight._id)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        {isExpanded ? "Show less ↑" : "Show full analysis ↓"}
                      </button>
                    )}

                    {isExpanded && insight.data && (
                      <div className="space-y-4 pt-2 border-t border-border">
                        {insight.data.achievements && insight.data.achievements.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-400 mb-2">🏆 Achievements</p>
                            <ul className="space-y-1">
                              {insight.data.achievements.map((a, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-green-400 mt-0.5">✓</span> {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {insight.data.patterns && insight.data.patterns.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-blue-400 mb-2">📊 Patterns Identified</p>
                            <ul className="space-y-1">
                              {insight.data.patterns.map((p, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-blue-400 mt-0.5">→</span> {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {insight.data.recommendations && insight.data.recommendations.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-primary mb-2">💡 Recommendations</p>
                            <ul className="space-y-1">
                              {insight.data.recommendations.map((r, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-primary mt-0.5">{i + 1}.</span> {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {insight.data.areasForImprovement && insight.data.areasForImprovement.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-amber-400 mb-2">📈 Areas to Improve</p>
                            <ul className="space-y-1">
                              {insight.data.areasForImprovement.map((a, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-amber-400 mt-0.5">↑</span> {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {insight.data.motivationalMessage && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs text-primary italic">
                              ✨ {insight.data.motivationalMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
