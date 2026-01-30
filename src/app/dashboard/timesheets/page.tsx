"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Camera, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";

// Mock timesheet data
const timesheets = [
    {
        id: 1,
        worker: { name: "Mike Ross", role: "Electrician • Lvl 3", avatar: "MR" },
        date: "Oct 24, 2023",
        hours: "8.0 Hrs",
        gpsMatch: true,
        photoVerified: true,
        status: "pending",
    },
    {
        id: 2,
        worker: { name: "Rachel Zane", role: "Carpenter • Lvl 2", avatar: "RZ" },
        date: "Oct 25, 2023",
        hours: "9.5 Hrs",
        gpsMatch: false,
        photoVerified: true,
        status: "pending",
    },
    {
        id: 3,
        worker: { name: "Harvey Specter", role: "Site Manager", avatar: "HS" },
        date: "Oct 25, 2023",
        hours: "10.0 Hrs",
        gpsMatch: true,
        photoVerified: true,
        status: "pending",
    },
];

export default function TimesheetsPage() {
    const [activeTab, setActiveTab] = useState<"pending" | "disputed" | "history">("pending");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 mb-1">Verification → Queue</div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Timesheet Verification</h1>
                    <p className="text-gray-500">Review and approve hours submitted by workers for the current pay period.</p>
                </div>
                <Button variant="outline" className="text-gray-700 border-gray-300 shadow-sm">
                    ⚙️ Auto-Approve Settings
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-full w-fit">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${activeTab === "pending"
                            ? "bg-blue-900 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    Pending <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>3</span>
                </button>
                <button
                    onClick={() => setActiveTab("disputed")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${activeTab === "disputed"
                            ? "bg-blue-900 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    Disputed <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${activeTab === "disputed" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>1</span>
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${activeTab === "history"
                            ? "bg-blue-900 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    History
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {timesheets.map((item) => (
                    <Card key={item.id} className="p-0 shadow-sm border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-5 flex items-center justify-between">
                            {/* Worker */}
                            <div className="flex items-center space-x-4 min-w-[200px]">
                                <div className="h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                                    {item.worker.avatar}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">{item.worker.name}</h3>
                                    <p className="text-xs text-gray-500">{item.worker.role}</p>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="text-center min-w-[100px]">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Date</p>
                                <p className="text-sm font-semibold text-gray-900">{item.date}</p>
                            </div>

                            {/* Hours */}
                            <div className="text-center min-w-[80px]">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Hours</p>
                                <p className="text-sm font-semibold text-gray-900">{item.hours}</p>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center space-x-3 w-[300px]">
                                {item.gpsMatch ? (
                                    <span className="flex items-center px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                                        <MapPin size={12} className="mr-1.5" />
                                        GPS Match
                                    </span>
                                ) : (
                                    <span className="flex items-center px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full border border-yellow-100">
                                        <AlertTriangle size={12} className="mr-1.5" />
                                        Location Variance
                                    </span>
                                )}

                                {item.photoVerified && (
                                    <span className="flex items-center px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                                        <ShieldCheck size={12} className="mr-1.5" />
                                        Photo Verified
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-3">
                                <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50 h-9 font-medium">
                                    Dispute
                                </Button>
                                <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white shadow-sm h-9 px-6 font-medium">
                                    Approve & Pay
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
