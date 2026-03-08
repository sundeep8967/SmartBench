'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    TrendingUp, Clock, Calendar, AlertTriangle,
    CheckCircle, Info, ChevronRight, Users, DollarSign,
    BarChart3, RefreshCw, Download, Briefcase
} from 'lucide-react';

interface KPIs {
    activeBookings: number;
    pendingVerifications: number;
    totalHours: number;
    totalRevenue: number | null;
    totalSpend: number | null;
    totalServiceFees: number | null;
    totalBookings: number;
}

interface ChartPoint {
    weekLabel: string;
    revenue: number;
    spend: number;
    bookings: number;
    hours: number;
}

interface TopWorker {
    name: string;
    avatar_url: string | null;
    hours: number;
    payout: number;
}

interface Alert {
    type: 'critical' | 'warning' | 'info';
    message: string;
    action: string;
    actionLabel: string;
}

interface RecentBooking {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    workerName: string;
    projectName: string | null;
    isLender: boolean;
}

interface AnalyticsData {
    kpis: KPIs;
    chartData: ChartPoint[];
    topWorkers: TopWorker[];
    alerts: Alert[];
    recentBookings: RecentBooking[];
    isAdmin: boolean;
}

type ChartMetric = 'revenue' | 'spend' | 'hours' | 'bookings';
type WeeksFilter = 4 | 8 | 12;

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtFull = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const statusColor: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Confirmed: 'bg-blue-100 text-blue-700',
    Completed: 'bg-gray-100 text-gray-600',
    Cancelled: 'bg-red-100 text-red-700',
    Pending: 'bg-orange-100 text-orange-700',
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.max((value / max) * 100, 2) : 2;
    return (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.8s ease' }} />
        </div>
    );
}

function BarChart({ data, metric, color }: { data: ChartPoint[]; metric: ChartMetric; color: string }) {
    const vals = data.map(d => d[metric]);
    const max = Math.max(...vals, 1);

    return (
        <div className="flex items-end gap-1 h-36 w-full">
            {data.map((d, i) => {
                const pct = Math.max((d[metric] / max) * 100, 2);
                return (
                    <div key={i} className="flex flex-col items-center flex-1 group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            {metric === 'revenue' || metric === 'spend' ? fmt(d[metric]) : metric === 'hours' ? `${d[metric].toFixed(1)}h` : `${d[metric]} bookings`}
                        </div>
                        <div
                            className={`w-full max-w-[28px] mx-auto rounded-t-sm ${color} group-hover:opacity-80 transition-all duration-500 ease-out`}
                            style={{ height: `${pct}%` }}
                        />
                        <span className="text-[9px] text-gray-400 mt-1 leading-none">{d.weekLabel.split(' ')[0]}</span>
                    </div>
                );
            })}
        </div>
    );
}

