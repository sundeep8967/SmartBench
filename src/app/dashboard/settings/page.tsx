"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tabs = [
    "Company Profile",
    "Insurance Vault",
    "Banking & Payouts",
    "Team Members",
    "Notifications",
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("Company Profile");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="text-sm text-gray-500 mb-1">System → Settings</div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage company profile, insurance requirements, and billing details.</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Company Profile Content */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Company Identity Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Company Identity</CardTitle>
                        <p className="text-sm text-gray-500">Update your company details and public information.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 rounded-lg bg-orange-100 flex items-center justify-center">
                                <span className="text-2xl">🏢</span>
                            </div>
                            <button className="text-sm text-blue-600 hover:underline">Change Logo</button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    defaultValue="SmartBench Construction LLC"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">EIN / Tax ID</label>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        defaultValue="83-1234567"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-green-500">✓ Verified</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input
                                    type="text"
                                    defaultValue="https:// smartbench.app"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    defaultValue="+1 (555) 987-6543"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button>Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Payout Method */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Payout Method</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                            <div className="h-10 w-10 rounded bg-purple-100 flex items-center justify-center">
                                <span className="text-purple-600 font-bold text-sm">S</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">Stripe Connected Account ✓</p>
                                <p className="text-sm text-gray-500">Payouts are automatically transferred.</p>
                            </div>
                        </div>

                        <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Bank Account</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-lg">🏦</span>
                                        <div>
                                            <p className="font-medium text-gray-900">Chase Bank **** 4242</p>
                                            <p className="text-xs text-gray-500">Checking Account</p>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">PRIMARY</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Insurance Compliance */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded bg-green-100 flex items-center justify-center">
                                    <span className="text-green-600">🛡️</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">General Liability</p>
                                    <p className="text-xs text-gray-500">Policy #GL-9832290</p>
                                </div>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">● Active</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-gray-500">Coverage</span>
                            <span className="font-medium text-gray-900">$2,000,000</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded bg-yellow-100 flex items-center justify-center">
                                    <span className="text-yellow-600">⚠️</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Workers Compensation</p>
                                    <p className="text-xs text-gray-500">Policy #WC-1120043</p>
                                </div>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">⚠ Expiring Soon</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
