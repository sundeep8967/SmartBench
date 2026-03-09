"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Scale, Clock, MapPin, Camera, AlertCircle, History, MessageSquare, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EvidenceViewPage() {
    const params = useParams();
    const router = useRouter();
    const timeEntryId = params.timeEntryId as string;

    const { data, isLoading, error } = useSWR(`/api/admin/disputes/${timeEntryId}/evidence`, fetcher);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                <p className="text-gray-500 font-medium">Gathering Evidence...</p>
            </div>
        );
    }

    if (error || data?.error) {
        return (
            <div className="py-20 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Failed to load evidence</h2>
                <p className="text-gray-500 mt-2">{data?.error || "An unexpected error occurred"}</p>
                <Button onClick={() => router.back()} variant="outline" className="mt-6">Go Back</Button>
            </div>
        );
    }

    const { evidence } = data;
    if (!evidence) return null;

    const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—";
    const fmtDateTime = (iso?: string) => iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

    // Calculate discrepancies
    const clockInDiff = (new Date(evidence.timeEntry.systemClockIn).getTime() - new Date(evidence.timeEntry.clockIn).getTime()) / 60000;
    const clockOutDiff = evidence.timeEntry.systemClockOut && evidence.timeEntry.clockOut
        ? (new Date(evidence.timeEntry.systemClockOut).getTime() - new Date(evidence.timeEntry.clockOut).getTime()) / 60000
        : 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Scale className="h-4 w-4 text-red-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-red-600">Super Admin Evidence View</span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dispute Resolution</h1>
                    </div>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 uppercase font-bold text-xs py-1 px-3">
                    {evidence.timeEntry.status}
                </Badge>
            </div>

            {/* Context Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-gray-400">Worker & Lender</CardDescription>
                        <CardTitle className="text-lg">{evidence.parties.workerName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium text-gray-700">{evidence.parties.lenderCompanyName}</p>
                        <p className="text-xs text-gray-500 mt-1">{evidence.parties.workerEmail}</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-gray-400">Booking & Borrower</CardDescription>
                        <CardTitle className="text-lg">{evidence.parties.borrowerCompanyName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium text-gray-700">Ref: <span className="font-mono text-xs">{evidence.booking.id.slice(0, 8).toUpperCase()}</span></p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{evidence.booking.projectName} • {evidence.booking.projectAddress}</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-100 bg-red-50 border-red-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-red-400">Time Entry ID</CardDescription>
                        <CardTitle className="text-lg font-mono text-red-900">{evidence.timeEntry.id.slice(0, 8).toUpperCase()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium text-red-700">
                            Shift Date: {new Date(evidence.timeEntry.systemClockIn).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Time & GPS Details */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="shadow-sm border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <h3 className="font-bold text-sm text-gray-900">System Records vs Submitted</h3>
                        </div>
                        <CardContent className="p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-2 font-semibold">Event</th>
                                        <th className="px-4 py-2 font-semibold border-l">Machine Time</th>
                                        <th className="px-4 py-2 font-semibold border-l">User Submitted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {/* Clock IN */}
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-gray-900 bg-gray-50/50">Clock In</td>
                                        <td className="px-4 py-3 font-mono text-gray-600 border-l">{fmtTime(evidence.timeEntry.systemClockIn)}</td>
                                        <td className="px-4 py-3 font-mono border-l font-bold text-gray-900">
                                            {fmtTime(evidence.timeEntry.clockIn)}
                                            {Math.abs(clockInDiff) > 0 && (
                                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${Math.abs(clockInDiff) > 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {clockInDiff > 0 ? `+${Math.round(clockInDiff)}m` : `${Math.round(clockInDiff)}m`}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    {/* Clock OUT */}
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-gray-900 bg-gray-50/50">Clock Out</td>
                                        <td className="px-4 py-3 font-mono text-gray-600 border-l">{fmtTime(evidence.timeEntry.systemClockOut)}</td>
                                        <td className="px-4 py-3 font-mono border-l font-bold text-gray-900">
                                            {fmtTime(evidence.timeEntry.clockOut)}
                                            {evidence.timeEntry.systemClockOut && Math.abs(clockOutDiff) > 0 && (
                                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${Math.abs(clockOutDiff) > 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {clockOutDiff > 0 ? `+${Math.round(clockOutDiff)}m` : `${Math.round(clockOutDiff)}m`}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Sensor Data (GPS & Photos) */}
                    <Card className="shadow-sm border-gray-200 border-dashed">
                        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-600" />
                            <h3 className="font-bold text-sm text-gray-900">Sensor Evidence</h3>
                        </div>
                        <CardContent className="p-4 space-y-4">
                            <div>
                                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location Telemetry</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Clock In GPS</p>
                                        {evidence.timeEntry.gpsClockIn ? (
                                            <p className="font-mono text-xs text-purple-700">{evidence.timeEntry.gpsClockIn.lat.toFixed(5)}, {evidence.timeEntry.gpsClockIn.lng.toFixed(5)}<br />(±{Math.round(evidence.timeEntry.gpsClockIn.accuracy)}m)</p>
                                        ) : <p className="text-xs text-gray-400 italic">No telemetry</p>}
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Clock Out GPS</p>
                                        {evidence.timeEntry.gpsClockOut ? (
                                            <p className="font-mono text-xs text-purple-700">{evidence.timeEntry.gpsClockOut.lat.toFixed(5)}, {evidence.timeEntry.gpsClockOut.lng.toFixed(5)}<br />(±{Math.round(evidence.timeEntry.gpsClockOut.accuracy)}m)</p>
                                        ) : <p className="text-xs text-gray-400 italic">No telemetry</p>}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-1 mt-4"><Camera className="h-3 w-3" /> Site Photos</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {evidence.timeEntry.photoClockIn ? (
                                        <img src={evidence.timeEntry.photoClockIn} alt="In" className="w-full h-24 object-cover rounded-md border" />
                                    ) : <div className="h-24 bg-gray-100 rounded-md border flex items-center justify-center text-xs text-gray-400">No Photo</div>}

                                    {evidence.timeEntry.photoClockOut ? (
                                        <img src={evidence.timeEntry.photoClockOut} alt="Out" className="w-full h-24 object-cover rounded-md border" />
                                    ) : <div className="h-24 bg-gray-100 rounded-md border flex items-center justify-center text-xs text-gray-400">No Photo</div>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Chat & Audit Logs */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Chat Transcript */}
                    <Card className="shadow-sm border-gray-200">
                        <div className="bg-blue-50/50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                <h3 className="font-bold text-sm text-gray-900">Dispute Transcript</h3>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{evidence.chatTranscript.length} messages</span>
                        </div>
                        <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                            <div className="p-4 space-y-4">
                                {evidence.chatTranscript.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-8 italic">No negotiation messages found.</p>
                                ) : (
                                    evidence.chatTranscript.map((msg: any) => (
                                        <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : 'items-start'}`}>
                                            {msg.isSystem ? (
                                                <div className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-3 py-1 rounded-full my-2 flex items-center gap-1.5 border border-gray-200">
                                                    <Clock size={10} />
                                                    {msg.message}
                                                    <span className="text-gray-400 font-normal normal-case ml-1">{fmtDateTime(msg.timestamp)}</span>
                                                </div>
                                            ) : (
                                                <div className="bg-white border text-sm text-gray-800 p-3 rounded-xl shadow-sm max-w-[85%]">
                                                    <p className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider flex justify-between gap-4">
                                                        <span>{msg.sender}</span>
                                                        <span className="font-normal">{fmtTime(msg.timestamp)}</span>
                                                    </p>
                                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Audit Trail */}
                    <Card className="shadow-sm border-gray-200">
                        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                            <History className="h-4 w-4 text-gray-600" />
                            <h3 className="font-bold text-sm text-gray-900">System Audit Trail</h3>
                        </div>
                        <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                            <table className="w-full text-xs text-left">
                                <tbody className="divide-y divide-gray-100">
                                    {evidence.auditTrail.length === 0 ? (
                                        <tr><td className="p-8 text-center text-gray-400 italic">No audit records bound to this entry.</td></tr>
                                    ) : (
                                        evidence.auditTrail.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-gray-500 font-mono w-32 whitespace-nowrap">
                                                    {fmtDateTime(log.timestamp)}
                                                </td>
                                                <td className="px-4 py-2 font-medium text-gray-900 border-l">
                                                    {log.action}
                                                </td>
                                                <td className="px-4 py-2 text-gray-500 border-l max-w-[200px] truncate" title={log.actor_id}>
                                                    by {log.actor_id.slice(0, 8)}...
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="mt-8 flex justify-center pt-6 border-t border-gray-200">
                {/* 
                  NOTE: PRD says "Read Only Interface" for Super Admins to "review Disputes". 
                  We won't actually implement force-resolution unless requested, simply log it as read-only.
                */}
                <Button disabled variant="outline" className="opacity-50 min-w-[200px]">Read-Only Mode</Button>
            </div>
        </div>
    );
}
