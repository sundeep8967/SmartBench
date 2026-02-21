"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

export default function PolicyConfigPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        break_policy_type: 'Paid',
        break_duration_minutes: 15,
        break_required_after_hours: 4,
        lunch_policy_type: 'Unpaid',
        lunch_duration_minutes: 30,
        lunch_required_after_hours: 6,
        ot_rate_type: 'No_OT',
        ot_rule_daily: false,
        ot_rule_weekly: false,
        ot_rule_weekend: false
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: member } = await supabase.from('company_members').select('company_id').eq('user_id', user.id).maybeSingle();
        if (member) {
            const { data: company } = await supabase.from('companies').select('*').eq('id', member.company_id).single();
            if (company) {
                setFormData({
                    break_policy_type: company.break_policy_type || 'Paid',
                    break_duration_minutes: company.break_duration_minutes || 15,
                    break_required_after_hours: company.break_required_after_hours || 4,
                    lunch_policy_type: company.lunch_policy_type || 'Unpaid',
                    lunch_duration_minutes: company.lunch_duration_minutes || 30,
                    lunch_required_after_hours: company.lunch_required_after_hours || 6,
                    ot_rate_type: company.ot_rate_type || 'No_OT',
                    ot_rule_daily: company.ot_rule_daily || false,
                    ot_rule_weekly: company.ot_rule_weekly || false,
                    ot_rule_weekend: company.ot_rule_weekend || false
                });
            }
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/company/policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to save policies");

            toast({ title: "Success", description: "Company policies updated successfully." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) return <div className="p-8">Loading policies...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Policy Configuration</h1>
            <p className="text-muted-foreground">Define your company's rules for breaks, lunch, and overtime.</p>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Break Policy */}
                <Card>
                    <CardHeader>
                        <CardTitle>Break Policy</CardTitle>
                        <CardDescription>Short rest periods (usually 10-15 mins).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={formData.break_policy_type} onValueChange={(v) => handleChange('break_policy_type', v)}>
                                    <SelectTrigger> <SelectValue /> </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Paid">Paid</SelectItem>
                                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                                        <SelectItem value="None">No Breaks</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (Minutes)</Label>
                                <Input type="number" value={formData.break_duration_minutes} onChange={(e) => handleChange('break_duration_minutes', parseInt(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Required After (Hours)</Label>
                                <Input type="number" value={formData.break_required_after_hours} onChange={(e) => handleChange('break_required_after_hours', parseInt(e.target.value))} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lunch Policy */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lunch Policy</CardTitle>
                        <CardDescription>Meal periods (usually 30-60 mins).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={formData.lunch_policy_type} onValueChange={(v) => handleChange('lunch_policy_type', v)}>
                                    <SelectTrigger> <SelectValue /> </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Paid">Paid</SelectItem>
                                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                                        <SelectItem value="None">No Lunch</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Duration (Minutes)</Label>
                                <Input type="number" value={formData.lunch_duration_minutes} onChange={(e) => handleChange('lunch_duration_minutes', parseInt(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Required After (Hours)</Label>
                                <Input type="number" value={formData.lunch_required_after_hours} onChange={(e) => handleChange('lunch_required_after_hours', parseInt(e.target.value))} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Overtime Policy */}
                <Card>
                    <CardHeader>
                        <CardTitle>Overtime Rules</CardTitle>
                        <CardDescription>When do overtime rates apply?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Overtime Rate Logic</Label>
                                <Select value={formData.ot_rate_type} onValueChange={(v) => handleChange('ot_rate_type', v)}>
                                    <SelectTrigger> <SelectValue /> </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="No_OT">No Overtime (Flat Rate)</SelectItem>
                                        <SelectItem value="1.5x">1.5x Base Rate</SelectItem>
                                        <SelectItem value="2.0x">2.0x Base Rate</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label>Triggers</Label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="daily" checked={formData.ot_rule_daily} onCheckedChange={(c) => handleChange('ot_rule_daily', c)} />
                                    <Label htmlFor="daily">Daily (&gt; 8 hours)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="weekly" checked={formData.ot_rule_weekly} onCheckedChange={(c) => handleChange('ot_rule_weekly', c)} />
                                    <Label htmlFor="weekly">Weekly (&gt; 40 hours)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="weekend" checked={formData.ot_rule_weekend} onCheckedChange={(c) => handleChange('ot_rule_weekend', c)} />
                                    <Label htmlFor="weekend">Weekend / Holiday</Label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" size="lg" disabled={saving}>
                    {saving ? "Saving..." : "Save Policies"}
                </Button>
            </form>
        </div>
    );
}