function AlertBadge({ type }: { type: Alert['type'] }) {
    if (type === 'critical') return <AlertTriangle size={16} className="text-red-500 shrink-0" />;
    if (type === 'warning') return <AlertTriangle size={16} className="text-amber-500 shrink-0" />;
    return <Info size={16} className="text-blue-500 shrink-0" />;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [weeks, setWeeks] = useState<WeeksFilter>(12);
    const [metric, setMetric] = useState<ChartMetric>('revenue');

    const load = useCallback(async (w: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics/company?weeks=${w}`);
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(weeks); }, [weeks, load]);

    // Export CSV
    const exportCSV = () => {
        if (!data) return;
        const rows = [
            ['Week', 'Revenue ($)', 'Spend ($)', 'Bookings', 'Hours'],
            ...data.chartData.map(d => [d.weekLabel, d.revenue.toFixed(2), d.spend.toFixed(2), d.bookings, d.hours.toFixed(1)]),
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `smartbench-analytics-${weeks}w.csv`; a.click();
    };

    const kpis = data?.kpis;
    const alerts = data?.alerts || [];
    const criticals = alerts.filter(a => a.type === 'critical');
    const chartColors: Record<ChartMetric, string> = {
        revenue: 'bg-emerald-500',
        spend: 'bg-rose-400',
        hours: 'bg-blue-500',
        bookings: 'bg-indigo-400',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics</h1>
                    <p className="text-gray-500 text-sm">Company performance overview on SmartBench</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Weeks filter */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        {([4, 8, 12] as WeeksFilter[]).map(w => (
                            <button
                                key={w}
                                onClick={() => setWeeks(w)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${weeks === w ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {w}W
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => load(weeks)} disabled={loading}>
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </Button>
                    {data?.isAdmin && (
                        <Button variant="outline" size="sm" onClick={exportCSV}>
                            <Download size={14} className="mr-1" /> Export
                        </Button>
                    )}
                </div>
            </div>

            {/* Critical alerts banner */}
            {criticals.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-red-800 text-sm">Action Required</p>
                        <ul className="mt-1 space-y-0.5">
                            {criticals.map((a, i) => (
                                <li key={i} className="text-sm text-red-700 flex items-center gap-2">
                                    <span>{a.message}</span>
                                    <Link href={a.action} className="text-red-600 font-semibold hover:underline shrink-0">{a.actionLabel} →</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Active Bookings', value: loading ? '—' : String(kpis?.activeBookings ?? 0), icon: <Calendar size={18} />, iconBg: 'bg-blue-50 text-blue-600', delta: null },
                    { label: 'Total Hours', value: loading ? '—' : `${kpis?.totalHours ?? 0}h`, icon: <Clock size={18} />, iconBg: 'bg-indigo-50 text-indigo-600', delta: null },
                    { label: 'Pending Verifications', value: loading ? '—' : String(kpis?.pendingVerifications ?? 0), icon: <CheckCircle size={18} />, iconBg: 'bg-orange-50 text-orange-600', delta: null, urgent: (kpis?.pendingVerifications ?? 0) > 0 },
                    { label: 'Total Bookings', value: loading ? '—' : String(kpis?.totalBookings ?? 0), icon: <Briefcase size={18} />, iconBg: 'bg-purple-50 text-purple-600', delta: null },
                ].map((kpi, i) => (
                    <Card key={i} className={`shadow-sm border-gray-200 ${kpi.urgent ? 'border-orange-300 bg-orange-50/30' : ''}`}>
                        <CardContent className="pt-5 pb-4 px-5">
                            <div className={`h-9 w-9 ${kpi.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                                {kpi.icon}
                            </div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                            <p className={`text-2xl font-bold mt-0.5 ${loading ? 'text-gray-300 animate-pulse' : 'text-gray-900'}`}>{kpi.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Financial KPIs (Admin only) */}
            {data?.isAdmin && data.kpis && (data.kpis.totalRevenue !== null || data.kpis.totalSpend !== null) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {data.kpis.totalRevenue !== null && (
                        <Card className="shadow-sm border-emerald-200 bg-emerald-50/40">
                            <CardContent className="pt-5 pb-4 px-5">
                                <div className="h-9 w-9 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center mb-3">
                                    <TrendingUp size={18} />
                                </div>
                                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Revenue Earned</p>
                                <p className="text-2xl font-bold text-emerald-900 mt-0.5">{fmtFull(data.kpis.totalRevenue)}</p>
                                <p className="text-xs text-emerald-600 mt-1">as Lender · {weeks}W</p>
                            </CardContent>
                        </Card>
                    )}
                    {data.kpis.totalSpend !== null && (
                        <Card className="shadow-sm border-rose-200 bg-rose-50/40">
                            <CardContent className="pt-5 pb-4 px-5">
                                <div className="h-9 w-9 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center mb-3">
                                    <DollarSign size={18} />
                                </div>
                                <p className="text-xs font-medium text-rose-700 uppercase tracking-wide">Total Spend</p>
                                <p className="text-2xl font-bold text-rose-900 mt-0.5">{fmtFull(data.kpis.totalSpend)}</p>
                                <p className="text-xs text-rose-600 mt-1">as Borrower · {weeks}W</p>
                            </CardContent>
                        </Card>
                    )}
                    {data.kpis.totalServiceFees !== null && data.kpis.totalServiceFees > 0 && (
                        <Card className="shadow-sm border-gray-200">
                            <CardContent className="pt-5 pb-4 px-5">
                                <div className="h-9 w-9 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center mb-3">
                                    <BarChart3 size={18} />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Platform Fees Paid</p>
                                <p className="text-2xl font-bold text-gray-900 mt-0.5">{fmtFull(data.kpis.totalServiceFees)}</p>
                                <p className="text-xs text-gray-400 mt-1">Service fees · {weeks}W</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart + Top Workers (left 2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bar Chart */}
                    <Card className="shadow-sm border-gray-200">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Weekly Trends ({weeks} weeks)</h3>
                            <div className="flex gap-1">
                                {(['revenue', 'spend', 'hours', 'bookings'] as ChartMetric[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMetric(m)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${metric === m ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <CardContent className="p-5 pt-6">
                            {loading ? (
                                <div className="h-36 flex items-center justify-center text-gray-400 text-sm">Loading chart data…</div>
                            ) : data?.chartData.length ? (
                                <BarChart data={data.chartData} metric={metric} color={chartColors[metric]} />
                            ) : (
                                <div className="h-36 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Bookings */}
                    <Card className="shadow-sm border-gray-200">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
                            <Link href="/dashboard/bookings" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-5 py-3">Worker</th>
                                        <th className="px-5 py-3">Project</th>
                                        <th className="px-5 py-3">Dates</th>
                                        <th className="px-5 py-3">Status</th>
                                        {data?.isAdmin && <th className="px-5 py-3 text-right">Amount</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <tr key={i}>
                                                <td colSpan={5} className="px-5 py-4">
                                                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (data?.recentBookings || []).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-gray-400">No bookings yet</td>
                                        </tr>
                                    ) : (
                                        (data?.recentBookings || []).map((b) => (
                                            <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                                                            {b.workerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-gray-900">{b.workerName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-500">{b.projectName || '—'}</td>
                                                <td className="px-5 py-3.5 text-gray-500 text-xs">
                                                    {new Date(b.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    {b.endDate && ` → ${new Date(b.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[b.status] || 'bg-gray-100 text-gray-600'}`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                {data?.isAdmin && (
                                                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">{fmtFull(b.totalAmount)}</td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Right sidebar (1/3) */}
                <div className="space-y-6">
                    {/* Alerts Panel */}
                    <Card className="shadow-sm border-gray-200">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                Alerts
                                {alerts.length > 0 && (
                                    <Badge variant="destructive" className="text-xs px-1.5 h-5">{alerts.length}</Badge>
                                )}
                            </h3>
                        </div>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-5 text-gray-400 text-sm">Loading…</div>
                            ) : alerts.length === 0 ? (
                                <div className="p-5 flex items-center gap-3 text-gray-500 text-sm">
                                    <CheckCircle size={18} className="text-green-500" />
                                    All clear — no alerts
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                                    {alerts.map((a, i) => (
                                        <div key={i} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                                            <AlertBadge type={a.type} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 leading-snug">{a.message}</p>
                                                <Link href={a.action} className="text-xs text-blue-600 hover:underline font-medium mt-0.5 inline-flex items-center gap-1">
                                                    {a.actionLabel} <ChevronRight size={10} />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Workers */}
                    <Card className="shadow-sm border-gray-200">
                        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                            <Users size={16} className="text-gray-400" />
                            <h3 className="font-semibold text-gray-900">Top Workers by Hours</h3>
                        </div>
                        <CardContent className="p-4 space-y-3">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                                ))
                            ) : (data?.topWorkers || []).length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No time entries yet</p>
                            ) : (
                                (data?.topWorkers || []).map((w, i) => {
                                    const maxH = data!.topWorkers[0]?.hours || 1;
                                    return (
                                        <div key={i}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                                                        {w.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-800 truncate">{w.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-900 shrink-0 ml-2">{w.hours.toFixed(1)}h</span>
                                            </div>
                                            <MiniBar value={w.hours} max={maxH} color="bg-indigo-400" />
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-3 text-sm">Quick Actions</h3>
                        <div className="space-y-2">
                            {[
                                { href: '/dashboard/marketplace', label: 'Search Workers', color: 'bg-blue-900 hover:bg-blue-800 text-white' },
                                { href: '/dashboard/timesheets', label: 'Review Timesheets', color: 'bg-orange-600 hover:bg-orange-700 text-white' },
                                { href: '/dashboard/financials', label: 'View Financials', color: 'bg-gray-100 hover:bg-gray-200 text-gray-800' },
                            ].map(a => (
                                <Link key={a.href} href={a.href}>
                                    <Button className={`w-full justify-start h-9 text-sm font-medium ${a.color} mb-1`}>
                                        {a.label}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
