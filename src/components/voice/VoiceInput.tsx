"use client";

import { useState, useEffect } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Sparkles, X, Loader2 } from "lucide-react";
import { createTaskAction } from "@/actions/task.actions";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onClose?: () => void;
  onTaskCreated?: () => void;
}

export function VoiceInput({ onClose, onTaskCreated }: VoiceInputProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [detectedTask, setDetectedTask] = useState<{
    title: string;
    category: string;
    deadline?: string;
  } | null>(null);

  const { isListening, transcript, isSupported, startListening, stopListening } =
    useVoiceInput({
      onResult: (text) => {
        parseVoiceCommand(text);
      },
    });

  const parseVoiceCommand = async (text: string) => {
    // Simple pattern matching for common voice commands
    // "Add task [title] by [deadline] category [category]"
    // "Remind me to [title] tomorrow"
    // "Create [category] task [title]"
    const cleaned = text.trim();
    if (!cleaned) return;

    // Extract deadline hints
    let deadline: string | undefined;
    const tomorrowMatch = /tomorrow/i.test(cleaned);
    const todayMatch = /today/i.test(cleaned);
    if (tomorrowMatch) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
      deadline = d.toISOString();
    } else if (todayMatch) {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      deadline = d.toISOString();
    }

    // Extract category
    const categoryMatch = cleaned.match(/\b(meeting|bill|interview|resume|assignment|work|personal)\b/i);
    const category = categoryMatch ? categoryMatch[1].toLowerCase() : "work";

    // Clean up the title
    let title = cleaned
      .replace(/^(add|create|remind me to|new|set a reminder to)\s*/i, "")
      .replace(/\b(tomorrow|today|by)\b/gi, "")
      .replace(/\b(meeting|bill|interview|resume|assignment|work|personal)\b/i, "")
      .trim();

    if (title.length > 3) {
      setDetectedTask({ title, category, deadline });
    }
  };

  const handleConfirmCreate = async () => {
    if (!detectedTask) return;
    setProcessing(true);
    try {
      await createTaskAction({
        title: detectedTask.title,
        category: detectedTask.category as never,
        deadline: detectedTask.deadline,
        estimatedEffort: 60,
      });
      toast({ title: "Task created from voice! 🎤", variant: "success" as never });
      onTaskCreated?.();
      onClose?.();
    } catch {
      toast({ title: "Failed to create task", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <MicOff className="w-5 h-5 text-amber-400" />
          <p className="text-sm text-muted-foreground">
            Voice input is not supported in this browser. Try Chrome for best results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-4">
        {/* Mic button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={isListening ? stopListening : startListening}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
              isListening
                ? "bg-red-500 shadow-lg shadow-red-500/30 animate-pulse"
                : "bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90"
            )}
          >
            {isListening ? (
              <MicOff className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            {isListening
              ? "Listening… speak your task"
              : "Tap to speak a task"}
          </p>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="p-3 rounded-lg bg-secondary border border-border text-sm">
            <p className="text-xs text-muted-foreground mb-1">Heard:</p>
            <p className="italic">"{transcript}"</p>
          </div>
        )}

        {/* Detected task preview */}
        {detectedTask && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
            <p className="text-xs font-medium text-primary flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Detected Task
            </p>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Title:</span> {detectedTask.title}</p>
              <p><span className="text-muted-foreground">Category:</span> {detectedTask.category}</p>
              {detectedTask.deadline && (
                <p><span className="text-muted-foreground">Deadline:</span> {new Date(detectedTask.deadline).toLocaleDateString()}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="brand"
                onClick={handleConfirmCreate}
                disabled={processing}
                className="flex-1"
              >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Create Task
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDetectedTask(null)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Try saying:</p>
          <p>• "Add meeting with client tomorrow"</p>
          <p>• "Create assignment task for math homework"</p>
          <p>• "Remind me to pay electricity bill today"</p>
        </div>
      </CardContent>
    </Card>
  );
}
