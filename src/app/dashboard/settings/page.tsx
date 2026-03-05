"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Building2,
    Wallet,
    Shield,
    Users,
    Bell,
    Check,
    AlertTriangle,
    Clock,
    UserCircle,
    FileText,
    Loader2,
} from "lucide-react";
import { WorkerProfileForm } from "./worker-profile-form";
import { WorkerSkillsForm } from "./worker-skills-form";
import { InsuranceVault } from "./insurance-vault";
import { LenderPoliciesForm } from "./lender-policies-form";
import { NotificationPreferencesForm } from "./notification-preferences";
import WorkerAvailabilityCalendar from "./worker-availability-calendar";
import { DeleteAccountModal } from "./delete-account-modal";
import { createClient } from "@/lib/supabase/client";
import { updateCompanyProfileAction } from "./actions";
import type { WorkerProfile } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("Company Profile");
    const [profile, setProfile] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const [userPrefs, setUserPrefs] = useState<any>(null);
    const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
    const [isStripeFullyOnboarded, setIsStripeFullyOnboarded] = useState(false);
    const [isLoadingStripe, setIsLoadingStripe] = useState(true);
    const [bankDetails, setBankDetails] = useState<{ last4: string, bankName: string } | null>(null);
    const [isConnectingStripe, setIsConnectingStripe] = useState(false);
    const [isSavingCompany, setIsSavingCompany] = useState(false);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [loadingPage, setLoadingPage] = useState(true);
    const { toast } = useToast();

    const tabs = [
        { name: "Company Profile", icon: Building2 },
        { name: "My Profile", icon: UserCircle },
        { name: "Work Preferences", icon: Clock },
        { name: "Insurance", icon: Shield },
        { name: "Policies", icon: FileText },
        { name: "Banking & Payouts", icon: Wallet },
        { name: "Team Members", icon: Users },
        { name: "Notifications", icon: Bell },
    ];

    useEffect(() => {
        const fetchAll = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoadingPage(false); return; }

            const [profileRes, memberRes, prefsRes] = await Promise.all([
                supabase.from('worker_profiles').select('*').eq('user_id', user.id).single(),
                supabase.from('company_members').select('companies(*)').eq('user_id', user.id).eq('status', 'Active').single(),
                supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
            ]);

            if (profileRes.data) setProfile(profileRes.data);
            if (prefsRes.data) setUserPrefs(prefsRes.data);

            if (memberRes.data?.companies) {
                const companiesData = Array.isArray(memberRes.data.companies) ? memberRes.data.companies[0] : memberRes.data.companies;
                if (companiesData) {
                    setCompany(companiesData);
                    setStripeAccountId(companiesData.stripe_account_id);

                    // Load team members
                    const { data: members } = await supabase
                        .from('company_members')
                        .select('id, user_id, roles, status, users(full_name, email, mobile_number)')
                        .eq('company_id', companiesData.id)
                        .order('created_at', { ascending: true });
                    setTeamMembers(members || []);

                    if (companiesData.stripe_account_id) {
                        try {
                            const statusRes = await fetch('/api/stripe/status');
                            if (statusRes.ok) {
                                const statusData = await statusRes.json();
                                setIsStripeFullyOnboarded(statusData.is_fully_onboarded);
                                if (statusData.last4) setBankDetails({ last4: statusData.last4, bankName: statusData.bank_name || 'Bank Account' });
                            }
                        } catch { /* ignore */ }
                    }
                }
            }
            setIsLoadingStripe(false);
            setLoadingPage(false);
        };
        fetchAll();
    }, []);

    const handleConnectStripe = async () => {
        setIsConnectingStripe(true);
        try {
            const res = await fetch("/api/stripe/connect", { method: "POST" });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else throw new Error(data.error || "Failed to connect");
        } catch (err: any) { alert(err.message); }
        finally { setIsConnectingStripe(false); }
    };

    const handleCompanySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!company?.id) return;
        setIsSavingCompany(true);
        try {
            const formData = new FormData(e.currentTarget);
            await updateCompanyProfileAction(company.id, {
                minimum_shift_length_hours: Number(formData.get("min_shift_length"))
            });
            toast({ title: "Settings Saved", description: "Company profile updated." });
            setCompany((prev: any) => ({ ...prev, minimum_shift_length_hours: Number(formData.get("min_shift_length")) }));
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        } finally { setIsSavingCompany(false); }
    };

    if (loadingPage) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-500">Loading settings...</span>
            </div>
        );
    }

    const ROLE_COLORS: Record<string, string> = {
        Admin: "bg-red-100 text-red-700 border-red-200",
        Manager: "bg-orange-100 text-orange-700 border-orange-200",
        Supervisor: "bg-blue-100 text-blue-700 border-blue-200",
        Worker: "bg-gray-100 text-gray-700 border-gray-200",
    };

    return (
        <div className="space-y-6 pt-2">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex space-x-1 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`pb-3 px-2 flex items-center text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.name
                                ? "border-blue-900 text-blue-900"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            <tab.icon size={15} className={`mr-1.5 ${activeTab === tab.name ? "text-blue-900" : "text-gray-400"}`} />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* ─── Company Profile Tab ─── */}
            {activeTab === "Company Profile" && (
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-sm border-gray-200">
                            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                                <CardTitle className="text-base font-bold text-gray-900">Company Identity</CardTitle>
                                <p className="text-sm text-gray-500">Update your company details and public information.</p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleCompanySubmit} className="space-y-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-16 w-16 rounded-lg bg-orange-100 flex items-center justify-center text-2xl border border-orange-200 text-orange-600">
                                            <Building2 />
                                        </div>
                                        <Button type="button" variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">Upload Logo</Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                            <input name="name" type="text" defaultValue={company?.name || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">EIN / Tax ID</label>
                                            <div className="relative">
                                                <input name="ein" type="text" defaultValue={company?.ein || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:pr-24" />
                                                <span className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 items-center text-xs text-green-600 font-medium"><Check size={12} className="mr-1" /> Verified</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                            <input name="website" type="text" defaultValue={company?.website || ""} placeholder="https://" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input name="contact_phone" type="text" defaultValue={company?.contact_phone || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Shift Length (Hours)</label>
                                            <select name="min_shift_length" defaultValue={company?.minimum_shift_length_hours?.toString() || "8"} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                                                {[2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>{h} Hours</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="pt-2 flex justify-end">
                                        <Button type="submit" disabled={isSavingCompany} className="bg-blue-900 hover:bg-blue-800 text-white">
                                            {isSavingCompany ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-red-200 bg-red-50/30">
                            <CardHeader className="border-b border-red-100 pb-4">
                                <CardTitle className="text-base font-bold text-red-700">Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-900">Delete Account</p>
                                    <p className="text-sm text-gray-500 text-balance max-w-md">Permanently remove your account and all of its contents. This action is not reversible.</p>
                                </div>
                                <DeleteAccountModal />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payout Sidebar */}
                    <div className="space-y-6">
                        <Card className="shadow-sm border-gray-200">
                            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                                <CardTitle className="text-base font-bold text-gray-900">Payout Method</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex flex-col space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded bg-purple-100 flex items-center justify-center mr-4 shrink-0">
                                            <span className="text-purple-600 font-bold">S</span>
                                        </div>
                                        <div className="flex-1">
                                            {isLoadingStripe ? (
                                                <p className="text-sm text-gray-500">Checking status...</p>
                                            ) : isStripeFullyOnboarded ? (
                                                <>
                                                    <p className="font-bold text-gray-900 flex items-center">Stripe Connected <Check size={14} className="ml-1 text-green-600" /></p>
                                                    {bankDetails && <p className="text-sm text-gray-500">{bankDetails.bankName} ending in •••• {bankDetails.last4}</p>}
                                                </>
                                            ) : stripeAccountId ? (
                                                <>
                                                    <p className="font-bold text-gray-900">Account Created <AlertTriangle size={14} className="inline ml-1 text-yellow-500" /></p>
                                                    <p className="text-sm text-gray-500">Action Required: Finish onboarding.</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-bold text-gray-900">Not Connected</p>
                                                    <p className="text-sm text-gray-500">Connect to receive payouts.</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className={stripeAccountId && isStripeFullyOnboarded ? "text-purple-700 hover:bg-purple-100 w-full" : "bg-purple-600 hover:bg-purple-700 text-white w-full"}
                                        variant={stripeAccountId && isStripeFullyOnboarded ? "ghost" : "default"}
                                        onClick={handleConnectStripe}
                                        disabled={isConnectingStripe || isLoadingStripe}
                                    >
                                        {isConnectingStripe ? "Opening..." : stripeAccountId ? "Manage Stripe Account" : "Connect Stripe"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* ─── My Profile Tab ─── */}
            {activeTab === "My Profile" && (
                <WorkerSkillsForm
                    initialData={{
                        trade: profile?.trade,
                        skills: profile?.skills,
                        tools_equipment: profile?.tools_equipment,
                        languages: profile?.languages,
                        certifications: profile?.certifications,
                        photo_url: profile?.photo_url,
                    }}
                />
            )}

            {/* ─── Work Preferences Tab ─── */}
            {activeTab === "Work Preferences" && (
                <div className="space-y-6">
                    <WorkerProfileForm initialData={profile || undefined} />
                    <WorkerAvailabilityCalendar />
                </div>
            )}

            {/* ─── Insurance Tab ─── */}
            {activeTab === "Insurance" && (
                <InsuranceVault companyId={company?.id} />
            )}

            {/* ─── Policies Tab ─── */}
            {activeTab === "Policies" && (
                <LenderPoliciesForm
                    companyId={company?.id}
                    initialData={{
                        break_policy_type: company?.break_policy_type,
                        break_duration_minutes: company?.break_duration_minutes,
                        break_required_after_hours: company?.break_required_after_hours,
                        lunch_policy_type: company?.lunch_policy_type,
                        lunch_duration_minutes: company?.lunch_duration_minutes,
                        lunch_required_after_hours: company?.lunch_required_after_hours,
                        ot_rate_type: company?.ot_rate_type,
                        ot_rule_daily: company?.ot_rule_daily,
                        ot_rule_weekly: company?.ot_rule_weekly,
                        ot_rule_weekend: company?.ot_rule_weekend,
                        trial_policy: company?.trial_policy,
                        no_show_fee_hours: company?.no_show_fee_hours,
                    }}
                />
            )}

            {/* ─── Banking & Payouts Tab ─── */}
            {activeTab === "Banking & Payouts" && (
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                        <CardTitle className="text-base font-bold text-gray-900">Banking & Payouts</CardTitle>
                        <p className="text-sm text-gray-500">Manage your Stripe Connect account to receive worker lending payouts.</p>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col space-y-4 p-6 bg-purple-50 rounded-lg border border-purple-100 max-w-md">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <span className="text-purple-600 font-bold text-xl">S</span>
                                </div>
                                <div>
                                    {isLoadingStripe ? (
                                        <p className="text-sm text-gray-500">Checking Stripe status...</p>
                                    ) : isStripeFullyOnboarded ? (
                                        <>
                                            <p className="font-bold text-gray-900">Stripe Connected ✓</p>
                                            {bankDetails && <p className="text-sm text-gray-500">{bankDetails.bankName} •••• {bankDetails.last4}</p>}
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-bold text-gray-900">{stripeAccountId ? "Onboarding Incomplete" : "Not Connected"}</p>
                                            <p className="text-sm text-gray-500">{stripeAccountId ? "Action required — finish Stripe setup." : "Connect your bank account to receive payouts."}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Button
                                className={isStripeFullyOnboarded ? "text-purple-700 hover:bg-purple-100" : "bg-purple-600 hover:bg-purple-700 text-white"}
                                variant={isStripeFullyOnboarded ? "ghost" : "default"}
                                onClick={handleConnectStripe}
                                disabled={isConnectingStripe}
                            >
                                {isConnectingStripe ? "Opening Stripe..." : isStripeFullyOnboarded ? "Manage Stripe Account" : "Connect Stripe"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── Team Members Tab ─── */}
            {activeTab === "Team Members" && (
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold text-gray-900">Team Members</CardTitle>
                                <p className="text-sm text-gray-500">Manage your company's members and their roles.</p>
                            </div>
                            <Badge variant="outline" className="text-xs">{teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {teamMembers.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">No team members yet. Invite workers from the Roster page.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {teamMembers.map((member: any) => {
                                    const user = Array.isArray(member.users) ? member.users[0] : member.users;
                                    const roles: string[] = Array.isArray(member.roles) ? member.roles : [];
                                    return (
                                        <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                                                    {user?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user?.full_name || "—"}</p>
                                                    <p className="text-xs text-gray-500">{user?.email || user?.mobile_number || "—"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {roles.map(role => (
                                                    <Badge key={role} className={`text-xs border ${ROLE_COLORS[role] || "bg-gray-100 text-gray-600"}`}>
                                                        {role}
                                                    </Badge>
                                                ))}
                                                <Badge variant="outline" className={`text-xs ml-1 ${member.status === 'Active' ? "text-green-700 border-green-200 bg-green-50" : "text-gray-500"}`}>
                                                    {member.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── Notifications Tab ─── */}
            {activeTab === "Notifications" && (
                <NotificationPreferencesForm initialData={userPrefs || undefined} />
            )}
        </div>
    );
}
