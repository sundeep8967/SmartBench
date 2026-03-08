"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, AlertTriangle, ShieldCheck, Loader2, CheckCircle2, Clock, CheckSquare, Square, MessageSquare, GitCompare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { DisputeChatModal } from "@/components/dashboard/dispute-chat-modal";
import { useAuth } from "@/lib/contexts/AuthContext";

interface TimeEntry {
    id: string;
    clock_in: string;
    clock_out: string | null;
    total_break_minutes: number;
    status: string;
    gps_clock_in: { lat: number; lng: number; accuracy: number } | null;
    gps_clock_out: { lat: number; lng: number; accuracy: number } | null;
    auto_approval_at: string | null;
    payout_released: boolean;
    // Story 5.8: original device-recorded times (frozen at first write)
    system_clock_in: string | null;
    system_clock_out: string | null;
    worker?: { full_name: string; email: string } | null;
    project?: { name: string; address: string } | null;
}

function AutoApprovalCountdown({ autoApprovalAt }: { autoApprovalAt: string }) {
    const [remaining, setRemaining] = useState("");

    useEffect(() => {
        const update = () => {
            const diff = new Date(autoApprovalAt).getTime() - Date.now();
            if (diff <= 0) { setRemaining("Auto-approving soon..."); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setRemaining(`Auto-approves in ${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [autoApprovalAt]);

    return (
        <span className="flex items-center text-xs text-orange-600 font-medium">
            <Clock size={11} className="mr-1" /> {remaining}
        </span>
    );
}

export default function TimesheetsPage() {
    const { toast } = useToast();
    const { companyId } = useAuth();
    const [activeTab, setActiveTab] = useState<"Pending_Verification" | "Disputed" | "Verified">("Pending_Verification");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchLoading, setBatchLoading] = useState(false);
    const [chatModalEntryId, setChatModalEntryId] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const { data, isLoading: loading, mutate } = useSWR(
        `/api/timesheets?status=${activeTab === "Pending_Verification" ? "Pending_Verification" : activeTab}`,
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30000 }
    );

    const entries: TimeEntry[] = data?.entries || [];
    const counts: Record<string, number> = data?.counts || { Pending: 0, Disputed: 0, Verified: 0 };

    // Reset selection and page when tab changes
    useEffect(() => {
        setSelectedIds(new Set());
        setCurrentPage(1);
    }, [activeTab]);

    const totalPages = Math.ceil(entries.length / itemsPerPage);
    const currentEntries = entries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
            const result = await res.json();
            toast({
                title: action === "approve" ? "✅ Approved" : "⚠️ Disputed",
                description: action === "approve"
                    ? result.payout_status === "released"
                        ? `Timesheet verified & $${((result.payout_amount_cents || 0) / 100).toFixed(2)} payout released!`
                        : "Timesheet verified! (Payout pending — lender may need Stripe setup)"
                    : "Timesheet marked as disputed.",
            });
            await mutate();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleBatchApprove = async () => {
        if (selectedIds.size === 0) return;
        setBatchLoading(true);
        let successCount = 0;
        for (const id of selectedIds) {
            try {
                const res = await fetch("/api/timesheets", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ time_entry_id: id, action: "approve" }),
                });
                if (res.ok) successCount++;
            } catch (_) { /* continue */ }
        }
        toast({
            title: `Batch Approved ${successCount}/${selectedIds.size}`,
            description: "Payouts have been queued for verified timesheets.",
        });
        setSelectedIds(new Set());
        await mutate();
        setBatchLoading(false);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === currentEntries.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(currentEntries.map(e => e.id)));
        }
    };

    const formatHours = (clockIn: string, clockOut: string | null, breakMin: number) => {
        if (!clockOut) return "In Progress";
        const diffMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
        const totalMin = Math.max(0, Math.round(diffMs / 60000) - (breakMin || 0));
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return `${h}h ${m.toString().padStart(2, "0")}m`;
    };

    const tabs = [
        { key: "Pending_Verification" as const, label: "Pending", count: counts.Pending },
        { key: "Disputed" as const, label: "Disputed", count: counts.Disputed },
        { key: "Verified" as const, label: "History", count: counts.Verified },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Timesheet Verification</h1>
                    <p className="text-gray-500">Review and approve hours. Payouts release automatically after 4 hours.</p>
                </div>
                {activeTab === "Pending_Verification" && selectedIds.size > 0 && (
                    <Button
                        className="bg-blue-900 hover:bg-blue-800 text-white shadow-sm h-9 px-6 font-medium"
                        onClick={handleBatchApprove}
                        disabled={batchLoading}
                    >
                        {batchLoading
                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Approving...</>
                            : <><CheckSquare size={16} className="mr-2" /> Approve Selected ({selectedIds.size})</>
                        }
                    </Button>
                )}
            </div>

            {/* Tabs & Pagination wrapper */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Pagination Controls */}
                {!loading && entries.length > 0 && (
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">
                            Showing {currentEntries.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, entries.length)} of {entries.length}
                        </span>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5 bg-white border rounded-lg p-1 shadow-sm">
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
                                <span className="text-xs font-semibold px-2">Pg {currentPage}</span>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                            </div>
                        )}
                    </div>
                )}
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
                        {activeTab === "Pending_Verification" ? "No pending timesheets to review." :
                            activeTab === "Disputed" ? "No disputed timesheets." :
                                "No verified timesheets yet."}
                    </p>
                    <p className="text-gray-400 text-sm">Timesheets will appear here once workers clock out.</p>
                </div>
            )}

            {/* Select All toolbar */}
            {!loading && entries.length > 0 && activeTab === "Pending_Verification" && (
                <div className="flex items-center gap-3 pb-1">
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors"
                    >
                        {selectedIds.size === currentEntries.length && currentEntries.length > 0
                            ? <CheckSquare size={16} className="text-blue-900" />
                            : <Square size={16} />}
                        {selectedIds.size === currentEntries.length ? "Deselect Page" : "Select Page"}
                    </button>
                    {selectedIds.size > 0 && (
                        <span className="text-xs text-gray-500">{selectedIds.size} selected</span>
                    )}
                </div>
            )}

            {/* List */}
            {!loading && entries.length > 0 && (
                <div className="space-y-3">
                    {currentEntries.map((item) => {
                        const workerName = (item.worker as any)?.full_name || "Unknown";
                        const initials = workerName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                        const date = new Date(item.clock_in).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                        const timeIn = new Date(item.clock_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                        const timeOut = item.clock_out ? new Date(item.clock_out).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";
                        const hours = formatHours(item.clock_in, item.clock_out, item.total_break_minutes);
                        const hasGpsIn = !!item.gps_clock_in;
                        const hasGpsOut = !!item.gps_clock_out;
                        const isSelected = selectedIds.has(item.id);

                        // Story 5.8: compute system vs submitted time deltas
                        const sysIn = item.system_clock_in ? new Date(item.system_clock_in) : null;
                        const sysOut = item.system_clock_out ? new Date(item.system_clock_out) : null;
                        const subIn = new Date(item.clock_in);
                        const subOut = item.clock_out ? new Date(item.clock_out) : null;
                        const inDeltaMin = sysIn ? Math.round((subIn.getTime() - sysIn.getTime()) / 60000) : null;
                        const outDeltaMin = (sysOut && subOut) ? Math.round((subOut.getTime() - sysOut.getTime()) / 60000) : null;
                        const hasDiff = (inDeltaMin !== null && inDeltaMin !== 0) || (outDeltaMin !== null && outDeltaMin !== 0);

                        const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                        const deltaLabel = (d: number) => d === 0 ? "No change" : d > 0 ? `+${d} min later` : `${d} min earlier`;
                        const deltaBadge = (d: number) => d === 0
                            ? "bg-green-50 text-green-700 border-green-200"
                            : Math.abs(d) <= 5
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200";

                        return (
                            <Card
                                key={item.id}
                                className={`p-0 shadow-sm border overflow-hidden hover:shadow-md transition-all ${isSelected ? "border-blue-500 ring-1 ring-blue-400" : hasDiff ? "border-amber-300" : "border-gray-200"}`}
                            >
                                <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
                                    {/* Checkbox + Worker */}
                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        {activeTab === "Pending_Verification" && (
                                            <button onClick={() => toggleSelect(item.id)} className="flex-shrink-0">
                                                {isSelected
                                                    ? <CheckSquare size={18} className="text-blue-900" />
                                                    : <Square size={18} className="text-gray-300 hover:text-gray-500" />
                                                }
                                            </button>
                                        )}
                                        <div className="h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {initials}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">{workerName}</h3>
                                            <p className="text-xs text-gray-500">{(item.project as any)?.name || "No Project"}</p>
                                        </div>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="text-center min-w-[100px]">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Date</p>
                                        <p className="text-sm font-semibold text-gray-900">{date}</p>
                                        <p className="text-xs text-gray-400">{timeIn} – {timeOut}</p>
                                    </div>

                                    {/* Hours */}
                                    <div className="text-center min-w-[80px]">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hours</p>
                                        <p className="text-sm font-semibold text-gray-900">{hours}</p>
                                    </div>

                                    {/* GPS Badges */}
                                    <div className="flex flex-col gap-1 min-w-[120px]">
                                        <span className={`flex items-center px-2.5 py-1 text-xs font-medium rounded-full border w-fit
                                            ${hasGpsIn ? "bg-green-50 text-green-700 border-green-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"}`}>
                                            <MapPin size={11} className="mr-1.5" />
                                            Clock-In: {hasGpsIn ? `±${Math.round(item.gps_clock_in!.accuracy)}m` : "No GPS"}
                                        </span>
                                        <span className={`flex items-center px-2.5 py-1 text-xs font-medium rounded-full border w-fit
                                            ${hasGpsOut ? "bg-green-50 text-green-700 border-green-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"}`}>
                                            <MapPin size={11} className="mr-1.5" />
                                            Clock-Out: {hasGpsOut ? `±${Math.round(item.gps_clock_out!.accuracy)}m` : "No GPS"}
                                        </span>
                                        {item.payout_released && (
                                            <span className="flex items-center px-2.5 py-1 text-xs font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-100 w-fit">
                                                <ShieldCheck size={11} className="mr-1.5" /> Payout Released
                                            </span>
                                        )}
                                    </div>

                                    {/* Auto-approval countdown or actions */}
                                    <div className="flex flex-col items-end gap-2 min-w-[200px]">
                                        {activeTab === "Pending_Verification" && item.auto_approval_at && !item.payout_released && (
                                            <AutoApprovalCountdown autoApprovalAt={item.auto_approval_at} />
                                        )}
                                        <div className="flex items-center gap-2">
                                            {activeTab === "Pending_Verification" && (
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
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-gray-600 border-gray-200 hover:bg-gray-50 h-9 font-medium"
                                                        onClick={() => setChatModalEntryId(item.id)}
                                                    >
                                                        <MessageSquare size={16} className="mr-2" /> Chat
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-900 hover:bg-blue-800 text-white shadow-sm h-9 px-6 font-medium"
                                                        onClick={() => handleAction(item.id, "approve")}
                                                        disabled={actionLoading === item.id}
                                                    >
                                                        Resolve & Approve
                                                    </Button>
                                                </div>
                                            )}
                                            {activeTab === "Verified" && (
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-gray-600 border-gray-200 hover:bg-gray-50 h-8 font-medium px-3"
                                                        onClick={() => setChatModalEntryId(item.id)}
                                                    >
                                                        <MessageSquare size={14} className="mr-1.5" /> Chat
                                                    </Button>
                                                    <span className="flex items-center text-green-600 text-xs font-medium">
                                                        <ShieldCheck size={14} className="mr-1" /> Verified
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Story 5.8: Visual Diff Strip — shown only when draft edits changed the time */}
                                {hasDiff && sysIn && (
                                    <div className="border-t border-amber-200 bg-amber-50/60 px-5 py-3">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <GitCompare size={13} className="text-amber-600" />
                                            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Time Edit Detected</span>
                                            <span className="text-[10px] text-amber-500 ml-1">Worker adjusted times in Draft Mode</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* Header */}
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Field</span>
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">System (Device)</span>
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Submitted</span>

                                            {/* Clock-In row */}
                                            <span className="text-xs text-gray-600 font-medium">Clock-In</span>
                                            <span className="text-xs font-mono text-gray-700">{fmtTime(sysIn)}</span>
                                            <span className={`text-xs font-mono flex items-center gap-1`}>
                                                {fmtTime(subIn)}
                                                {inDeltaMin !== null && (
                                                    <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded border font-medium ${deltaBadge(inDeltaMin)}`}>
                                                        {deltaLabel(inDeltaMin)}
                                                    </span>
                                                )}
                                            </span>

                                            {/* Clock-Out row */}
                                            {sysOut && subOut && (
                                                <>
                                                    <span className="text-xs text-gray-600 font-medium">Clock-Out</span>
                                                    <span className="text-xs font-mono text-gray-700">{fmtTime(sysOut)}</span>
                                                    <span className="text-xs font-mono flex items-center gap-1">
                                                        {fmtTime(subOut)}
                                                        {outDeltaMin !== null && (
                                                            <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded border font-medium ${deltaBadge(outDeltaMin)}`}>
                                                                {deltaLabel(outDeltaMin)}
                                                            </span>
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Chat Modal */}
            <DisputeChatModal
                isOpen={!!chatModalEntryId}
                onClose={() => setChatModalEntryId(null)}
                timeEntryId={chatModalEntryId!}
                currentCompanyId={companyId!}
            />
        </div>
    );
}
