"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { Card, CardContent } from "@/components/ui/card";
import {
    Users, Building2, BarChart3, CreditCard, Clock, TrendingUp,
    ShieldCheck, Loader2, Activity, DollarSign,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/admin/user-management";
import { CompanyManagement } from "@/components/admin/company-management";
import { BookingTimeline } from "@/components/admin/booking-timeline";
import { SystemMonitoring } from "@/components/admin/system-monitoring";
import { WednesdayControlCenter } from "@/components/admin/wednesday-control-center";
import { DisputeManagement } from "@/components/admin/dispute-management";
import { DataRetention } from "@/components/admin/data-retention";

function StatCard({
    title, value, sub, icon: Icon, color,
}: {
    title: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <p className="text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">{value}</p>
                        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
                    </div>
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon size={20} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function SuperAdminPage() {
    const { data, isLoading: loading, error } = useSWR("/api/admin/stats", fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-500">Loading platform stats...</span>
            </div>
        );
    }

    if (error || data?.error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShieldCheck size={48} className="text-gray-300 mb-4" />
                <p className="text-xl font-bold text-gray-800">Super Admin Access Required</p>
                <p className="text-gray-500 mt-2">Only Super Admins can view this dashboard.</p>
            </div>
        );
    }

    const { summary, recentBookings, recentUsers } = data || {};

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck size={20} className="text-blue-900" />
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Super Admin</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Platform Overview</h1>
                    <p className="text-gray-500 mt-1">Global metrics, user management, and system health.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 px-3 py-2 rounded-full border border-green-100">
                    <Activity size={13} /> Live Data
                </div>
            </div>

            {/* Dashboard Tabs */}
            <Tabs defaultValue="overview" className="w-full space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="companies">Companies</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline Visualizer</TabsTrigger>
                    <TabsTrigger value="disputes">Evidence View</TabsTrigger>
                    <TabsTrigger value="wednesday">Wednesday Rule</TabsTrigger>
                    <TabsTrigger value="retention">Data Retention</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Users"
                            value={summary.totalUsers.toLocaleString()}
                            sub="Registered accounts"
                            icon={Users}
                            color="bg-blue-50 text-blue-700"
                        />
                        <StatCard
                            title="Total Companies"
                            value={summary.totalCompanies.toLocaleString()}
                            sub="Lender + Borrower orgs"
                            icon={Building2}
                            color="bg-purple-50 text-purple-700"
                        />
                        <StatCard
                            title="Total Bookings"
                            value={summary.totalBookings.toLocaleString()}
                            sub={`${summary.activeBookings} active`}
                            icon={BarChart3}
                            color="bg-green-50 text-green-700"
                        />
                        <StatCard
                            title="Time Entries"
                            value={summary.totalTimeEntries.toLocaleString()}
                            sub="Clock-in records"
                            icon={Clock}
                            color="bg-orange-50 text-orange-700"
                        />
                    </div>

                    {/* Revenue Row */}
                    <div className="grid gap-5 sm:grid-cols-3">
                        <StatCard
                            title="Gross Revenue"
                            value={formatCurrency(summary.totalRevenueCents)}
                            sub="All confirmed bookings"
                            icon={TrendingUp}
                            color="bg-emerald-50 text-emerald-700"
                        />
                        <StatCard
                            title="Service Fees Earned"
                            value={formatCurrency(summary.totalServiceFeesCents)}
                            sub="SmartBench platform share"
                            icon={DollarSign}
                            color="bg-blue-50 text-blue-700"
                        />
                        <StatCard
                            title="Payouts Released"
                            value={formatCurrency(summary.totalPayoutsReleasedCents)}
                            sub="To lender Stripe accounts"
                            icon={CreditCard}
                            color="bg-gray-100 text-gray-700"
                        />
                    </div>

                    {/* Recent Activity */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Recent Bookings */}
                        <Card className="shadow-sm border-gray-100">
                            <CardContent className="p-0">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="font-bold text-gray-900">Recent Bookings</h2>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {(recentBookings || []).length === 0 ? (
                                        <p className="px-6 py-8 text-gray-400 text-sm text-center">No bookings yet.</p>
                                    ) : (recentBookings || []).map((b: any) => (
                                        <div key={b.id} className="px-6 py-3.5 flex items-center justify-between">
                                            <div>
                                                <p className="font-mono text-xs text-blue-600 font-bold">#{b.id.slice(0, 8)}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 text-sm">${(Number(b.total_amount) / 100).toFixed(2)}</p>
                                                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${b.status === "Confirmed" ? "bg-green-50 text-green-700" :
                                                    b.status === "Active" ? "bg-blue-50 text-blue-700" :
                                                        b.status === "Cancelled" ? "bg-red-50 text-red-600" :
                                                            "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {b.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Users */}
                        <Card className="shadow-sm border-gray-100">
                            <CardContent className="p-0">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="font-bold text-gray-900">Recent Sign-Ups</h2>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {(recentUsers || []).length === 0 ? (
                                        <p className="px-6 py-8 text-gray-400 text-sm text-center">No users yet.</p>
                                    ) : (recentUsers || []).map((u: any) => {
                                        const initials = (u.full_name || u.email || "?")
                                            .split(" ")
                                            .map((n: string) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2);
                                        return (
                                            <div key={u.id} className="px-6 py-3.5 flex items-center gap-4">
                                                <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                    {initials}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-gray-900 text-sm truncate">{u.full_name || "—"}</p>
                                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                                </div>
                                                <p className="text-xs text-gray-400 flex-shrink-0">
                                                    {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* System Health Indicator */}
                    <Card className="shadow-sm border-gray-100 bg-gradient-to-r from-blue-900 to-blue-800 text-white overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">System Health</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                                        <span className="font-bold text-lg">All Systems Operational</span>
                                    </div>
                                    <p className="text-blue-300 text-xs mt-1">Database: OK · Stripe: OK · Auth: OK · Cron: Running</p>
                                </div>
                                <div className="text-right text-blue-200 text-xs">
                                    <p>Auto-approve cron: every 5 min</p>
                                    <p>Saved search alerts: daily 5am</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </TabsContent>

                <TabsContent value="users">
                    <UserManagement />
                </TabsContent>

                <TabsContent value="companies">
                    <CompanyManagement />
                </TabsContent>

                <TabsContent value="timeline">
                    <BookingTimeline />
                </TabsContent>

                <TabsContent value="disputes">
                    <DisputeManagement />
                </TabsContent>

                <TabsContent value="system">
                    <SystemMonitoring />
                </TabsContent>

                <TabsContent value="wednesday">
                    <WednesdayControlCenter />
                </TabsContent>

                <TabsContent value="retention">
                    <DataRetention />
                </TabsContent>
            </Tabs>
        </div>
    );
}
