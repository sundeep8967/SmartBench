"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Scale, ExternalLink } from "lucide-react";
import Link from "next/link";

export function DisputeManagement() {
    const { data, isLoading } = useSWR("/api/admin/disputes", fetcher);
    const disputes = data?.disputes || [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <Card className="shadow-sm border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50/50">
                <div className="flex items-center gap-2 text-red-700">
                    <Scale size={20} />
                    <h2 className="font-bold text-lg">Active Disputes</h2>
                </div>
                <span className="text-xs text-red-600 font-bold bg-red-100 px-2 py-1 rounded-md border border-red-200">
                    {disputes.length} Requires Attention
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-6 py-3">Dispute ID</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Worker / Lender</th>
                            <th className="px-6 py-3">Borrower Company</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {disputes.map((d: any) => (
                            <tr key={d.timeEntryId} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-xs font-bold text-gray-900">
                                            {d.timeEntryId.slice(0, 8).toUpperCase()}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            Booking: {d.bookingId.slice(0, 8).toUpperCase()}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-medium text-gray-700">
                                        {new Date(d.shiftDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-900">{d.workerName}</p>
                                    <p className="text-xs text-gray-500">{d.lenderCompanyName}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-medium text-gray-900">{d.borrowerCompanyName}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/dashboard/admin/disputes/${d.timeEntryId}`}>
                                        <Button variant="outline" size="sm" className="bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors text-xs font-semibold h-8">
                                            <Scale className="h-3.5 w-3.5 mr-1.5" />
                                            Evidence View
                                        </Button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {disputes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-500">
                                    <Scale className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                                    <p>No active disputes to arbitrate.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
