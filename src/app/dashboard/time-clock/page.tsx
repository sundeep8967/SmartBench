"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Coffee, LogOut, History, Clock } from "lucide-react";

const shifts = [
    { date: "Yesterday", dateLabel: "Nov 16, 2023", time: "08:00 AM - 04:30 PM", hours: "8h 30m", status: "Verified" },
    { date: "Wednesday", dateLabel: "Nov 14, 2023", time: "08:00 AM - 04:00 PM", hours: "8h 00m", status: "Verified" },
    { date: "Tuesday", dateLabel: "Nov 13, 2023", time: "08:00 AM - 04:00 PM", hours: "8h 00m", status: "Pending" },
];

export default function TimeClockPage() {
    const [seconds, setSeconds] = useState(15695); // Example start

    useEffect(() => {
        const interval = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
        const s = (totalSeconds % 60).toString().padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 mb-1">Dashboard → Time Clock</div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Time Clock</h1>
                    <p className="text-gray-500">Track active shifts, breaks, and verify location status.</p>
                </div>
                <div className="flex items-center text-sm font-medium text-gray-600 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
                    <Clock size={16} className="mr-2 text-gray-400" />
                    Nov 17, 2023
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Timer Card */}
                <Card className="lg:col-span-2 shadow-sm border-gray-200">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Project</p>
                                <h2 className="text-xl font-bold text-gray-900">Lakeside Remodel</h2>
                            </div>
                            <div className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full flex items-center border border-green-100">
                                <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                Clocked In
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="text-7xl font-mono font-bold text-gray-900 tracking-wider">
                                {formatTime(seconds)}
                            </div>
                            <p className="text-gray-500 mt-4 font-medium">Shift Started: 07:00 AM</p>

                            <div className="mt-8 flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-full text-sm font-medium">
                                <MapPin size={16} />
                                <span>GPS Verified: On Site (Lot 3)</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <Button variant="outline" className="h-14 text-base font-medium border-gray-300 hover:bg-gray-50 hover:text-gray-900">
                                <Coffee size={20} className="mr-2 text-gray-500" />
                                Start Break
                            </Button>
                            <Button className="h-14 text-base font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm">
                                <LogOut size={20} className="mr-2" />
                                Clock Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar */}
                <Card className="shadow-sm border-gray-200 h-fit">
                    <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                        <CardTitle className="text-base font-bold text-gray-900 flex items-center">
                            <History size={18} className="mr-2 text-gray-400" />
                            This Week's Shifts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                            {shifts.map((shift, i) => (
                                <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-gray-900 text-sm">{shift.date}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${shift.status === "Verified" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                                            }`}>
                                            {shift.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                                        <span>{shift.time}</span>
                                        <span className="font-bold text-gray-900">{shift.hours}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Total Hours</span>
                                <span className="text-lg font-bold text-blue-900">25h 30m</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
