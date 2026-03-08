"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserMinus, UserCheck, ShieldAlert, Shield, EyeOff, Eye, UserSquare } from "lucide-react";
import { useSWRConfig } from "swr";

export function UserManagement() {
    const { data, isLoading } = useSWR("/api/admin/users", fetcher);
    const { mutate } = useSWRConfig();
    const [updating, setUpdating] = useState<string | null>(null);

    const users = data?.users || [];

    const handleBanToggle = async (userId: string, currentBanStatus: boolean) => {
        setUpdating(userId);
        const reason = currentBanStatus ? null : prompt("Reason for banning this user?");
        if (!currentBanStatus && reason === null) {
            setUpdating(null);
            return; // Cancelled
        }

        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "ban",
                    userId,
                    value: { isBanned: !currentBanStatus, reason }
                })
            });
            if (res.ok) {
                mutate("/api/admin/users");
                mutate("/api/admin/stats");
            }
        } finally {
            setUpdating(null);
        }
    };

    const handleShadowBanToggle = async (userId: string, currentStatus: boolean) => {
        setUpdating(userId);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "shadow_ban",
                    userId,
                    value: { isShadowBanned: !currentStatus }
                })
            });
            if (res.ok) mutate("/api/admin/users");
        } finally {
            setUpdating(null);
        }
    };

    const handleStrikeUpdate = async (userId: string, currentStrikes: number, change: number) => {
        const newStrikes = Math.max(0, currentStrikes + change);
        setUpdating(userId);

        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "strike",
                    userId,
                    value: newStrikes
                })
            });
            if (res.ok) {
                mutate("/api/admin/users");
            }
        } finally {
            setUpdating(null);
        }
    };

    const handleImpersonate = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to enter God Mode as ${userName || "this user"}?\n\nThis will log you out of your Admin session and log you in as them in READ-ONLY mode.`)) {
            return;
        }

        setUpdating(userId);
        try {
            // 1. Ask API to generate a magic link for target user
            const res = await fetch("/api/admin/impersonate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: userId }),
            });

            if (!res.ok) throw new Error("Failed to generate impersonation link");
            const data = await res.json();

            // 2. Set Read-Only cookie instructing middleware to block writes
            document.cookie = `sb-impersonation-mode=true; path=/; max-age=1800; samesite=lax`;
            document.cookie = `sb-impersonation-target=${encodeURIComponent(data.targetName)}; path=/; max-age=1800; samesite=lax`;

            // 3. Hard redirect to the action link which logs them in
            window.location.href = data.actionLink;

        } catch (e: any) {
            console.error(e);
            alert("Impersonation failed: " + e.message);
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
                <h2 className="font-bold text-gray-900 text-lg">Platform Users</h2>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">{users.length} Total</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Company</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-center">Strikes</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {users.map((u: any) => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-900">{u.full_name || "—"}</p>
                                    <p className="text-xs text-gray-500">{u.email}</p>
                                </td>
                                <td className="px-6 py-4">
                                    {u.company_members?.[0]?.company?.name ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                            {u.company_members[0].company.name}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {u.is_banned ? (
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                Banned
                                            </span>
                                            {u.banned_reason && <span className="text-[10px] text-red-500 max-w-[150px] truncate" title={u.banned_reason}>{u.banned_reason}</span>}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                Active
                                            </span>
                                            {u.is_shadow_banned && (
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
                                            disabled={updating === u.id || u.strikes === 0}
                                            onClick={() => handleStrikeUpdate(u.id, u.strikes, -1)}
                                        >-</Button>
                                        <span className={`font-bold w-4 text-center ${u.strikes > 0 ? "text-orange-600" : "text-gray-900"}`}>{u.strikes || 0}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 rounded-full"
                                            disabled={updating === u.id}
                                            onClick={() => handleStrikeUpdate(u.id, u.strikes, 1)}
                                        >+</Button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            disabled={updating === u.id}
                                            onClick={() => handleImpersonate(u.id, u.full_name)}
                                            title="View platform as this user"
                                        >
                                            {updating === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserSquare className="h-4 w-4 mr-1.5" /> View As</>}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={u.is_shadow_banned ? "text-gray-600 hover:text-gray-700 hover:bg-gray-100" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}
                                            disabled={updating === u.id}
                                            onClick={() => handleShadowBanToggle(u.id, u.is_shadow_banned)}
                                            title={u.is_shadow_banned ? "Remove Shadow Ban" : "Shadow Ban (Invisible to others)"}
                                        >
                                            {updating === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                                u.is_shadow_banned ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />
                                            }
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={u.is_banned ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-red-600 hover:text-red-700 hover:bg-red-50"}
                                            disabled={updating === u.id}
                                            onClick={() => handleBanToggle(u.id, u.is_banned)}
                                        >
                                            {updating === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                                u.is_banned ? <><UserCheck className="h-4 w-4 mr-1.5" /> Unban</> :
                                                    <><UserMinus className="h-4 w-4 mr-1.5" /> Ban</>
                                            }
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
