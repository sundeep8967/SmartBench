"use client";

import { useState, useOptimistic, useEffect, startTransition, useRef } from "react";
import { timeClockAction, manualTimeEntryAction } from "./actions";
import { savePendingAction, getPendingActions, clearPendingActions, removePendingAction } from "@/lib/offline-sync";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, LogOut, History, Clock, Play, Loader2, MapPin, MapPinOff, FileEdit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GpsCoords {
    lat: number;
    lng: number;
    accuracy: number;
}

async function captureGps(): Promise<GpsCoords | null> {
    if (!navigator.geolocation) return null;
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
            () => resolve(null),
            { timeout: 8000, enableHighAccuracy: true }
        );
    });
}

interface TimeEntry {
    id: string;
    clock_in: string;
    clock_out: string | null;
    break_start: string | null;
    total_break_minutes: number;
    travel_start: string | null;
    travel_duration_minutes: number;
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
    const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "denied">("idle");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Manual Entry State
    const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
    const [manualEntrySubmitting, setManualEntrySubmitting] = useState(false);
    const [manualDate, setManualDate] = useState("");
    const [manualStart, setManualStart] = useState("");
    const [manualEnd, setManualEnd] = useState("");
    const [manualNotes, setManualNotes] = useState("");

    // Draft Mode State
    const [isDraftModeOpen, setIsDraftModeOpen] = useState(false);
    const [draftClockIn, setDraftClockIn] = useState("");
    const [draftClockOut, setDraftClockOut] = useState("");
    const [draftBreakMins, setDraftBreakMins] = useState<number>(0);
    const [draftTravelMins, setDraftTravelMins] = useState<number>(0);
    const [draftSubmitting, setDraftSubmitting] = useState(false);

    // Offline Sync State
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const syncQueue = async () => {
            if (isSyncing) return;
            setIsSyncing(true);
            try {
                const actions = await getPendingActions();
                if (actions.length === 0) return;

                toast({ title: "Syncing", description: `Syncing ${actions.length} offline punches...` });

                let currentShiftId = initialActiveShift?.id;

                for (const item of actions) {
                    try {
                        // Attempt the action. If it's a clock_in, the server returns the new entry with an ID.
                        const res = await timeClockAction(
                            item.action as any,
                            item.projectId,
                            currentShiftId,
                            undefined, // GPS accuracy is lost in simple offline MVP, or we could add to pending actions
                            item.photoUrl,
                            item.draftData
                        );

                        // If we just clocked in, store the real server ID for subsequent queue items
                        if (res && res.id) {
                            currentShiftId = res.id;
                        }

                        await removePendingAction(item.id!);
                    } catch (e: any) {
                        console.error("Failed to sync action", item, e);
                        toast({ title: "Sync Error", description: `Failed to sync ${item.action}: ${e.message}`, variant: "destructive" });
                        // Depending on strategy, we can break or continue. MVP: continue.
                    }
                }

                if (actions.length > 0) {
                    toast({ title: "Sync Complete", description: "Your offline punches have been synced." });
                    // Give server actions a moment to revalidate
                }
            } finally {
                setIsSyncing(false);
            }
        };

        const handleOnline = () => {
            setIsOnline(true);
            syncQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check on mount
        if (navigator.onLine) {
            syncQueue();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [initialActiveShift, isSyncing, toast]);

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
                    travel_start: null,
                    total_break_minutes: 0,
                    travel_duration_minutes: 0,
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
            if (action === "start_travel" && state) {
                return { ...state, travel_start: new Date().toISOString() };
            }
            if (action === "end_travel" && state) {
                return { ...state, travel_start: null };
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

    const handleAction = async (
        action: "clock_in" | "clock_out" | "start_break" | "end_break" | "start_travel" | "end_travel",
        photoUrl?: string,
        draftData?: { clock_in?: string; clock_out?: string; total_break_minutes?: number, travel_duration_minutes?: number }
    ) => {
        // 1. Capture GPS for clock_in and clock_out (if online, or attempt if offline)
        let gps: GpsCoords | null = null;
        if (action === "clock_in" || action === "clock_out") {
            setGpsStatus("capturing");
            gps = await captureGps();
            setGpsStatus(gps ? "captured" : "denied");
        }

        // 2. Instantly update UI without waiting for server response
        startTransition(() => {
            addOptimisticAction({ action, projectId: selectedProject });
        });

        if (!isOnline) {
            // OFFLINE MODE: Save to local IndexedDB and return immediately 
            await savePendingAction({
                action,
                projectId: selectedProject,
                photoUrl: photoUrl || undefined,
                draftData
            });
            toast({
                title: "Saved Offline",
                description: "Your action was saved locally and will sync when you return online.",
            });
            setGpsStatus("idle");
            return;
        }

        try {
            // 3. Perform the server action in the background
            await timeClockAction(action, selectedProject, optimisticActiveShift?.id, gps, photoUrl, draftData);
            toast({
                title: "Success",
                description: action === "clock_in"
                    ? `Clocked in!${gps ? " 📍 Location captured." : " (no GPS)"}`
                    : action === "clock_out"
                        ? `Clocked out!${gps ? " 📍 Location captured." : " (no GPS)"}`
                        : action === "start_break" ? "Break started."
                            : action === "end_break" ? "Break ended."
                                : action === "start_travel" ? "Travel time started." : "Travel time ended."
            });
        } catch (error: any) {
            // If the server fails, useOptimistic automatically rolls the UI back to initialActiveShift
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setGpsStatus("idle");
        }
    };

    const handleManualEntrySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject || !manualDate || !manualStart || !manualEnd) {
            toast({ title: "Validation Error", description: "Please fill out all required fields.", variant: "destructive" });
            return;
        }

        setManualEntrySubmitting(true);
        try {
            await manualTimeEntryAction(selectedProject, manualDate, manualStart, manualEnd, manualNotes);
            toast({ title: "Success", description: "Manual timesheet submitted for review." });
            setIsManualEntryOpen(false);
            setManualDate("");
            setManualStart("");
            setManualEnd("");
            setManualNotes("");
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setManualEntrySubmitting(false);
        }
    };

