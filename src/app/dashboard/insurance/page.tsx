"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface Policy {
    id: string;
    insurance_type: 'General_Liability' | 'Workers_Compensation';
    expiration_date: string;
    document_url: string;
    is_active: boolean;
    is_self_certified_by_lender: boolean;
    signed_url?: string;
}

export default function InsurancePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [type, setType] = useState<'General_Liability' | 'Workers_Compensation'>('General_Liability');
    const [expirationDate, setExpirationDate] = useState<Date>();
    const [file, setFile] = useState<File | null>(null);
    const [selfCertified, setSelfCertified] = useState(false);

    useEffect(() => {
        loadPolicies();
    }, []);

    const loadPolicies = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get company_id (assuming context is resolved or we store it in session/localstorage)
        // For MVP, fetch generic 'company_members' to get ID.
        const { data: member } = await supabase.from('company_members').select('company_id').eq('user_id', user.id).eq('status', 'Active').single();

        if (member) {
            const { data } = await supabase
                .from('insurance_policies')
                .select('*')
                .eq('company_id', member.company_id)
                .eq('is_active', true);
            if (data) setPolicies(data as Policy[]);
        }
        setLoading(false);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !expirationDate || !selfCertified) {
            toast({ title: "Missing Information", description: "Please provide file, expiration date, and certify compliance.", variant: "destructive" });
            return;
        }

        setUploading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Unauthorized");

            const { data: member } = await supabase.from('company_members').select('company_id').eq('user_id', user.id).single();
            if (!member) throw new Error("No active company found");

            // 1. Upload File
            const fileExt = file.name.split('.').pop();
            const fileName = `${member.company_id}/${type}_${Date.now()}.${fileExt}`;
            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('insurance-docs')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Save Metadata via API (to ensure business logic/validation)
            // Or direct insert if policy allows? 
            // "Authenticated users can read" - we need strict RLS for insert to ensure they don't overwrite others.
            // Let's use API route for metadata to keep it clean and enforced.

            const res = await fetch("/api/company/insurance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company_id: member.company_id,
                    insurance_type: type,
                    expiration_date: expirationDate.toISOString(),
                    document_path: uploadData.path,
                    is_self_certified: selfCertified
                }),
            });

            if (!res.ok) throw new Error("Failed to save policy metadata");

            toast({ title: "Success", description: "Insurance policy uploaded successfully." });
            setFile(null);
            setExpirationDate(undefined);
            setSelfCertified(false);
            loadPolicies(); // Refresh list
        } catch (error: any) {
            console.error(error);
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-8">Loading insurance policies...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Insurance Compliance</h1>
            <p className="text-muted-foreground">Upload your General Liability and Workers' Compensation policies to enable bookings.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upload New Policy</CardTitle>
                        <CardDescription>Select policy type and upload PDF.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Policy Type</Label>
                                <Select value={type} onValueChange={(v: any) => setType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General_Liability">General Liability</SelectItem>
                                        <SelectItem value="Workers_Compensation">Workers' Compensation</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Expiration Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !expirationDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={expirationDate}
                                            onSelect={setExpirationDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>Policy Document (PDF)</Label>
                                <Input
                                    type="file"
                                    accept=".pdf,.jpg,.png"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </div>

                            <div className="flex items-start space-x-2 pt-2">
                                <Checkbox
                                    id="certify"
                                    checked={selfCertified}
                                    onCheckedChange={(c) => setSelfCertified(c as boolean)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor="certify" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        I certify that this policy is current and valid.
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Providing false information may result in account suspension.
                                    </p>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={uploading}>
                                {uploading ? "Uploading..." : "Upload Policy"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Current Policies */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Policies</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {['General_Liability', 'Workers_Compensation'].map((reqType) => {
                                const policy = policies.find(p => p.insurance_type === reqType);
                                return (
                                    <div key={reqType} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold">{reqType.replace('_', ' ')}</span>
                                                {policy ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {policy
                                                    ? `Expires: ${format(new Date(policy.expiration_date), "PPP")}`
                                                    : "Missing Policy"}
                                            </p>
                                        </div>
                                        {policy && policy.signed_url && (
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={policy.signed_url} target="_blank" rel="noopener noreferrer">
                                                    View
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Status Summary */}
                    <Card className={cn("border-l-4", policies.length >= 2 ? "border-l-green-500" : "border-l-yellow-500")}>
                        <CardHeader>
                            <CardTitle>Compliance Status</CardTitle>
                            <CardDescription>
                                {policies.length >= 2
                                    ? "You are fully compliant and ready to book workers."
                                    : "You must upload both policies to enable bookings."}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </div>
    );
}
