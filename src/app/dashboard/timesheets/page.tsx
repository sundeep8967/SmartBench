"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, ShieldCheck, Loader2, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TimeEntry {
    id: string;
    clock_in: string;
    clock_out: string | null;
    total_break_minutes: number;
    status: string;
    gps_clock_in: any;
    worker?: { full_name: string; email: string } | null;
    project?: { name: string; address: string } | null;
}

export default function TimesheetsPage() {
    const { toast } = useToast();
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({ Pending: 0, Disputed: 0, Verified: 0 });
    const [activeTab, setActiveTab] = useState<"Pending" | "Disputed" | "Verified">("Pending");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/timesheets?status=${activeTab}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data.entries || []);
                setCounts(data.counts || { Pending: 0, Disputed: 0, Verified: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch timesheets", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const handleAction = async (entryId: string, action: "approve" | "dispute") => {
        setActionLoading(entryId);
        try {
            const res = await fetch("/api/timesheets", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ time_entry_id: entryId, action }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Action failed");
            }

            toast({
                title: action === "approve" ? "Approved" : "Disputed",
                description: action === "approve" ? "Timesheet verified!" : "Timesheet marked as disputed.",
            });
            await fetchEntries();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const formatHours = (clockIn: string, clockOut: string | null, breakMin: number) => {
        if (!clockOut) return "In Progress";
        const diffMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
        const totalMin = Math.round(diffMs / 60000) - (breakMin || 0);
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return `${h}.${Math.round((m / 60) * 10)} Hrs`;
    };

    const tabs = [
        { key: "Pending" as const, label: "Pending", count: counts.Pending },
        { key: "Disputed" as const, label: "Disputed", count: counts.Disputed },
        { key: "Verified" as const, label: "History", count: counts.Verified },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Timesheet Verification</h1>
                    <p className="text-gray-500">Review and approve hours submitted by workers for the current pay period.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-full w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${activeTab === tab.key
                                ? "bg-blue-900 text-white shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-3 text-gray-500">Loading timesheets...</span>
                </div>
            )}

            {/* Empty State */}
            {!loading && entries.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2">
                        {activeTab === "Pending" ? "No pending timesheets to review." :
                            activeTab === "Disputed" ? "No disputed timesheets." :
                                "No verified timesheets yet."}
                    </p>
                    <p className="text-gray-400 text-sm">Timesheets will appear here once workers clock out.</p>
                </div>
            )}

            {/* List */}
            {!loading && entries.length > 0 && (
                <div className="space-y-4">
                    {entries.map((item) => {
                        const workerName = (item.worker as any)?.full_name || "Unknown";
                        const initials = workerName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                        const date = new Date(item.clock_in).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                        const hours = formatHours(item.clock_in, item.clock_out, item.total_break_minutes);
                        const hasGps = !!item.gps_clock_in;

                        return (
                            <Card key={item.id} className="p-0 shadow-sm border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-5 flex items-center justify-between">
                                    {/* Worker */}
                                    <div className="flex items-center space-x-4 min-w-[200px]">
                                        <div className="h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                                            {initials}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">{workerName}</h3>
                                            <p className="text-xs text-gray-500">{(item.project as any)?.name || "No Project"}</p>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="text-center min-w-[100px]">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Date</p>
                                        <p className="text-sm font-semibold text-gray-900">{date}</p>
                                    </div>

                                    {/* Hours */}
                                    <div className="text-center min-w-[80px]">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hours</p>
                                        <p className="text-sm font-semibold text-gray-900">{hours}</p>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex items-center space-x-3 min-w-[200px]">
                                        {hasGps ? (
                                            <span className="flex items-center px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                                                <MapPin size={12} className="mr-1.5" />
                                                GPS Match
                                            </span>
                                        ) : (
                                            <span className="flex items-center px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full border border-yellow-100">
                                                <AlertTriangle size={12} className="mr-1.5" />
                                                No GPS
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-3">
                                        {activeTab === "Pending" && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-gray-600 border-gray-200 hover:bg-gray-50 h-9 font-medium"
                                                    onClick={() => handleAction(item.id, "dispute")}
                                                    disabled={actionLoading === item.id}
                                                >
                                                    Dispute
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-900 hover:bg-blue-800 text-white shadow-sm h-9 px-6 font-medium"
                                                    onClick={() => handleAction(item.id, "approve")}
                                                    disabled={actionLoading === item.id}
                                                >
                                                    {actionLoading === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                                                </Button>
                                            </>
                                        )}
                                        {activeTab === "Disputed" && (
                                            <Button
                                                size="sm"
                                                className="bg-blue-900 hover:bg-blue-800 text-white shadow-sm h-9 px-6 font-medium"
                                                onClick={() => handleAction(item.id, "approve")}
                                                disabled={actionLoading === item.id}
                                            >
                                                Resolve & Approve
                                            </Button>
                                        )}
                                        {activeTab === "Verified" && (
                                            <span className="flex items-center text-green-600 text-xs font-medium">
                                                <ShieldCheck size={14} className="mr-1" /> Verified
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
