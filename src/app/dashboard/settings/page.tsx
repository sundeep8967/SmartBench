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
    CreditCard,
    AlertTriangle,
    Clock
} from "lucide-react";
import Link from "next/link";
import { WorkerProfileForm } from "./worker-profile-form";
import { DeleteAccountModal } from "./delete-account-modal";
import { createClient } from "@/lib/supabase/client";
import type { WorkerProfile } from "@/types";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("Company Profile");
    const [profile, setProfile] = useState<WorkerProfile | null>(null);
    const [company, setCompany] = useState<any>(null);
    const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
    const [isStripeFullyOnboarded, setIsStripeFullyOnboarded] = useState(false);
    const [isLoadingStripe, setIsLoadingStripe] = useState(true);
    const [bankDetails, setBankDetails] = useState<{ last4: string, bankName: string } | null>(null);
    const [isConnectingStripe, setIsConnectingStripe] = useState(false);

    const tabs = [
        { name: "Company Profile", icon: Building2 },
        { name: "Work Preferences", icon: Clock },
        { name: "Insurance Vault", icon: Shield },
        { name: "Banking & Payouts", icon: Wallet },
        { name: "Team Members", icon: Users },
        { name: "Notifications", icon: Bell },
    ];

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const [profileRes, memberRes] = await Promise.all([
                    supabase
                        .from('worker_profiles')
                        .select('*')
                        .eq('user_id', user.id)
                        .single(),
                    supabase
                        .from('company_members')
                        .select('companies(*)')
                        .eq('user_id', user.id)
                        .eq('status', 'Active')
                        .single()
                ]);

                if (profileRes.data) setProfile(profileRes.data);
                if (memberRes.data && memberRes.data.companies) {
                    const companiesData = Array.isArray(memberRes.data.companies) ? memberRes.data.companies[0] : memberRes.data.companies;
                    if (companiesData) {
                        setCompany(companiesData);
                        setStripeAccountId(companiesData.stripe_account_id);

                        if (companiesData.stripe_account_id) {
                            try {
                                const statusRes = await fetch('/api/stripe/status');
                                if (statusRes.ok) {
                                    const statusData = await statusRes.json();
                                    setIsStripeFullyOnboarded(statusData.is_fully_onboarded);
                                    if (statusData.last4) {
                                        setBankDetails({
                                            last4: statusData.last4,
                                            bankName: statusData.bank_name || 'Bank Account'
                                        });
                                    }
                                }
                            } catch (error) {
                                console.error("Failed to fetch Stripe status:", error);
                            }
                        }
                        setIsLoadingStripe(false);
                    } else {
                        setIsLoadingStripe(false);
                    }
                } else {
                    setIsLoadingStripe(false);
                }
            } else {
                setIsLoadingStripe(false);
            }
        };
        fetchProfile();
    }, []);

    const handleConnectStripe = async () => {
        setIsConnectingStripe(true);
        try {
            const res = await fetch("/api/stripe/connect", { method: "POST" });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Failed to connect to Stripe");
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message);
        } finally {
            setIsConnectingStripe(false);
        }
    };

    return (
        <div className="space-y-6 pt-2">
            <div className="border-b border-gray-200">
                <nav className="flex space-x-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`pb-3 flex items-center text-sm font-medium border-b-2 transition-all ${activeTab === tab.name
                                ? "border-blue-900 text-blue-900"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            <tab.icon size={16} className={`mr-2 ${activeTab === tab.name ? "text-blue-900" : "text-gray-400"}`} />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === "Work Preferences" && (
                        <WorkerProfileForm initialData={profile || undefined} />
                    )}

                    {activeTab === "Company Profile" && (
                        <>
                            <Card className="shadow-sm border-gray-200">
                                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-base font-bold text-gray-900">Company Identity</CardTitle>
                                            <p className="text-sm text-gray-500">Update your company details and public information.</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-16 w-16 rounded-lg bg-orange-100 flex items-center justify-center text-2xl border border-orange-200 text-orange-600">
                                            <Building2 />
                                        </div>
                                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                            Upload New Logo
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                            <input type="text" defaultValue={company?.name || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">EIN / Tax ID</label>
                                            <div className="relative">
                                                <input type="text" defaultValue={company?.ein || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:pr-24" />
                                                <span className="hidden md:flex absolute right-2 top-1/2 transform -translate-y-1/2 items-center text-xs text-green-600 font-medium">
                                                    <Check size={12} className="mr-1" /> Verified
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                            <input type="text" defaultValue={company?.website || ""} placeholder="https://" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input type="text" defaultValue={company?.contact_phone || ""} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Shift Length (Hours)</label>
                                            <select defaultValue="8" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                                                <option value="4">4 Hours</option>
                                                <option value="6">6 Hours</option>
                                                <option value="8">8 Hours</option>
                                                <option value="10">10 Hours</option>
                                                <option value="12">12 Hours</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">Default applied to new jobs.</p>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <Button className="bg-blue-900 hover:bg-blue-800 text-white">Save Changes</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-red-200 mt-6 bg-red-50/30">
                                <CardHeader className="border-b border-red-100 pb-4">
                                    <CardTitle className="text-base font-bold text-red-700">Danger Zone</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-900">Delete Account</p>
                                        <p className="text-sm text-gray-500 text-balance max-w-md">Permanently remove your personal account and all of its contents from the SmartBench platform. This action is not reversible.</p>
                                    </div>
                                    <DeleteAccountModal />
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                <div className="space-y-6">
                    {activeTab === "Company Profile" && (
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
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-4 h-4 rounded-full border-2 border-purple-600 border-t-transparent animate-spin"></div>
                                                    <p className="text-sm text-gray-500">Checking status...</p>
                                                </div>
                                            ) : isStripeFullyOnboarded ? (
                                                <>
                                                    <p className="font-bold text-gray-900 flex items-center">Stripe Connected <Check size={14} className="ml-1 text-green-600" /></p>
                                                    {bankDetails ? (
                                                        <p className="text-sm text-gray-500">{bankDetails.bankName} ending in •••• {bankDetails.last4}</p>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">Payouts enabled.</p>
                                                    )}
                                                </>
                                            ) : stripeAccountId ? (
                                                <>
                                                    <p className="font-bold text-gray-900 flex items-center">Account Created <AlertTriangle size={14} className="ml-1 text-yellow-500" /></p>
                                                    <p className="text-sm text-gray-500">Action Required: Finish onboarding.</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-bold text-gray-900 flex items-center">Not Connected</p>
                                                    <p className="text-sm text-gray-500">Connect to receive payouts.</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full">
                                        {stripeAccountId ? (
                                            <Button
                                                variant={isStripeFullyOnboarded ? "ghost" : "default"}
                                                size="sm"
                                                className={isStripeFullyOnboarded ? "text-purple-700 hover:bg-purple-100 w-full" : "bg-purple-600 hover:bg-purple-700 text-white w-full"}
                                                onClick={handleConnectStripe}
                                                disabled={isConnectingStripe}
                                            >
                                                {isConnectingStripe ? "Opening..." : "Manage Stripe Account"}
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                                                onClick={handleConnectStripe}
                                                disabled={isConnectingStripe}
                                            >
                                                {isConnectingStripe ? "Connecting..." : "Connect Stripe"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Placeholder for future insurance modules */}
                    <Card className="shadow-sm border-gray-200 bg-gray-50/50">
                        <CardContent className="p-6 text-center text-gray-500 text-sm">
                            <Shield className="mx-auto mb-2 text-gray-400" size={24} />
                            Insurance tracking module coming soon.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
