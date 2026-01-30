"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    Search,
    Filter,
    MapPin,
    MoreHorizontal,
    Briefcase,
    Phone,
    Mail,
    ShieldCheck
} from "lucide-react";

// Mock roster data
const roster = [
    { id: 1, name: "Mike Ross", role: "Master Electrician", project: "Lakeside Remodel", status: "Deployed", phone: "(555) 123-4567", email: "mike@example.com", avatar: "MR" },
    { id: 2, name: "Rachel Zane", role: "Project Manager", project: "Downtown Loft", status: "Deployed", phone: "(555) 987-6543", email: "rachel@example.com", avatar: "RZ" },
    { id: 3, name: "Harvey Specter", role: "Site Foreman", project: "Pearson HQ", status: "Deployed", phone: "(555) 555-5555", email: "harvey@example.com", avatar: "HS" },
    { id: 4, name: "Jessica Pearson", role: "Architect", project: "-", status: "On Bench", phone: "(555) 000-0000", email: "jessica@example.com", avatar: "JP" },
    { id: 5, name: "Louis Litt", role: "HVAC Tech", project: "-", status: "On Bench", phone: "(555) 111-2222", email: "louis@example.com", avatar: "LL" },
];

export default function RosterPage() {
    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-l-4 border-l-blue-600 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Workers</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">12</p>
                        </div>
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <Users size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-green-500 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Deployed</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">8</p>
                        </div>
                        <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                            <Briefcase size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-gray-400 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">On Bench</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">4</p>
                        </div>
                        <div className="h-10 w-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">
                            <MapPin size={20} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Roster Table */}
            <Card className="shadow-sm border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-900">Your Team</h2>
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search workers..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="hidden md:flex">
                            <Filter size={16} className="mr-2" /> Filter
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Worker</th>
                                <th className="px-6 py-4">Project</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {roster.map((worker) => (
                                <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-9 w-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold border border-gray-200">
                                                {worker.avatar}
                                            </div>
                                            <div>
                                                <div className="flex items-center">
                                                    <p className="font-semibold text-gray-900 mr-1">{worker.name}</p>
                                                    <ShieldCheck size={14} className="text-green-500" />
                                                </div>
                                                <p className="text-xs text-gray-500">{worker.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {worker.status === "Deployed" ? (
                                            <span className="font-medium text-gray-900">{worker.project}</span>
                                        ) : (
                                            <span className="text-gray-400 italic">Not Assigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center text-gray-600">
                                                <Phone size={12} className="mr-1.5" />
                                                {worker.phone}
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <Mail size={12} className="mr-1.5" />
                                                {worker.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${worker.status === "Deployed"
                                            ? "bg-green-50 text-green-700 border-green-100"
                                            : "bg-gray-100 text-gray-700 border-gray-200"
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${worker.status === "Deployed" ? "bg-green-500" : "bg-gray-400"
                                                }`}></span>
                                            {worker.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreHorizontal size={16} className="text-gray-400" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
