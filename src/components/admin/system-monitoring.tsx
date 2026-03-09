"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Activity, Server, CreditCard, Bell, ShieldAlert, CheckCircle2, RotateCcw, AlertTriangle
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

type LogLevel = 'info' | 'warning' | 'error' | 'critical';
type LogService = 'stripe_webhook' | 'cron_insurance' | 'cron_notifications' | 'system';

interface SystemLog {
    id: string;
    level: LogLevel;
    service: LogService;
    message: string;
    metadata: any;
    resolved: boolean;
    created_at: string;
}

const ServiceIcon = ({ service }: { service: LogService }) => {
    switch (service) {
        case 'stripe_webhook': return <CreditCard size={16} className="text-purple-500" />;
        case 'cron_insurance': return <ShieldAlert size={16} className="text-blue-500" />;
        case 'cron_notifications': return <Bell size={16} className="text-amber-500" />;
        default: return <Server size={16} className="text-gray-500" />;
    }
}

const LevelBadge = ({ level }: { level: LogLevel }) => {
    switch (level) {
        case 'info': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
        case 'warning': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Warning</Badge>;
        case 'error': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
        case 'critical': return <Badge variant="default" className="bg-red-600 text-white">Critical</Badge>;
        default: return <Badge variant="outline">{level}</Badge>;
    }
}

export function SystemMonitoring() {
    const { data, error, mutate, isLoading } = useSWR<{ logs: SystemLog[] }>("/api/admin/system-logs", fetcher, {
        refreshInterval: 15000 // Polling every 15s for real-time feel
    });
    const { toast } = useToast();
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const logs = data?.logs || [];

    // Status Logic
    const hasUnresolvedErrors = logs.some(l => !l.resolved && (l.level === 'error' || l.level === 'critical'));
    const stripeErrors = logs.filter(l => l.service === 'stripe_webhook' && !l.resolved && (l.level === 'error' || l.level === 'critical'));
    const chronInsuranceLogs = logs.filter(l => l.service === 'cron_insurance');
    const chronNotificationsLogs = logs.filter(l => l.service === 'cron_notifications');

    // Status cards
    const getServiceStatus = (errors: any[], lastLog: SystemLog | undefined) => {
        if (errors.length > 0) return { status: 'error', label: `${errors.length} Unresolved Errors`, icon: AlertTriangle, color: 'text-red-500 bg-red-50 border-red-200' };
        if (!lastLog) return { status: 'unknown', label: 'No data', icon: Activity, color: 'text-gray-400 bg-gray-50 border-gray-100' };
        if (new Date(lastLog.created_at).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
            return { status: 'warning', label: 'Stale (No recent runs)', icon: AlertTriangle, color: 'text-yellow-500 bg-yellow-50 border-yellow-200' };
        }
        return { status: 'healthy', label: 'Healthy', icon: CheckCircle2, color: 'text-green-500 bg-green-50 border-green-200' };
    };

    const stripeStatus = getServiceStatus(stripeErrors, logs.find(l => l.service === 'stripe_webhook'));
    const insuranceStatus = getServiceStatus(
        chronInsuranceLogs.filter(l => !l.resolved && l.level === 'error'),
        chronInsuranceLogs[0]
    );
    const notificationsStatus = getServiceStatus(
        chronNotificationsLogs.filter(l => !l.resolved && l.level === 'error'),
        chronNotificationsLogs[0]
    );

    const handleResolve = async (id: string, currentStatus: boolean) => {
        try {
            setResolvingId(id);
            const res = await fetch("/api/admin/system-logs", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, resolved: !currentStatus })
            });

            if (!res.ok) throw new Error("Failed to update status");

            await mutate(); // Refresh the list
            toast({
                title: "Updated logic state",
                description: `Event marked as ${!currentStatus ? 'resolved' : 'unresolved'}.`,
            });
        } catch (e: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: e.message
            });
        } finally {
            setResolvingId(null);
        }
    };

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                    <div className="flex items-center text-red-600">
                        <AlertTriangle className="mr-2" />
                        <span className="font-semibold">Failed to load system logs</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <StatusPanel title="Stripe Webhooks" status={stripeStatus} lastRun={logs.find(l => l.service === 'stripe_webhook')?.created_at} />
                <StatusPanel title="Insurance Cron" status={insuranceStatus} lastRun={chronInsuranceLogs[0]?.created_at} />
                <StatusPanel title="Notifications Cron" status={notificationsStatus} lastRun={chronNotificationsLogs[0]?.created_at} />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Activity className="h-5 w-5 text-gray-400" />
                            Activity Stream
                        </CardTitle>
                        <CardDescription>
                            Real-time view of 100 most recent system events, chron fires, and webhooks.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
                        <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {!logs.length && !isLoading ? (
                        <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg">
                            <Activity className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                            <p>No system logs recorded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div key={log.id} className={`p-4 border rounded-xl flex flex-col md:flex-row gap-4 md:items-start transition-all ${log.resolved ? 'bg-gray-50/50 opacity-70 border-gray-100' : 'bg-white border-gray-200'}`}>

                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="mt-1 bg-gray-50 p-2 rounded-lg border shadow-sm">
                                            <ServiceIcon service={log.service} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <LevelBadge level={log.level} />
                                                <span className="text-sm font-semibold text-gray-900 truncate uppercase tracking-wider">{log.service.replace('_', ' ')}</span>
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className={`text-sm ${log.resolved ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                                {log.message}
                                            </p>

                                            {/* Expandable metadata preview if it exists */}
                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <div className="mt-2 text-xs bg-slate-900 text-slate-300 p-2 rounded font-mono overflow-auto max-h-24 max-w-full">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0 pt-1 flex flex-row md:flex-col gap-2 justify-between">
                                        <div className="text-xs text-gray-400 text-right md:w-full">
                                            {format(new Date(log.created_at), "MMM d, h:mm a")}
                                        </div>
                                        {(log.level === 'error' || log.level === 'critical' || log.level === 'warning') && (
                                            <Button
                                                size="sm"
                                                variant={log.resolved ? "outline" : "default"}
                                                className={`h-7 text-xs ${!log.resolved ? "bg-slate-800 hover:bg-slate-700" : ""}`}
                                                onClick={() => handleResolve(log.id, log.resolved)}
                                                disabled={resolvingId === log.id}
                                            >
                                                {resolvingId === log.id ? "Updating..." : log.resolved ? "Unresolve" : "Acknowledge"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function StatusPanel({ title, status, lastRun }: { title: string, status: any, lastRun?: string }) {
    const Icon = status.icon;
    return (
        <div className={`flex-1 p-4 rounded-xl border ${status.color}`}>
            <h3 className="text-sm font-semibold mb-3">{title}</h3>
            <div className="flex items-center gap-2">
                <Icon size={18} />
                <span className="font-medium text-sm">{status.label}</span>
            </div>
            {lastRun && (
                <p className="text-xs mt-3 opacity-60 font-medium">
                    Last active: {formatDistanceToNow(new Date(lastRun), { addSuffix: true })}
                </p>
            )}
        </div>
    );
}
