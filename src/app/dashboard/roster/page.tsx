"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock roster data
const rosterWorkers = [
    {
        id: 1,
        name: "Mike Ross",
        role: "Electrician",
        avatar: "MR",
        status: "Deployed",
        lendingRate: "$55.00/hr",
        compliance: true,
        marketplaceListing: true,
    },
    {
        id: 2,
        name: "Rachel Zane",
        role: "Planner",
        avatar: "RZ",
        status: "Bench",
        lendingRate: "$60.00/hr",
        compliance: true,
        marketplaceListing: true,
    },
    {
        id: 3,
        name: "Harvey Specter",
        role: "Foreman",
        avatar: "HS",
        status: "Deployed",
        lendingRate: "$75.00/hr",
        compliance: true,
        marketplaceListing: true,
    },
    {
        id: 4,
        name: "Donna Paulsen",
        role: "General Labor",
        avatar: "DP",
        status: "Leave",
        lendingRate: "$35.00/hr",
        compliance: false,
        marketplaceListing: false,
    },
    {
        id: 5,
        name: "Louis Litt",
        role: "HVAC Tech",
        avatar: "LL",
        status: "Bench",
        lendingRate: "$65.00/hr",
        compliance: true,
        marketplaceListing: true,
    },
];

const statusColors: Record<string, string> = {
    Deployed: "bg-green-100 text-green-700",
    Bench: "bg-blue-100 text-blue-700",
    Leave: "bg-gray-100 text-gray-500",
};

export default function RosterPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const totalWorkers = rosterWorkers.length;
    const deployed = rosterWorkers.filter(w => w.status === "Deployed").length;
    const onBench = rosterWorkers.filter(w => w.status === "Bench").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 mb-1">
                        Dashboard → Roster Management
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Roster Management</h1>
                    <p className="text-gray-500">Manage your workforce availability and marketplace listings.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Workers</p>
                                <p className="text-3xl font-bold text-gray-900">{totalWorkers}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                <span className="text-2xl">👥</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Deployed (Working)</p>
                                <p className="text-3xl font-bold text-green-600">{deployed} ★</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                                <span className="text-2xl">🏗️</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">On Bench (Idle)</p>
                                <p className="text-3xl font-bold text-orange-500">{onBench} ★</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                                <span className="text-2xl">⏸️</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                        <input
                            type="text"
                            placeholder="Search workers..."
                            className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm">
                            <option>All Statuses</option>
                            <option>Deployed</option>
                            <option>Bench</option>
                            <option>Leave</option>
                        </select>
                    </div>
                    <Button>+ Invite Worker</Button>
                </div>
            </Card>

            {/* Workers Table */}
            <Card noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Worker
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lending Rate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Compliance
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Marketplace Listing
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {rosterWorkers.map((worker) => (
                                <tr key={worker.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                                {worker.avatar}
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">{worker.name}</p>
                                                <p className="text-xs text-gray-500">{worker.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[worker.status]}`}>
                                            {worker.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {worker.lendingRate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {worker.compliance ? (
                                            <span className="text-green-500">✓ ✓</span>
                                        ) : (
                                            <span className="text-red-500">✗</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${worker.marketplaceListing ? "bg-orange-500" : "bg-gray-200"
                                                }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${worker.marketplaceListing ? "translate-x-5" : "translate-x-0"
                                                    }`}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Button variant="ghost" size="sm">⋮</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Showing 1 to 5 of 12 results</p>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Previous</Button>
                        <Button variant="outline" size="sm">Next</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
