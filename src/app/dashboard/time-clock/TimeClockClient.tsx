"use client";

import { useState, useOptimistic, useEffect } from "react";
import { timeClockAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, LogOut, History, Clock, Play, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TimeEntry {
    id: string;
    clock_in: string;
    clock_out: string | null;
    break_start: string | null;
    total_break_minutes: number;
    status: string;
    project?: { name: string } | null;
}

interface Project {
    id: string;
    name: string;
}

export default function TimeClockClient({
    initialActiveShift,
    recentShifts,
    projects
}: {
    initialActiveShift: TimeEntry | null,
    recentShifts: TimeEntry[],
    projects: Project[]
}) {
    const { toast } = useToast();
    const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.id || "");
    const [elapsed, setElapsed] = useState(0);

    // OPTIMISTIC UI: This gives us instant 0ms visual updates before the server responds
    const [optimisticActiveShift, addOptimisticAction] = useOptimistic<
        TimeEntry | null,
        { action: string, projectId?: string }
    >(
        initialActiveShift,
        (state, { action, projectId }) => {
            if (action === "clock_in") {
                const pName = projects.find(p => p.id === projectId)?.name || "No Project";
                return {
                    id: "temp_optimistic_id",
                    clock_in: new Date().toISOString(),
                    clock_out: null,
                    break_start: null,
                    total_break_minutes: 0,
                    status: "Active",
                    project: { name: pName }
                };
            }
            if (action === "clock_out") return null;
            if (action === "start_break" && state) {
                return { ...state, break_start: new Date().toISOString() };
            }
            if (action === "end_break" && state) {
                return { ...state, break_start: null }; // We won't calculate minutes on the client optimistically
            }
            return state;
        }
    );

    // Live timer based on optimistic shift
    useEffect(() => {
        if (!optimisticActiveShift) { setElapsed(0); return; }
        const calcElapsed = () => {
            const start = new Date(optimisticActiveShift.clock_in).getTime();
            return Math.floor((Date.now() - start) / 1000);
        };
        setElapsed(calcElapsed());
        const interval = setInterval(() => setElapsed(calcElapsed()), 1000);
        return () => clearInterval(interval);
    }, [optimisticActiveShift]);

    const handleAction = async (action: "clock_in" | "clock_out" | "start_break" | "end_break") => {
        // 1. Instantly update UI without waiting for server response
        addOptimisticAction({ action, projectId: selectedProject });

        try {
            // 2. Perform the server action in the background
            await timeClockAction(action, selectedProject, optimisticActiveShift?.id);
            toast({
                title: "Success",
                description: action === "clock_in" ? "Clocked in!" : action === "clock_out" ? "Clocked out!" : action === "start_break" ? "Break started." : "Break ended."
            });
        } catch (error: any) {
            // If the server fails, useOptimistic automatically rolls the UI back to initialActiveShift
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
        const s = (totalSeconds % 60).toString().padStart(2, "0");
        return `${h}:${m}:${s}`;
    };

    const formatDuration = (clockIn: string, clockOut: string, breakMin: number) => {
        const diffMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
        const totalMin = Math.round(diffMs / 60000) - (breakMin || 0);
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return `${h}h ${m.toString().padStart(2, "0")}m`;
    };

    const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const weeklyTotalMin = recentShifts.reduce((sum, s) => {
        if (!s.clock_out) return sum;
        const diffMs = new Date(s.clock_out).getTime() - new Date(s.clock_in).getTime();
        return sum + Math.round(diffMs / 60000) - (s.total_break_minutes || 0);
    }, 0);
    const weeklyH = Math.floor(weeklyTotalMin / 60);
    const weeklyM = weeklyTotalMin % 60;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Time Clock</h1>
                    <p className="text-gray-500">Track active shifts, breaks, and verify location status.</p>
                </div>
                <div className="flex items-center text-sm font-medium text-gray-600 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
                    <Clock size={16} className="mr-2 text-gray-400" />
                    {today}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 shadow-sm border-gray-200">
                    <CardContent className="p-8">
                        {optimisticActiveShift ? (
                            <>
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current Project</p>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {(optimisticActiveShift.project as any)?.name || "No Project"}
                                        </h2>
                                    </div>
                                    <div className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full flex items-center border border-green-100">
                                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                        {optimisticActiveShift.break_start ? "On Break" : "Clocked In"}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center py-10">
                                    <div className="text-7xl font-mono font-bold text-gray-900 tracking-wider">
                                        {formatTime(elapsed)}
                                    </div>
                                    <p className="text-gray-500 mt-4 font-medium">
                                        Shift Started: {new Date(optimisticActiveShift.clock_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    {optimisticActiveShift.break_start ? (
                                        <Button
                                            variant="outline"
                                            className="h-14 text-base font-medium border-gray-300 hover:bg-gray-50"
                                            onClick={() => handleAction("end_break")}
                                        >
                                            <Coffee size={20} className="mr-2 text-gray-500" />
                                            End Break
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="h-14 text-base font-medium border-gray-300 hover:bg-gray-50"
                                            onClick={() => handleAction("start_break")}
                                        >
                                            <Coffee size={20} className="mr-2 text-gray-500" />
                                            Start Break
                                        </Button>
                                    )}
                                    <Button
                                        className="h-14 text-base font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                        onClick={() => handleAction("clock_out")}
                                    >
                                        <LogOut size={20} className="mr-2" />
                                        Clock Out
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                                        <Clock size={36} className="text-gray-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Not Clocked In</h2>
                                    <p className="text-gray-500 mb-8">Select a project and clock in to start tracking time.</p>

                                    {projects.length > 0 && (
                                        <select
                                            value={selectedProject}
                                            onChange={(e) => setSelectedProject(e.target.value)}
                                            className="mb-6 px-4 py-2.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        >
                                            <option value="">No Project</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    )}

                                    <Button
                                        className="h-14 px-10 text-base font-medium bg-blue-900 hover:bg-blue-800 text-white shadow-sm transition-all active:scale-95"
                                        onClick={() => handleAction("clock_in")}
                                    >
                                        <Play size={20} className="mr-2" />
                                        Clock In
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-200 h-fit">
                    <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                        <CardTitle className="text-base font-bold text-gray-900 flex items-center">
                            <History size={18} className="mr-2 text-gray-400" />
                            This Week&apos;s Shifts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentShifts.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                No shifts this week yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {recentShifts.map((shift) => {
                                    const clockIn = new Date(shift.clock_in);
                                    const clockOut = shift.clock_out ? new Date(shift.clock_out) : null;
                                    const dayLabel = clockIn.toLocaleDateString("en-US", { weekday: "long" });
                                    const timeRange = `${clockIn.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${clockOut ? clockOut.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}`;
                                    const duration = clockOut ? formatDuration(shift.clock_in, shift.clock_out!, shift.total_break_minutes) : "—";

                                    return (
                                        <div key={shift.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-gray-900 text-sm">{dayLabel}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${shift.status === "Verified" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                                                    }`}>
                                                    {shift.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                                                <span>{timeRange}</span>
                                                <span className="font-bold text-gray-900">{duration}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Total Hours</span>
                                <span className="text-lg font-bold text-blue-900">{weeklyH}h {weeklyM.toString().padStart(2, "0")}m</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
