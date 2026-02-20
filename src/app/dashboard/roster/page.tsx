"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Search,
    Users,
    Briefcase,
    MapPin,
    ShieldCheck,
    PenSquare,
    ChevronDown,
    BadgeCheck,
    Loader2,
    Mail,
} from "lucide-react";
import { InviteWorkerDialog } from "@/components/workers/invite-dialog";

interface RosterMember {
    id: string;
    user_id: string;
    name: string;
    email: string;
    roles: string[];
    status: string;
    deployment_status: "Deployed" | "Bench";
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
    const [roster, setRoster] = useState<RosterMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [metrics, setMetrics] = useState<Metrics>({ totalWorkers: 0, deployed: 0, bench: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const fetchRoster = useCallback(async () => {
        try {
            const res = await fetch("/api/workers/roster");
            if (res.ok) {
                const data = await res.json();
                setRoster(data.roster || []);
                setInvitations(data.invitations || []);
                setMetrics(data.metrics || { totalWorkers: 0, deployed: 0, bench: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch roster", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoster();
    }, [fetchRoster]);

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
                <h1 className="text-2xl font-bold text-gray-900">Roster Management</h1>
                <p className="text-gray-500 mt-1">Manage your workforce availability and marketplace listings.</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex w-full md:w-auto overflow-hidden rounded-md border border-gray-300">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search workers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
                        />
                    </div>
                    <div className="border-l border-gray-300 bg-white">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-full px-3 py-2.5 text-sm text-gray-700 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Deployed">Deployed</option>
                            <option value="Bench">On Bench</option>
                        </select>
                    </div>
                </div>
                <InviteWorkerDialog />
            </div>

            {/* Roster Table */}
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
                                    <td className="px-6 py-4 text-center text-gray-600">
                                        {worker.trade || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs text-gray-500">
                                            {Array.isArray(worker.roles) ? worker.roles.join(", ") : "—"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-600">
                                            <PenSquare size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredRoster.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        {roster.length === 0 ? "No workers in your roster yet. Invite workers to get started." : "No workers match your search."}
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
        </div>
    );
}