    const openDraftMode = () => {
        if (!optimisticActiveShift) return;
        const now = new Date();
        setDraftClockOut(now.toTimeString().substring(0, 5));

        const start = new Date(optimisticActiveShift.clock_in);
        setDraftClockIn(start.toTimeString().substring(0, 5));

        let currentBreakMins = optimisticActiveShift.total_break_minutes || 0;
        if (optimisticActiveShift.break_start) {
            currentBreakMins += Math.round((Date.now() - new Date(optimisticActiveShift.break_start).getTime()) / 60000);
        }
        setDraftBreakMins(currentBreakMins);

        let currentTravelMins = optimisticActiveShift.travel_duration_minutes || 0;
        if (optimisticActiveShift.travel_start) {
            currentTravelMins += Math.round((Date.now() - new Date(optimisticActiveShift.travel_start).getTime()) / 60000);
        }
        setDraftTravelMins(currentTravelMins);

        setIsDraftModeOpen(true);
    };

    const handleDraftModeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!optimisticActiveShift) return;

        setDraftSubmitting(true);
        try {
            const baseDateStr = new Date(optimisticActiveShift.clock_in).toISOString().split('T')[0];
            const clockInIso = new Date(`${baseDateStr}T${draftClockIn}:00`).toISOString();
            let clockOutIso = new Date(`${baseDateStr}T${draftClockOut}:00`);

            if (clockOutIso < new Date(clockInIso)) {
                clockOutIso = new Date(clockOutIso.getTime() + 24 * 60 * 60 * 1000); // cross midnight
            }

            await handleAction("clock_out", undefined, {
                clock_in: clockInIso,
                clock_out: clockOutIso.toISOString(),
                total_break_minutes: draftBreakMins,
                travel_duration_minutes: draftTravelMins
            });
            setIsDraftModeOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setDraftSubmitting(false);
        }
    };

    const handleClockInClick = () => {
        if (!selectedProject) {
            toast({ title: "Project Required", description: "Please select a project before clocking in.", variant: "destructive" });
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPhoto(true);
        try {
            const supabase = createClient();
            const filename = `clockin_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const { data, error } = await supabase.storage
                .from('project_photos')
                .upload(filename, file);

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from('project_photos')
                .getPublicUrl(data.path);

            await handleAction("clock_in", publicUrlData.publicUrl);
        } catch (error: any) {
            toast({ title: "Photo Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setUploadingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
                <div className="flex items-center gap-3">
                    {gpsStatus === "capturing" && (
                        <span className="flex items-center text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                            <Loader2 size={12} className="mr-1.5 animate-spin" /> Getting location...
                        </span>
                    )}
                    {gpsStatus === "captured" && (
                        <span className="flex items-center text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                            <MapPin size={12} className="mr-1.5" /> GPS Captured
                        </span>
                    )}
                    {gpsStatus === "denied" && (
                        <span className="flex items-center text-xs text-yellow-600 font-medium bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                            <MapPinOff size={12} className="mr-1.5" /> No GPS
                        </span>
                    )}
                    {!isOnline && (
                        <span className="flex items-center text-xs text-red-600 font-bold bg-red-50 px-3 py-1.5 rounded-full border border-red-200 shadow-sm animate-pulse">
                            Offline Mode
                        </span>
                    )}
                    <div className="flex items-center text-sm font-medium text-gray-600 bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
                        <Clock size={16} className="mr-2 text-gray-400" />
                        {today}
                    </div>
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
                                        {optimisticActiveShift.break_start ? "On Break" : optimisticActiveShift.travel_start ? "Traveling" : "Clocked In"}
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

                                <div className="grid grid-cols-3 gap-4 mt-8">
                                    {optimisticActiveShift.travel_start ? (
                                        <Button
                                            variant="outline"
                                            className="h-14 text-base font-medium border-gray-300 hover:bg-gray-50 flex flex-col justify-center items-center py-2 relative"
                                            onClick={() => handleAction("end_travel")}
                                            disabled={!!optimisticActiveShift.break_start}
                                        >
                                            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            <div className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-blue-500" /> End Travel</div>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="h-14 text-base font-medium border-gray-300 hover:bg-gray-50"
                                            onClick={() => handleAction("start_travel")}
                                            disabled={!!optimisticActiveShift.break_start}
                                        >
                                            <MapPin className="h-4 w-4 mr-2 text-gray-500" /> Start Travel
                                        </Button>
                                    )}

                                    {optimisticActiveShift.break_start ? (
                                        <Button
                                            variant="outline"
                                            className="h-14 text-base font-medium border-gray-300 hover:bg-gray-50 flex flex-col justify-center items-center py-2 relative"
                                            onClick={() => handleAction("end_break")}
                                            disabled={!!optimisticActiveShift.travel_start}
                                        >
                                            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                            <div className="flex items-center"><Coffee className="h-4 w-4 mr-1 text-orange-500" /> End Break</div>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="h-14 text-base font-medium border-gray-300 hover:bg-gray-50"
                                            onClick={() => handleAction("start_break")}
                                            disabled={!!optimisticActiveShift.travel_start}
                                        >
                                            <Coffee className="h-4 w-4 mr-2 text-gray-500" /> Start Break
                                        </Button>
                                    )}

                                    <Button
                                        className="h-14 text-base font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                        onClick={openDraftMode}
                                    >
                                        <LogOut className="h-4 w-4 mr-2" /> Clock Out
                                    </Button>
                                </div>

                                <Dialog open={isDraftModeOpen} onOpenChange={setIsDraftModeOpen}>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Review Timesheet (Draft Mode)</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleDraftModeSubmit} className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Clock In</Label>
                                                    <Input type="time" required value={draftClockIn} onChange={(e) => setDraftClockIn(e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Clock Out</Label>
                                                    <Input type="time" required value={draftClockOut} onChange={(e) => setDraftClockOut(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Total Break Time (Minutes)</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={draftBreakMins}
                                                        onChange={(e) => setDraftBreakMins(parseInt(e.target.value) || 0)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Total Travel Time (Minutes)</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={draftTravelMins}
                                                        onChange={(e) => setDraftTravelMins(parseInt(e.target.value) || 0)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter className="pt-4">
                                                <Button type="button" variant="outline" onClick={() => setIsDraftModeOpen(false)}>Cancel</Button>
                                                <Button type="submit" disabled={draftSubmitting} className="bg-red-600 text-white hover:bg-red-700">
                                                    {draftSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <LogOut size={16} className="mr-2" />}
                                                    Confirm & Clock Out
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
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
                                        onClick={handleClockInClick}
                                        disabled={uploadingPhoto}
                                    >
                                        {uploadingPhoto ? (
                                            <>
                                                <Loader2 size={20} className="mr-2 animate-spin" />
                                                Uploading Photo...
                                            </>
                                        ) : (
                                            <>
                                                <Play size={20} className="mr-2" />
                                                Take Photo & Clock In
                                            </>
                                        )}
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    <div className="mt-8 pt-6 border-t border-gray-100 w-full text-center">
                                        <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="link" className="text-gray-500 hover:text-blue-600 font-medium">
                                                    <FileEdit size={16} className="mr-2" />
                                                    Forgot to clock in? Submit a manual timesheet
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>Submit Manual Timesheet</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleManualEntrySubmit} className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Project / Role</Label>
                                                        <select
                                                            value={selectedProject}
                                                            onChange={(e) => setSelectedProject(e.target.value)}
                                                            className="w-full px-3 py-2 border border-input rounded-md text-sm"
                                                            required
                                                        >
                                                            <option value="" disabled>Select a project</option>
                                                            {projects.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Shift Date</Label>
                                                        <Input type="date" required value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Start Time</Label>
                                                            <Input type="time" required value={manualStart} onChange={(e) => setManualStart(e.target.value)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>End Time</Label>
                                                            <Input type="time" required value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Notes / Reason</Label>
                                                        <Input
                                                            placeholder="e.g. Forgot to clock in, phone died"
                                                            value={manualNotes}
                                                            onChange={(e) => setManualNotes(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <DialogFooter className="pt-4">
                                                        <Button type="button" variant="outline" onClick={() => setIsManualEntryOpen(false)}>Cancel</Button>
                                                        <Button type="submit" disabled={manualEntrySubmitting} className="bg-blue-900 text-white hover:bg-blue-800">
                                                            {manualEntrySubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                                                            Submit Timesheet
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
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
