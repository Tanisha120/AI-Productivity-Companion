"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import type { ActionSuggestion } from "@/types/ai.types";

// Simple markdown renderer without installing react-markdown
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none text-sm text-muted-foreground">
      {content.split("\n").map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="text-base font-bold text-foreground mt-3 mb-1">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-sm font-semibold text-foreground mt-2 mb-1">{line.slice(3)}</h2>;
        if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-medium text-foreground mt-2 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        if (line.startsWith("**") && line.endsWith("**")) return <strong key={i} className="text-foreground">{line.slice(2, -2)}</strong>;
        if (line.trim() === "") return <br key={i} />;
        return <p key={i} className="my-0.5">{line}</p>;
      })}
    </div>
  );
}

interface AIActionButtonsProps {
  taskId: string;
}

export function AIActionButtons({ taskId }: AIActionButtonsProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<ActionSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, [taskId]);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/ai-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_suggestions" }),
      });
      const data = await res.json();
      setSuggestions(data.data ?? []);
    } catch {
      toast({ title: "Failed to load AI suggestions", variant: "destructive" });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const executeAction = async (suggestion: ActionSuggestion) => {
    setExecutingAction(suggestion.actionType);
    setActiveAction(suggestion.label);
    setResult(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/ai-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          actionType: suggestion.actionType,
          actionLabel: suggestion.label,
        }),
      });
      const data = await res.json();
      setResult(data.data?.result ?? "");
    } catch {
      toast({ title: "AI action failed", variant: "destructive" });
    } finally {
      setExecutingAction(null);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Actions
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3">
          {/* Action buttons */}
          {loadingSuggestions ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading AI suggestions…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Button
                  key={s.actionType}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 border-primary/20 text-primary hover:bg-primary/10"
                  onClick={() => executeAction(s)}
                  disabled={!!executingAction}
                  title={s.description}
                >
                  {executingAction === s.actionType ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  {s.label}
                </Button>
              ))}
              {suggestions.length === 0 && (
                <p className="text-xs text-muted-foreground">No AI suggestions available.</p>
              )}
            </div>
          )}

          {/* AI result */}
          {result && (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {activeAction}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <MarkdownContent content={result} />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
