"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Shield, Upload, CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface InsurancePolicy {
    id: string;
    insurance_type: string;
    expiration_date: string;
    document_url: string | null;
    is_active: boolean | null;
    uploaded_at: string | null;
}

const POLICY_TYPES = [
    { value: "General_Liability", label: "General Liability" },
    { value: "Workers_Compensation", label: "Workers' Compensation" },
];

function getPolicyStatus(expirationDate: string): { label: string; color: string; icon: any } {
    const today = new Date();
    const expiry = new Date(expirationDate);
    const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { label: "Expired", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle };
    if (daysLeft <= 7) return { label: `Expires in ${daysLeft}d`, color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle };
    if (daysLeft <= 14) return { label: `Expires in ${daysLeft}d`, color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock };
    return { label: "Active", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle };
}

export function InsuranceVault({ companyId }: { companyId?: string }) {
    const { toast } = useToast();
    const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [selectedType, setSelectedType] = useState("General_Liability");
    const [expirationDate, setExpirationDate] = useState("");
    const [selfCertified, setSelfCertified] = useState(false);

    useEffect(() => {
        loadPolicies();
    }, [companyId]);

    const loadPolicies = async () => {
        if (!companyId) { setLoading(false); return; }
        const supabase = createClient();
        const { data } = await supabase
            .from('insurance_policies')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('uploaded_at', { ascending: false });
        setPolicies(data || []);
        setLoading(false);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId) return;

        if (!selfCertified) {
            toast({ title: "Self-Certification Required", description: "You must certify the accuracy of the expiration date.", variant: "destructive" });
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expirationDate);
        if (expiry <= today) {
            toast({ title: "Invalid Expiration Date", description: "Insurance expiration date must be in the future. Expired insurance cannot be uploaded.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();

            // Deactivate any existing active policy of the same type
            await supabase
                .from('insurance_policies')
                .update({ is_active: false })
                .eq('company_id', companyId)
                .eq('insurance_type', selectedType)
                .eq('is_active', true);

            // Insert new policy
            const { error } = await supabase.from('insurance_policies').insert({
                company_id: companyId,
                insurance_type: selectedType,
                expiration_date: expirationDate,
                is_active: true,
                is_self_certified_by_lender: true,
            });

            if (error) throw error;

            toast({ title: "Policy Uploaded ✓", description: `${POLICY_TYPES.find(t => t.value === selectedType)?.label} policy has been uploaded and certified.` });
            setExpirationDate("");
            setSelfCertified(false);
            await loadPolicies();
        } catch (err: any) {
            toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Current Policies */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Active Insurance Policies</CardTitle>
                    <p className="text-sm text-gray-500">Your company's current insurance coverage status.</p>
                </CardHeader>
                <CardContent className="p-6">
                    {loading ? (
                        <p className="text-sm text-gray-400">Loading policies...</p>
                    ) : (
                        <div className="space-y-6">
                            {policies.length === 0 && (
                                <div className="text-center py-6 bg-blue-50/50 rounded-xl border border-blue-100 mb-2">
                                    <Shield className="h-10 w-10 text-blue-300 mx-auto mb-3" />
                                    <p className="text-sm font-semibold text-blue-900">Compliance Required</p>
                                    <p className="text-xs text-blue-600 mt-1 max-w-[280px] mx-auto">Upload your policies below. All lender companies must have active General Liability and Workers' Comp.</p>

                                    <div className="mt-4 pt-4 border-t border-blue-100/50">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-blue-400 mb-2">Don't have insurance?</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                                            onClick={() => window.open('https://www.nextinsurance.com/', '_blank')}
                                        >
                                            Get Instant Coverage
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {POLICY_TYPES.map(ptype => {
                                    const policy = policies.find(p => p.insurance_type === ptype.value);
                                    const status = policy ? getPolicyStatus(policy.expiration_date) : null;
                                    const StatusIcon = status?.icon;
                                    return (
                                        <div key={ptype.value} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50/30">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${policy ? "bg-blue-100" : "bg-gray-100"}`}>
                                                    <Shield className={`h-5 w-5 ${policy ? "text-blue-600" : "text-gray-400"}`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{ptype.label}</p>
                                                    {policy ? (
                                                        <p className="text-xs text-gray-500">
                                                            Expires: {new Date(policy.expiration_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-red-500">Not uploaded</p>
                                                    )}
                                                </div>
                                            </div>
                                            {policy && status ? (
                                                <Badge className={`${status.color} border flex items-center gap-1`}>
                                                    {StatusIcon && <StatusIcon className="h-3 w-3" />}
                                                    {status.label}
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-gray-100 text-gray-500 border border-gray-200">Missing</Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upload New Policy */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-bold text-gray-900">Upload / Renew Policy</CardTitle>
                    <p className="text-sm text-gray-500">Add a new insurance policy or renew an existing one. The previous active policy will be deactivated.</p>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleUpload} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Policy Type</Label>
                                <select
                                    value={selectedType}
                                    onChange={e => setSelectedType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                >
                                    {POLICY_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Expiration Date</Label>
                                <Input
                                    type="date"
                                    value={expirationDate}
                                    onChange={e => setExpirationDate(e.target.value)}
                                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                                    required
                                />
                            </div>
                        </div>

                        {/* Self-Certification */}
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                            <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Legal Self-Certification Required
                            </p>
                            <p className="text-xs text-amber-700">
                                By checking the box below, you certify under penalty of fraud that the expiration date entered above is accurate. Providing a false date may result in coverage gaps and immediate suspension of active bookings.
                            </p>
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="self-cert"
                                    checked={selfCertified}
                                    onCheckedChange={v => setSelfCertified(v === true)}
                                />
                                <Label htmlFor="self-cert" className="text-xs text-amber-700 leading-relaxed cursor-pointer">
                                    I certify that the expiration date entered above is accurate. I understand that providing false information constitutes fraud and that my company bears full liability for any coverage gaps.
                                </Label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-2"
                            disabled={saving || !selfCertified || !expirationDate || !companyId}
                        >
                            <Upload className="h-4 w-4" />
                            {saving ? "Uploading..." : "Upload Policy"}
                        </Button>

                        {!companyId && (
                            <p className="text-xs text-red-500">Company data not loaded. Please refresh the page.</p>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
