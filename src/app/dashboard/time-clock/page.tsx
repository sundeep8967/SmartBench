"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock shift data
const shifts = [
    { date: "Yesterday", dateLabel: "Nov 16, 2023", time: "08:00 AM - 04:30 PM", hours: "8h 30m", status: "Verified" },
    { date: "Wednesday", dateLabel: "Nov 14, 2023", time: "08:00 AM - 04:00 PM", hours: "8h 00m", status: "Verified" },
    { date: "Tuesday", dateLabel: "Nov 13, 2023", time: "08:00 AM - 04:00 PM", hours: "8h 00m", status: "Pending" },
];

export default function TimeClockPage() {
    const [seconds, setSeconds] = useState(15695); // 04:21:35 in seconds
    const [isClockedIn, setIsClockedIn] = useState(true);

    useEffect(() => {
        if (!isClockedIn) return;
        const interval = setInterval(() => {
            setSeconds((s) => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isClockedIn]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 mb-1">Dashboard → Time Clock</div>
                    <h1 className="text-2xl font-bold text-gray-900">Time Clock</h1>
                    <p className="text-gray-500">Track active shifts, breaks, and verify location status.</p>
                </div>
                <div className="text-sm text-gray-500">📅 Nov 16, 2023</div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Timer Card */}
                <Card className="lg:col-span-2">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Current Project</p>
                                    <p className="text-lg font-semibold text-gray-900">Lakeside Remodel</p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center">
                                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                    Clocked In
                                </span>
                            </div>

                            {/* Large Timer */}
                            <div className="py-8">
                                <p className="text-7xl font-bold text-orange-500 font-mono tracking-wider">
                                    {formatTime(seconds)}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">Shift Started: 07:00 AM</p>
                            </div>

                            {/* Location Verification */}
                            <div className="flex items-center justify-center mb-6">
                                <span className="text-green-500 mr-2">✓</span>
                                <span className="text-sm text-gray-600">Location Verified</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-4">
                                <Button variant="outline" className="flex-1 h-12">
                                    ☕ Start Break
                                </Button>
                                <Button variant="danger" className="flex-1 h-12">
                                    ← Clock Out
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Shifts Sidebar */}
                <Card>
                    <CardHeader>
                        <CardTitle>This Week's Shifts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {shifts.map((shift, index) => (
                                <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <p className="font-medium text-gray-900">{shift.date}</p>
                                            <p className="text-xs text-gray-500">{shift.dateLabel}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${shift.status === "Verified"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                            }`}>
                                            {shift.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{shift.time}</span>
                                        <span className="font-medium text-gray-900">{shift.hours}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">Total Hours</span>
                                <span className="text-xl font-bold text-blue-600">25h 30m</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
