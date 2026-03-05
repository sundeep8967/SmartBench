"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, ChevronLeft, ChevronRight, Loader2, Save, X } from "lucide-react";

type DayStatus = "available" | "blocked" | "unset";

function getMonthDays(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(new Date(year, month - 1, d));
    }
    return days;
}

const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

export default function WorkerAvailabilityCalendar({ workerId }: { workerId?: string }) {
    const { toast } = useToast();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date(); d.setDate(1);
        return d.toISOString().split("T")[0];
    });
    const [endDate, setEndDate] = useState<string>("");
    const [recallDays, setRecallDays] = useState(7);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selecting, setSelecting] = useState(false); // drag-select mode

    useEffect(() => {
        const loadAvailability = async () => {
            setLoading(true);
            try {
                const url = workerId
                    ? `/api/workers/availability?worker_id=${workerId}`
                    : `/api/workers/availability`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.availability && data.availability.length > 0) {
                    const avail = data.availability[0];
                    if (avail.start_date) setStartDate(avail.start_date);
                    if (avail.end_date) setEndDate(avail.end_date || "");
                    if (avail.blocked_dates) setBlockedDates(new Set(avail.blocked_dates));
                    if (avail.recall_notice_days) setRecallDays(avail.recall_notice_days);
                }
            } catch (_) { /* silent */ }
            setLoading(false);
        };
        loadAvailability();
    }, [workerId]);

    const handleDayClick = (date: Date) => {
        const key = date.toISOString().split("T")[0];
        if (date < new Date(today.toDateString())) return; // can't block past
        setBlockedDates(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const getDayStatus = (date: Date | null): DayStatus => {
        if (!date) return "unset";
        const key = date.toISOString().split("T")[0];
        if (blockedDates.has(key)) return "blocked";
        const withinRange = date >= new Date(startDate) && (!endDate || date <= new Date(endDate));
        return withinRange ? "available" : "unset";
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/workers/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    availability_mode: "available",
                    start_date: startDate,
                    end_date: endDate || null,
                    blocked_dates: Array.from(blockedDates),
                    recall_notice_days: recallDays,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save");
            }
            toast({ title: "Availability saved!", description: "Borrowers can now see your available dates." });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
        setSaving(false);
    };

    const handleClear = async () => {
        setSaving(true);
        try {
            await fetch("/api/workers/availability", { method: "DELETE" });
            setBlockedDates(new Set());
            toast({ title: "Availability cleared" });
        } catch (_) { /* silent */ }
        setSaving(false);
    };

    const prevMonth = () => {
        if (month === 1) { setYear(y => y - 1); setMonth(12); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 12) { setYear(y => y + 1); setMonth(1); }
        else setMonth(m => m + 1);
    };

    const days = getMonthDays(year, month);
    const blockedCount = blockedDates.size;

    return (
        <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-gray-900 flex items-center">
                        <Calendar size={18} className="mr-2 text-blue-900" />
                        Availability Calendar
                    </CardTitle>
                    <div className="flex gap-2">
                        {blockedCount > 0 && (
                            <Button variant="outline" size="sm" onClick={handleClear} disabled={saving} className="text-xs h-8">
                                <X size={13} className="mr-1" /> Clear All
                            </Button>
                        )}
                        <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white h-8 px-4" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 size={13} className="animate-spin mr-1" /> : <Save size={13} className="mr-1" />}
                            Save
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : (
                    <>
                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-500 font-medium">Available From</Label>
                                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-500 font-medium">Available Until (optional)</Label>
                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="h-9 text-sm" />
                            </div>
                        </div>

                        {/* Calendar Navigation */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                                    <ChevronLeft size={16} className="text-gray-600" />
                                </button>
                                <h3 className="font-bold text-gray-900 text-sm">{MONTHS[month - 1]} {year}</h3>
                                <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                                    <ChevronRight size={16} className="text-gray-600" />
                                </button>
                            </div>

                            {/* Day-of-week headers */}
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                    <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">{d}</div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {days.map((date, i) => {
                                    if (!date) return <div key={`empty-${i}`} />;
                                    const status = getDayStatus(date);
                                    const isPast = date < new Date(today.toDateString());
                                    const isToday = date.toDateString() === today.toDateString();

                                    return (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => !isPast && handleDayClick(date)}
                                            disabled={isPast}
                                            title={status === "blocked" ? "Blocked — click to unblock" : status === "available" ? "Available — click to block" : ""}
                                            className={`
                                                relative aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition-all
                                                ${isPast ? "opacity-30 cursor-not-allowed text-gray-400" : "cursor-pointer hover:scale-105"}
                                                ${isToday ? "ring-2 ring-blue-900" : ""}
                                                ${status === "blocked"
                                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                                    : status === "available"
                                                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                                                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                                }
                                            `}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend + Stats */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-50 border border-green-200" /> Available</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Blocked</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-50 border border-gray-200" /> Outside range</span>
                            </div>
                            {blockedCount > 0 && (
                                <span className="text-xs font-medium text-orange-600">{blockedCount} day{blockedCount > 1 ? "s" : ""} blocked</span>
                            )}
                        </div>

                        {/* Recall Notice */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500 font-medium">Recall Notice (days needed to withdraw)</Label>
                            <Input
                                type="number"
                                min={1}
                                max={30}
                                value={recallDays}
                                onChange={e => setRecallDays(Number(e.target.value))}
                                className="h-9 text-sm w-32"
                            />
                            <p className="text-xs text-gray-400">Worker requires {recallDays} day{recallDays > 1 ? "s" : ""} notice to cancel availability.</p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
