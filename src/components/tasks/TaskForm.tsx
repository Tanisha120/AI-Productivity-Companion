"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createTaskAction } from "@/actions/task.actions";
import { useToast } from "@/components/ui/toaster";
import { Loader2, Sparkles } from "lucide-react";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  prefillTitle?: string;
}

const CATEGORIES = [
  { value: "assignment", label: "📚 Assignment" },
  { value: "bill", label: "💳 Bill" },
  { value: "interview", label: "🎯 Interview" },
  { value: "resume", label: "📄 Resume" },
  { value: "meeting", label: "🤝 Meeting" },
  { value: "personal", label: "⭐ Personal" },
  { value: "work", label: "💼 Work" },
  { value: "other", label: "📌 Other" },
];

export function TaskForm({ open, onClose, onCreated, prefillTitle = "" }: TaskFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: prefillTitle,
    description: "",
    category: "work",
    deadline: "",
    estimatedEffort: 60,
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await createTaskAction({
        title: form.title,
        description: form.description || undefined,
        category: form.category as never,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        estimatedEffort: form.estimatedEffort,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      toast({ title: "Task created!", description: "AI is analyzing it in the background…", variant: "success" as never });
      onCreated?.();
      onClose();
      setForm({ title: "", description: "", category: "work", deadline: "", estimatedEffort: 60, tags: "" });
    } catch {
      toast({ title: "Failed to create task", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="effort">Effort (minutes)</Label>
              <Input
                id="effort"
                type="number"
                min={5}
                max={480}
                value={form.estimatedEffort}
                onChange={(e) => setForm({ ...form, estimatedEffort: parseInt(e.target.value) || 60 })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="urgent, personal, Q1…"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
