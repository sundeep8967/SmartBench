"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Search,
    Users,
    Briefcase,
    MapPin,
    PenSquare,
    LayoutGrid,
    List,
    Mail,
    BadgeCheck,
    Loader2
} from "lucide-react";
import { InviteWorkerDialog } from "@/components/workers/invite-dialog";
import { ListWorkerDialog } from "@/components/workers/list-worker-dialog";
import { useSWRConfig } from "swr";

interface RosterMember {
    id: string;
    user_id: string;
    name: string;
    email: string;
    roles: string[];
    status: string;
    deployment_status: "Deployed" | "Bench" | "Listed";
    trade: string | null;
    skills: string[];
    photo_url: string | null;
    hourly_rate: number | null;
}

interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
}

interface Metrics {
    totalWorkers: number;
    deployed: number;
    bench: number;
}

export default function RosterPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [view, setView] = useState<"card" | "table">("table");

    const { data, isLoading: loading } = useSWR('/api/workers/roster', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 30000,
    });
    const { mutate } = useSWRConfig();

    const roster: RosterMember[] = data?.roster || [];
    const invitations: Invitation[] = data?.invitations || [];
    const metrics: Metrics = data?.metrics || { totalWorkers: 0, deployed: 0, bench: 0 };
    const companySettings = data?.companySettings || { minimum_shift_length_hours: 8 };

    const handleListSuccess = () => {
        mutate("/api/workers/roster");
    };

    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    // Client-side filtering
    const filteredRoster = roster.filter(worker => {
        const matchesSearch = !searchTerm ||
            worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (worker.trade || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "All" ||
            worker.deployment_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-500">Loading roster...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                <p className="text-gray-500 mt-1">Manage your workforce availability and marketplace listings.</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                <Card className="p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Workers</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalWorkers}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Users size={20} />
                    </div>
                </Card>
                <Card className="p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-500">Deployed (Working)</p>
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.deployed}</p>
                    </div>
                    <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                        <Briefcase size={20} />
                    </div>
                </Card>
                <Card className="p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-500">On Bench (Idle)</p>
                            <div className="h-2 w-2 bg-orange-400 rounded-full"></div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.bench}</p>
                    </div>
                    <div className="h-10 w-10 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                        <MapPin size={20} />
                    </div>
                </Card>
            </div>

            {/* Unified Filter Bar */}
            <div className="flex flex-wrap items-stretch bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Search */}
                <div className="flex items-center flex-1 min-w-[200px] px-3">
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" size={16} />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                    />
                </div>

                {/* Divider */}
                <div className="w-px bg-gray-200 self-stretch" />

                {/* Status Filter */}
                <div className="flex items-center">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-full px-4 py-2.5 text-sm text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '2rem' }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Deployed">Deployed</option>
                        <option value="Bench">On Bench</option>
                    </select>
                </div>

                {/* Divider */}
                <div className="w-px bg-gray-200 self-stretch" />

                {/* View Toggle */}
                <div className="flex items-center">
                    <button
                        onClick={() => setView("card")}
                        className={`p-2.5 transition-colors ${view === "card" ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`}
                        title="Card view"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <div className="w-px bg-gray-200 self-stretch" />
                    <button
                        onClick={() => setView("table")}
                        className={`p-2.5 transition-colors ${view === "table" ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`}
                        title="Table view"
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px bg-gray-200 self-stretch" />

                {/* Invite Button */}
                <div className="flex items-center px-2">
                    <InviteWorkerDialog />
                </div>
            </div>

            {view === "card" ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {filteredRoster.map((worker) => (
                        <Card key={worker.id} className="p-[25px] border border-gray-200 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                    {worker.photo_url ? (
                                        <img src={worker.photo_url} alt={worker.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="font-bold text-gray-500 text-sm">{getInitials(worker.name)}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-lg text-gray-900 truncate">{worker.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{worker.email}</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-gray-500">Trade</span>
                                    <span className="font-medium text-gray-900">{worker.trade || "—"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Rate</span>
                                    <span className="font-medium text-gray-900">{worker.hourly_rate ? `$${Number(worker.hourly_rate).toFixed(2)}/hr` : "—"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Role</span>
                                    <span className="text-gray-600">{Array.isArray(worker.roles) ? worker.roles.join(", ") : "—"}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t mt-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${worker.deployment_status === "Deployed"
                                        ? "bg-green-50 text-green-600 border border-green-100"
                                        : worker.deployment_status === "Listed"
                                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                                            : "bg-orange-50 text-orange-500 border border-orange-100"
                                        }`}>{worker.deployment_status}</span>
                                    <div className="flex items-center space-x-2">
                                        {worker.deployment_status === "Bench" && (
                                            <ListWorkerDialog
                                                workerId={worker.user_id}
                                                workerName={worker.name}
                                                trade={worker.trade}
                                                rate={worker.hourly_rate}
                                                defaultMinShiftLength={companySettings.minimum_shift_length_hours}
                                                onListSuccess={handleListSuccess}
                                            />
                                        )}
                                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-600 h-8 w-8 p-0">
                                            <PenSquare size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {filteredRoster.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                            <p className="text-muted-foreground">{roster.length === 0 ? "No employees added yet." : "No workers match your search."}</p>
                        </div>
                    )}
                </div>
            ) : (
                <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white border-b border-gray-100 divide-x divide-gray-100 text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 w-1/4">Worker</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Lending Rate</th>
                                    <th className="px-6 py-4 text-center">Trade</th>
                                    <th className="px-6 py-4 text-center">Role</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredRoster.map((worker) => (
                                    <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                                    {worker.photo_url ? (
                                                        <img src={worker.photo_url} alt={worker.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-gray-500 text-xs">{getInitials(worker.name)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{worker.name}</p>
                                                    <p className="text-xs text-gray-500">{worker.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${worker.deployment_status === "Deployed"
                                                ? "bg-green-50 text-green-600 border border-green-100"
                                                : "bg-orange-50 text-orange-500 border border-orange-100"
                                                }`}>
                                                {worker.deployment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-900">
                                            {worker.hourly_rate ? `$${Number(worker.hourly_rate).toFixed(2)}/hr` : "—"}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {worker.trade ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{worker.trade}</span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs text-gray-500">
                                                {Array.isArray(worker.roles) ? worker.roles.join(", ") : "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {worker.deployment_status === "Bench" && (
                                                    <ListWorkerDialog
                                                        workerId={worker.user_id}
                                                        workerName={worker.name}
                                                        trade={worker.trade}
                                                        rate={worker.hourly_rate}
                                                        defaultMinShiftLength={companySettings.minimum_shift_length_hours}
                                                        onListSuccess={handleListSuccess}
                                                    />
                                                )}
                                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-600">
                                                    <PenSquare size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRoster.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            {roster.length === 0 ? "No employees added yet. Invite workers to get started." : "No workers match your search."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pending Invitations */}
                    {invitations.length > 0 && (
                        <div className="border-t border-gray-200">
                            <div className="px-6 py-3 bg-gray-50">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Pending Invitations ({invitations.length})</p>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {invitations.map((inv) => (
                                    <div key={inv.id} className="px-6 py-3 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                <Mail size={14} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-700">{inv.email}</p>
                                                <p className="text-xs text-gray-400">{inv.role} · Pending</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100 font-medium">Pending</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-gray-100 p-4 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing {filteredRoster.length} of {roster.length} workers
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}
