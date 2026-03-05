"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle } from "lucide-react";

interface PolicyData {
    break_policy_type: string;
    break_duration_minutes: number;
    break_required_after_hours: number;
    lunch_policy_type: string;
    lunch_duration_minutes: number;
    lunch_required_after_hours: number;
    ot_rate_type: string;
    ot_rule_daily: boolean;
    ot_rule_weekly: boolean;
    ot_rule_weekend: boolean;
    trial_policy: string;
    no_show_fee_hours: number;
}

interface LenderPoliciesFormProps {
    initialData?: Partial<PolicyData>;
    companyId?: string;
}

export function LenderPoliciesForm({ initialData, companyId }: LenderPoliciesFormProps) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [selfAttested, setSelfAttested] = useState(false);

    const [formData, setFormData] = useState<PolicyData>({
        break_policy_type: initialData?.break_policy_type || 'Paid',
        break_duration_minutes: initialData?.break_duration_minutes ?? 15,
        break_required_after_hours: initialData?.break_required_after_hours ?? 4,
        lunch_policy_type: initialData?.lunch_policy_type || 'Unpaid',
        lunch_duration_minutes: initialData?.lunch_duration_minutes ?? 30,
        lunch_required_after_hours: initialData?.lunch_required_after_hours ?? 6,
        ot_rate_type: initialData?.ot_rate_type || 'No_OT',
        ot_rule_daily: initialData?.ot_rule_daily ?? false,
        ot_rule_weekly: initialData?.ot_rule_weekly ?? false,
        ot_rule_weekend: initialData?.ot_rule_weekend ?? false,
        trial_policy: initialData?.trial_policy || '4_Hours',
        no_show_fee_hours: initialData?.no_show_fee_hours ?? 4.0,
    });

    const handleChange = (field: keyof PolicyData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selfAttested) {
            toast({ title: "Self-Attestation Required", description: "Please certify that your policies comply with local labor laws.", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/company/policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, companyId }),
            });
            if (!res.ok) throw new Error("Failed to save policies");
            toast({ title: "Policies Saved ✓", description: "Your company policies have been updated successfully." });
            setSelfAttested(false); // Require re-attestation for next update
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Break Policy */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Break Policy</CardTitle>
                    <CardDescription>Short rest periods (typically 10–15 minutes).</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={formData.break_policy_type} onValueChange={v => handleChange('break_policy_type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                                    <SelectItem value="None">No Breaks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Duration (minutes)</Label>
                            <Input type="number" min={0} value={formData.break_duration_minutes} onChange={e => handleChange('break_duration_minutes', parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Required After (hours)</Label>
                            <Input type="number" min={0} value={formData.break_required_after_hours} onChange={e => handleChange('break_required_after_hours', parseInt(e.target.value) || 0)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Lunch Policy */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Lunch Policy</CardTitle>
                    <CardDescription>Meal periods (typically 30–60 minutes).</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={formData.lunch_policy_type} onValueChange={v => handleChange('lunch_policy_type', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                                    <SelectItem value="None">No Lunch</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Duration (minutes)</Label>
                            <Input type="number" min={0} value={formData.lunch_duration_minutes} onChange={e => handleChange('lunch_duration_minutes', parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Required After (hours)</Label>
                            <Input type="number" min={0} value={formData.lunch_required_after_hours} onChange={e => handleChange('lunch_required_after_hours', parseInt(e.target.value) || 0)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Overtime */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Overtime Rules</CardTitle>
                    <CardDescription>Configure when overtime rates apply for your workers.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label>Overtime Rate Type</Label>
                        <Select value={formData.ot_rate_type} onValueChange={v => handleChange('ot_rate_type', v)}>
                            <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="No_OT">No Overtime (Flat Rate Always)</SelectItem>
                                <SelectItem value="Custom_Rate">Custom Rate (Set per worker)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <Label>Overtime Triggers</Label>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="ot_daily" checked={formData.ot_rule_daily} onCheckedChange={c => handleChange('ot_rule_daily', c === true)} disabled={formData.ot_rate_type === 'No_OT'} />
                                <Label htmlFor="ot_daily" className={formData.ot_rate_type === 'No_OT' ? 'text-gray-400' : ''}>Daily OT after 8 hours/day</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="ot_weekly" checked={formData.ot_rule_weekly} onCheckedChange={c => handleChange('ot_rule_weekly', c === true)} disabled={formData.ot_rate_type === 'No_OT'} />
                                <Label htmlFor="ot_weekly" className={formData.ot_rate_type === 'No_OT' ? 'text-gray-400' : ''}>Weekly OT after 40 hours/week</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="ot_weekend" checked={formData.ot_rule_weekend} onCheckedChange={c => handleChange('ot_rule_weekend', c === true)} disabled={formData.ot_rate_type === 'No_OT'} />
                                <Label htmlFor="ot_weekend" className={formData.ot_rate_type === 'No_OT' ? 'text-gray-400' : ''}>Weekend / Holiday rate applies</Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trial Period & No-Show Fee */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Trial Period & No-Show Policy</CardTitle>
                    <CardDescription>Configure trial options and fees for initial bookings and no-shows.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Trial Period Option</Label>
                            <Select value={formData.trial_policy} onValueChange={v => handleChange('trial_policy', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="None">None (No trial period)</SelectItem>
                                    <SelectItem value="2_Hours">2 Hours</SelectItem>
                                    <SelectItem value="4_Hours">4 Hours (Default)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Trial applies only on the first day of the first booking between a Borrower and Worker.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>No-Show Fee (hours)</Label>
                            <Input
                                type="number"
                                min={0}
                                max={24}
                                step={0.5}
                                value={formData.no_show_fee_hours}
                                onChange={e => handleChange('no_show_fee_hours', parseFloat(e.target.value) || 0)}
                            />
                            <p className="text-xs text-gray-500">Billable hours charged when a worker or supervisor fails to show. Default: 4 hours.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Labor Law Self-Attestation */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Labor Law Compliance Self-Attestation
                </p>
                <p className="text-xs text-amber-700">
                    By saving, you certify that these policies comply with all applicable local and federal labor laws. You accept full liability for policy compliance. The platform does not validate policies against state minimums.
                </p>
                <div className="flex items-start gap-3">
                    <Checkbox
                        id="labor-attest"
                        checked={selfAttested}
                        onCheckedChange={v => setSelfAttested(v === true)}
                    />
                    <Label htmlFor="labor-attest" className="text-xs text-amber-700 leading-relaxed cursor-pointer">
                        I certify that my company's break, lunch, and overtime policies comply with all applicable labor laws. I accept full legal liability for these configurations.
                    </Label>
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white" disabled={saving || !selfAttested}>
                    {saving ? "Saving..." : "Save Policies"}
                </Button>
            </div>
        </form>
    );
}
