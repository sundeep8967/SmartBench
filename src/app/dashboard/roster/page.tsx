"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Search,
    Users,
    Briefcase,
    MapPin,
    ShieldCheck,
    PenSquare,
    UserPlus,
    ChevronDown,
    BadgeCheck
} from "lucide-react";
import { InviteWorkerDialog } from "@/components/workers/invite-dialog";

// Mock roster data matched to Roster.png columns
const roster = [
    {
        id: 1,
        name: "Mike Ross",
        role: "Electrician",
        status: "Deployed",
        rate: 55.00,
        isListed: true,
        avatarUrl: "/avatars/mike_ross.png",
        avatar: "MR"
    },
    {
        id: 2,
        name: "Rachel Zane",
        role: "Plumber",
        status: "Bench",
        rate: 60.00,
        isListed: false,
        avatarUrl: "/avatars/rachel_zane.png",
        avatar: "RZ"
    },
    {
        id: 3,
        name: "Harvey Specter",
        role: "Carpenter",
        status: "Deployed",
        rate: 50.00,
        isListed: true,
        avatarUrl: "/avatars/harvey_specter.png",
        avatar: "HS"
    },
    {
        id: 4,
        name: "Donna Paulsen",
        role: "General Labor",
        status: "Listed",
        rate: 35.00,
        isListed: true,
        avatarUrl: "/avatars/donna_paulsen.png",
        avatar: "DP"
    },
    {
        id: 5,
        name: "Louis Litt",
        role: "HVAC Tech",
        status: "Bench",
        rate: 65.00,
        isListed: false,
        avatarUrl: "/avatars/louis_litt.png",
        avatar: "LL"
    },
    {
        id: 6,
        name: "Jessica Pearson",
        role: "Architect",
        status: "Deployed",
        rate: 120.00,
        isListed: true,
        avatarUrl: "/avatars/jessica_p.png",
        avatar: "JP"
    }
];

export default function RosterPage() {
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
                        <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
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
                        <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
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
                        <p className="text-3xl font-bold text-gray-900 mt-2">4</p>
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
                            className="w-full md:w-64 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
                        />
                    </div>
                    <div className="border-l border-gray-300 bg-white">
                        <button className="flex items-center justify-between w-32 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            All Statuses <ChevronDown size={14} className="ml-2 text-gray-400" />
                        </button>
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
                                <th className="px-6 py-4 text-center">Compliance</th>
                                <th className="px-6 py-4 text-center">Marketplace Listing</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {roster.map((worker) => (
                                <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                                {worker.avatarUrl ? (
                                                    <img src={worker.avatarUrl} alt={worker.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="font-bold text-gray-500 text-xs">{worker.avatar}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{worker.name}</p>
                                                <p className="text-xs text-gray-500">{worker.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${worker.status === "Deployed" ? "bg-green-50 text-green-600 border border-green-100" :
                                            worker.status === "Bench" ? "bg-orange-50 text-orange-500 border border-orange-100" :
                                                "bg-blue-50 text-blue-600 border border-blue-100"
                                            }`}>
                                            {worker.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-900">
                                        ${worker.rate.toFixed(2)}/hr
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center space-x-2">
                                            <ShieldCheck size={18} className="text-green-500" />
                                            <div className="relative">
                                                <BadgeCheck size={18} className="text-green-500" />
                                                {/* Tiny red dot for variation if needed, but styling green for compliance */}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${worker.isListed ? "bg-orange-500" : "bg-gray-300"
                                                }`}>
                                                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${worker.isListed ? "translate-x-4" : "translate-x-0"
                                                    }`}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-600">
                                            <PenSquare size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-gray-100 p-4 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Showing 1 to 6 of 12 results</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs hidden" disabled>Previous</Button>
                        <Button variant="outline" size="sm" className="text-xs">Previous</Button>
                        <Button variant="outline" size="sm" className="text-xs">Next</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
