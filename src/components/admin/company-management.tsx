"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Shield, ShieldOff, Eye, EyeOff } from "lucide-react";
import { useSWRConfig } from "swr";

export function CompanyManagement() {
    const { data, isLoading } = useSWR("/api/admin/companies", fetcher);
    const { mutate } = useSWRConfig();
    const [updating, setUpdating] = useState<string | null>(null);

    const companies = data?.companies || [];

    const handleBanToggle = async (companyId: string, currentBanStatus: boolean) => {
        setUpdating(companyId);
        const reason = currentBanStatus ? null : prompt("Reason for banning this company and ALL its users?");
        if (!currentBanStatus && reason === null) {
            setUpdating(null);
            return; // Cancelled
        }

        try {
            const res = await fetch("/api/admin/companies", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "ban",
                    companyId,
                    value: { isBanned: !currentBanStatus, reason }
                })
            });
            if (res.ok) {
                mutate("/api/admin/companies");
                mutate("/api/admin/stats");
            }
        } finally {
            setUpdating(null);
        }
    };

    const handleShadowBanToggle = async (companyId: string, currentStatus: boolean) => {
        setUpdating(companyId);
        try {
            const res = await fetch("/api/admin/companies", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "shadow_ban",
                    companyId,
                    value: { isShadowBanned: !currentStatus }
                })
            });
            if (res.ok) mutate("/api/admin/companies");
        } finally {
            setUpdating(null);
        }
    };

    const handleStrikeUpdate = async (companyId: string, currentStrikes: number, change: number) => {
        const newStrikes = Math.max(0, currentStrikes + change);
        setUpdating(companyId);

        try {
            const res = await fetch("/api/admin/companies", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "strike",
                    companyId,
                    value: newStrikes
                })
            });
            if (res.ok) {
                mutate("/api/admin/companies");
            }
        } finally {
            setUpdating(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <Card className="shadow-sm border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-gray-900 text-lg">Companies</h2>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">{companies.length} Total</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Company</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-center">Strikes</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {companies.map((c: any) => (
                            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-900">{c.name}</p>
                                    <p className="text-xs text-gray-500">Phone: {c.phone || "—"} | EIN: {c.ein || "—"}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.type === "Lender" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>
                                        {c.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {c.is_banned ? (
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                Banned
                                            </span>
                                            {c.banned_reason && <span className="text-[10px] text-red-500 max-w-[150px] truncate" title={c.banned_reason}>{c.banned_reason}</span>}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                Active
                                            </span>
                                            {c.is_shadow_banned && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                                    <EyeOff size={10} /> Shadow Banned
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 rounded-full"
                                            disabled={updating === c.id || c.strikes === 0}
                                            onClick={() => handleStrikeUpdate(c.id, c.strikes, -1)}
                                        >-</Button>
                                        <span className={`font-bold w-4 text-center ${c.strikes > 0 ? "text-orange-600" : "text-gray-900"}`}>{c.strikes || 0}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 rounded-full"
                                            disabled={updating === c.id}
                                            onClick={() => handleStrikeUpdate(c.id, c.strikes, 1)}
                                        >+</Button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={c.is_shadow_banned ? "text-gray-600 hover:text-gray-700 hover:bg-gray-100" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}
                                            disabled={updating === c.id}
                                            onClick={() => handleShadowBanToggle(c.id, c.is_shadow_banned)}
                                            title={c.is_shadow_banned ? "Remove Shadow Ban" : "Shadow Ban (Invisible to others)"}
                                        >
                                            {updating === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                                c.is_shadow_banned ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />
                                            }
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={c.is_banned ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-red-600 hover:text-red-700 hover:bg-red-50"}
                                            disabled={updating === c.id}
                                            onClick={() => handleBanToggle(c.id, c.is_banned)}
                                        >
                                            {updating === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                                c.is_banned ? <><Shield className="h-4 w-4 mr-1.5" /> Unban</> :
                                                    <><ShieldOff className="h-4 w-4 mr-1.5" /> Ban</>
                                            }
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {companies.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">No companies found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
