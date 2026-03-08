"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Clock, AlertTriangle, Loader2, Database, Download, History, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DataRetention() {
    const { data, isLoading, error, mutate } = useSWR("/api/admin/retention/stats", fetcher);
    const [isRunning, setIsRunning] = useState(false);
    const [jobResult, setJobResult] = useState<{ success: boolean; message: string; results?: any } | null>(null);

    const handleRunJob = async () => {
        if (!confirm("Are you sure you want to manually trigger the Data Archival Job? This action is irreversible and will anonymize/delete all data that has exceeded the compliance retention period.")) {
            return;
        }

        setIsRunning(true);
        setJobResult(null);

        try {
            const res = await fetch("/api/admin/retention/archive", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            const result = await res.json();

            if (!res.ok) throw new Error(result.error || "Failed to run archival job");

            setJobResult({
                success: true,
                message: result.message,
                results: result.results
            });

            mutate(); // Refresh stats
        } catch (e: any) {
            setJobResult({ success: false, message: e.message });
        } finally {
            setIsRunning(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                <p className="text-gray-500 font-medium">Loading Compliance Data...</p>
            </div>
        );
    }

    if (error || data?.error) {
        return (
            <div className="py-20 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Failed to load retention stats</h2>
                <p className="text-gray-500 mt-2">{data?.error || "An unexpected error occurred"}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Data Retention & Compliance</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage platform data lifecycle per IRS and liability requirements.</p>
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" /> Export Report
                </Button>
            </div>

            {/* Policy Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5"><Database className="h-3 w-3" /> Bookings & TXNs</CardDescription>
                        <CardTitle className="text-xl text-blue-900">7 Years</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-blue-700/80">IRS compliance. Anonymized after expiration.</p>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50/50 border-emerald-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5"><Shield className="h-3 w-3" /> Insurance Vault</CardDescription>
                        <CardTitle className="text-xl text-emerald-900">1 Year</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-emerald-700/80">Liability proof. Retained 1yr post-expiration.</p>
                    </CardContent>
                </Card>

                <Card className="bg-gray-50/80 border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5"><History className="h-3 w-3" /> Audit Trail</CardDescription>
                        <CardTitle className="text-xl text-gray-800">7 Years</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-500">Security event history. Deleted post-expiration.</p>
                    </CardContent>
                </Card>

                <Card className="bg-gray-50/80 border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Communications</CardDescription>
                        <CardTitle className="text-xl text-gray-800">2 Years</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-gray-500">In-app chats. Replaced with [Redacted].</p>
                    </CardContent>
                </Card>
            </div>

            {/* Live Statistics Table */}
            <Card className="shadow-sm border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/30">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        Live Compliance Status
                    </h3>
                    <Badge variant="outline" className="text-xs font-semibold bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> All Systems Compliant
                    </Badge>
                </div>
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Data Category</th>
                                <th className="px-6 py-3 font-semibold">Total Records</th>
                                <th className="px-6 py-3 font-semibold text-amber-600">Expiring Soon (&lt;30d)</th>
                                <th className="px-6 py-3 font-semibold text-red-600">Action Required (Expired)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 border-l-4 border-l-blue-500">Bookings (7y)</td>
                                <td className="px-6 py-4 font-mono text-gray-600">{data?.bookings?.total.toLocaleString() || 0}</td>
                                <td className="px-6 py-4 font-mono text-amber-600">{data?.bookings?.expiringSoon.toLocaleString() || 0}</td>
                                <td className="px-6 py-4 font-mono text-red-600 font-bold">{data?.bookings?.expired.toLocaleString() || 0}</td>
                            </tr>
                            <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 border-l-4 border-l-gray-500">System Audit Logs (7y)</td>
                                <td className="px-6 py-4 font-mono text-gray-600">{data?.auditLogs?.total.toLocaleString() || 0}</td>
                                <td className="px-6 py-4 font-mono text-amber-600">{data?.auditLogs?.expiringSoon.toLocaleString() || 0}</td>
                                <td className="px-6 py-4 font-mono text-red-600 font-bold">{data?.auditLogs?.expired.toLocaleString() || 0}</td>
                            </tr>
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Action Area */}
            <Card className="shadow-sm border-gray-200 bg-red-50/30">
                <CardContent className="p-6 flex items-start gap-4">
                    <div className="bg-red-100 p-2.5 rounded-full flex-shrink-0 mt-1">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-900 mb-1">Manual Archival Trigger</h3>
                        <p className="text-sm text-red-800/80 mb-4 max-w-2xl">
                            The system automatically cleans up expired data every night at 2:00 AM UTC.
                            If you need to force an immediate compliance sweep, you can run the archival job manually. This action is carefully logged.
                        </p>

                        {jobResult && (
                            <div className={`p-4 rounded-md mb-4 text-sm font-medium border ${jobResult.success ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                                {jobResult.success ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-4 w-4" /> {jobResult.message}</div>
                                        <ul className="list-disc pl-5 space-y-1 text-xs text-green-700/80 font-mono">
                                            <li>Audit Logs Deleted: {jobResult.results.auditLogsDeleted}</li>
                                            <li>Bookings Anonymized: {jobResult.results.bookingsAnonymized}</li>
                                        </ul>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Error: {jobResult.message}</div>
                                )}
                            </div>
                        )}

                        <Button
                            variant="destructive"
                            disabled={isRunning}
                            onClick={handleRunJob}
                            className="bg-red-600 hover:bg-red-700 font-bold tracking-wide"
                        >
                            {isRunning ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing Sweep...</>
                            ) : (
                                "Run Archival & Anonymization Job Now"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
