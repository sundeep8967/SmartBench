"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock timesheet data
const timesheets = [
    {
        id: 1,
        worker: { name: "Mike Ross", role: "Electrician", location: "Lot 3", avatar: "MR" },
        date: "Oct 24, 2023",
        hours: "8.0 Hrs",
        gpsMatch: true,
        photoVerified: true,
        status: "pending",
    },
    {
        id: 2,
        worker: { name: "Rachel Zane", role: "Carpenter", location: "Lot 2", avatar: "RZ" },
        date: "Oct 25, 2023",
        hours: "8.5 Hrs",
        gpsMatch: true,
        photoVerified: true,
        status: "pending",
    },
    {
        id: 3,
        worker: { name: "Harvey Specter", role: "Site Manager", location: "", avatar: "HS" },
        date: "Oct 25, 2023",
        hours: "10.0 Hrs",
        gpsMatch: true,
        photoVerified: true,
        status: "pending",
    },
];

export default function TimesheetsPage() {
    const [activeTab, setActiveTab] = useState<"pending" | "disputed" | "history">("pending");

    const pendingCount = timesheets.filter(t => t.status === "pending").length;
    const disputedCount = 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 mb-1">Verification → Queue</div>
                    <h1 className="text-2xl font-bold text-gray-900">Timesheet Verification</h1>
                    <p className="text-gray-500">Review and approve hours submitted by workers for the current pay period.</p>
                </div>
                <Button variant="outline">⚙️ Auto-Approve Settings</Button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2">
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === "pending"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    onClick={() => setActiveTab("pending")}
                >
                    Pending <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">{pendingCount}</span>
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === "disputed"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    onClick={() => setActiveTab("disputed")}
                >
                    Disputed <span className="ml-1">{disputedCount}</span>
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === "history"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    onClick={() => setActiveTab("history")}
                >
                    History
                </button>
            </div>

            {/* Timesheet List */}
            <div className="space-y-4">
                {timesheets.map((timesheet) => (
                    <Card key={timesheet.id} className="p-4">
                        <div className="flex items-center justify-between">
                            {/* Worker Info */}
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                    {timesheet.worker.avatar}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{timesheet.worker.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {timesheet.worker.role}
                                        {timesheet.worker.location && ` • ${timesheet.worker.location}`}
                                    </p>
                                </div>
                            </div>

                            {/* Date & Hours */}
                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase">Date</p>
                                <p className="font-medium text-gray-900">{timesheet.date}</p>
                            </div>

                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase">Hours</p>
                                <p className="font-medium text-gray-900">{timesheet.hours}</p>
                            </div>

                            {/* Verification Badges */}
                            <div className="flex items-center space-x-2">
                                {timesheet.gpsMatch && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
                                        ✓ GPS Match
                                    </span>
                                )}
                                {timesheet.photoVerified && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
                                        ✓ Photo Verified
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">Dispute</Button>
                                <Button size="sm">Approve & Pay</Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
