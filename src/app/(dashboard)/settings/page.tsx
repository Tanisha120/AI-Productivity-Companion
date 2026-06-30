"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/shared/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/select";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toaster";
import { Loader2, Save, RefreshCw, Brain, Calendar, Bell } from "lucide-react";
import Image from "next/image";

interface Preferences {
  workStartTime: string;
  workEndTime: string;
  timezone: string;
  darkMode: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [updatingBehavior, setUpdatingBehavior] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>({
    workStartTime: "09:00",
    workEndTime: "18:00",
    timezone: "Asia/Kolkata",
    darkMode: true,
  });

  useEffect(() => {
    fetch("/api/users/preferences")
      .then((r) => r.json())
      .then((d) => { if (d.data) setPrefs(d.data); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/users/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      toast({ title: "Preferences saved!", variant: "success" as never });
    } catch {
      toast({ title: "Failed to save preferences", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBehavior = async () => {
    setUpdatingBehavior(true);
    try {
      await fetch("/api/users/behavior", { method: "POST" });
      toast({ title: "Behavior profile updated! ✨", variant: "success" as never });
    } catch {
      toast({ title: "Failed to update behavior profile", variant: "destructive" });
    } finally {
      setUpdatingBehavior(false);
    }
  };

  const handleSyncCalendar = async () => {
    try {
      const res = await fetch("/api/calendar/events?sync=true");
      const data = await res.json();
      toast({ title: `Synced ${data.synced} calendar events`, variant: "success" as never });
    } catch {
      toast({ title: "Calendar sync failed", variant: "destructive" });
    }
  };

  return (
    <div>
      <Header title="Settings" subtitle="Manage your preferences and integrations" />
      <div className="p-6 max-w-2xl space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                width={48}
                height={48}
                className="rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{session?.user?.name}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Signed in with Google</p>
            </div>
          </CardContent>
        </Card>

        {/* Work schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Work Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Work Start Time</Label>
                <Input
                  type="time"
                  value={prefs.workStartTime}
                  onChange={(e) => setPrefs({ ...prefs, workStartTime: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Work End Time</Label>
                <Input
                  type="time"
                  value={prefs.workEndTime}
                  onChange={(e) => setPrefs({ ...prefs, workEndTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input
                value={prefs.timezone}
                onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                placeholder="Asia/Kolkata"
              />
              <p className="text-xs text-muted-foreground">e.g. Asia/Kolkata, America/New_York</p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Use dark theme across the app</p>
              </div>
              <Switch
                checked={prefs.darkMode}
                onCheckedChange={(v) => setPrefs({ ...prefs, darkMode: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <Button variant="brand" onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Preferences
        </Button>

        <Separator />

        {/* Integrations */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Integrations & AI</h2>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Google Calendar</p>
                  <p className="text-xs text-muted-foreground">Sync events for smart scheduling</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSyncCalendar}>
                <RefreshCw className="w-3.5 h-3.5" /> Sync Now
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Brain className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Behavior Profile</p>
                  <p className="text-xs text-muted-foreground">Update AI personalization based on recent activity</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleUpdateBehavior} disabled={updatingBehavior}>
                {updatingBehavior ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                Update
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Smart Reminders</p>
                  <p className="text-xs text-muted-foreground">Generate AI reminders for upcoming tasks</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auto: true }) }).then(() => toast({ title: "Reminders generated!", variant: "success" as never }))}
              >
                <Bell className="w-3.5 h-3.5" /> Generate
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
