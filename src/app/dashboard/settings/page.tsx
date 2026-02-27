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
                const { data } = await supabase
                    .from('worker_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();
                if (data) setProfile(data);
            }
        };
        fetchProfile();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <div className="text-sm text-gray-500 mb-1">System → Settings</div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-gray-500">Manage company profile, insurance requirements, and billing details.</p>
            </div>

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
                                            <input type="text" defaultValue="SmartBench Construction LLC" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">EIN / Tax ID</label>
                                            <div className="relative">
                                                <input type="text" defaultValue="83-1234567" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:pr-24" />
                                                <span className="hidden md:flex absolute right-2 top-1/2 transform -translate-y-1/2 items-center text-xs text-green-600 font-medium">
                                                    <Check size={12} className="mr-1" /> Verified
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                            <input type="text" defaultValue="https://smartbench.app" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input type="text" defaultValue="+1 (555) 987-6543" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <Button className="bg-blue-900 hover:bg-blue-800 text-white">Save Changes</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-gray-200">
                                <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                                    <CardTitle className="text-base font-bold text-gray-900">Payout Method</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-100 mb-6">
                                        <div className="h-10 w-10 rounded bg-purple-100 flex items-center justify-center mr-4">
                                            <span className="text-purple-600 font-bold">S</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900 flex items-center">Stripe Connected Account <Check size={14} className="ml-1 text-green-600" /></p>
                                            <p className="text-sm text-gray-500">Payouts are automatically transferred weekly.</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-purple-700 hover:bg-purple-100">Manage</Button>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-3">Linked Bank Accounts</h4>
                                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer bg-white">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                                                    <CreditCard size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Chase Bank **** 4242</p>
                                                    <p className="text-xs text-gray-500">Checking Account</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">PRIMARY</span>
                                        </div>
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
                    <Card className="shadow-sm border-gray-200 border-l-4 border-l-green-500">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center">
                                    <Shield className="text-green-600 mr-2" size={20} />
                                    <span className="font-bold text-gray-900">General Liability</span>
                                </div>
                                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Active</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Policy #GL-9832290</p>
                            <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Coverage</p>
                                    <p className="font-bold text-gray-900">$2,000,000</p>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-200 border-l-4 border-l-yellow-500">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center">
                                    <AlertTriangle className="text-yellow-600 mr-2" size={20} />
                                    <span className="font-bold text-gray-900">Worker's Comp</span>
                                </div>
                                <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Expiring</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Policy #WC-1120043</p>
                            <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase">Coverage</p>
                                    <p className="font-bold text-gray-900">$1,000,000</p>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-xs">Renew</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
