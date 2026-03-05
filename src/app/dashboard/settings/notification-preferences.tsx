"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";

interface NotificationPrefs {
    sms_enabled: boolean;
    email_enabled: boolean;
    push_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
}

export function NotificationPreferencesForm({ initialData }: { initialData?: Partial<NotificationPrefs> }) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [prefs, setPrefs] = useState<NotificationPrefs>({
        sms_enabled: initialData?.sms_enabled ?? true,
        email_enabled: initialData?.email_enabled ?? true,
        push_enabled: initialData?.push_enabled ?? true,
        quiet_hours_start: initialData?.quiet_hours_start || "22:00",
        quiet_hours_end: initialData?.quiet_hours_end || "07:00",
    });

    const toggle = (field: keyof NotificationPrefs) => {
        setPrefs(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase.from('user_preferences').upsert({
                user_id: user.id,
                ...prefs,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            if (error) throw error;
            toast({ title: "Preferences Saved ✓", description: "Your notification settings have been updated." });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const channels = [
        { key: 'email_enabled' as const, label: 'Email', description: 'Booking updates, insurance warnings, financial summaries', icon: Mail },
        { key: 'sms_enabled' as const, label: 'SMS / Text', description: 'Critical alerts, clock-in/out confirmations, urgent notices', icon: MessageSquare },
        { key: 'push_enabled' as const, label: 'Push Notifications', description: 'Real-time alerts in app and browser', icon: Smartphone },
    ];

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Notification Channels */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Notification Channels</CardTitle>
                    <p className="text-sm text-gray-500">Choose how you want to be notified about activity on SmartBench.</p>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {channels.map(ch => {
                        const Icon = ch.icon;
                        const enabled = prefs[ch.key];
                        return (
                            <div key={ch.key} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${enabled ? "border-blue-200 bg-blue-50/40" : "border-gray-200 bg-gray-50/20"}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${enabled ? "bg-blue-100" : "bg-gray-100"}`}>
                                        <Icon className={`h-5 w-5 ${enabled ? "text-blue-700" : "text-gray-400"}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{ch.label}</p>
                                        <p className="text-xs text-gray-500">{ch.description}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggle(ch.key)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? "bg-blue-900" : "bg-gray-300"}`}
                                    role="switch"
                                    aria-checked={enabled}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-gray-600" />
                        Quiet Hours
                    </CardTitle>
                    <p className="text-sm text-gray-500">Non-critical notifications are paused during quiet hours. Critical insurance and booking alerts always go through.</p>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4 max-w-xs">
                        <div className="space-y-2">
                            <Label htmlFor="quiet_start">Start</Label>
                            <Input
                                id="quiet_start"
                                type="time"
                                value={prefs.quiet_hours_start}
                                onChange={e => setPrefs(p => ({ ...p, quiet_hours_start: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quiet_end">End</Label>
                            <Input
                                id="quiet_end"
                                type="time"
                                value={prefs.quiet_hours_end}
                                onChange={e => setPrefs(p => ({ ...p, quiet_hours_end: e.target.value }))}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Default: 10:00 PM – 7:00 AM</p>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white" disabled={saving}>
                    {saving ? "Saving..." : "Save Preferences"}
                </Button>
            </div>
        </form>
    );
}
