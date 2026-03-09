"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, FilePlus, XCircle, Play, LogOut, CheckCircle2, DollarSign, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const iconMap: Record<string, any> = {
    FilePlus, XCircle, Play, LogOut, CheckCircle2, DollarSign, Star
};

export function BookingTimeline() {
    const { toast } = useToast();
    const [bookingId, setBookingId] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingId.trim()) return;

        setLoading(true);
        setData(null);

        try {
            const res = await fetch(`/api/admin/bookings/${bookingId}/timeline`);
            const json = await res.json();

            if (!res.ok) throw new Error(json.error || "Failed to fetch timeline");
            setData(json);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Timeline Visualizer</h2>
            <p className="text-gray-500 text-sm max-w-2xl">
                Enter a Booking ID to view a complete audit log of its lifecycle, including creation, time entries, verifications, payouts, and reviews.
            </p>

            <form onSubmit={handleSearch} className="flex gap-3 max-w-md">
                <Input
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" disabled={loading || !bookingId} className="bg-gray-900 hover:bg-gray-800 text-white">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </Button>
            </form>

            {data && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Booking Overview</p>
                            <h3 className="text-lg font-bold font-mono text-gray-900">#{data.booking.id.slice(0, 8)}</h3>
                        </div>
                        <div className="text-right">
                            <span className={`inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${data.booking.status === "Confirmed" ? "bg-green-100 text-green-800" :
                                    data.booking.status === "Cancelled" ? "bg-red-100 text-red-800" :
                                        "bg-blue-100 text-blue-800"
                                }`}>
                                {data.booking.status}
                            </span>
                            <p className="text-sm font-bold text-gray-900 mt-2">${(data.booking.total_amount / 100).toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="relative pl-6 border-l-2 border-gray-100 space-y-8 pb-8">
                        {data.timeline.map((event: any, idx: number) => {
                            const Icon = iconMap[event.icon] || FilePlus;
                            const isLatest = idx === 0;

                            const colorClasses = {
                                blue: "bg-blue-100 text-blue-600",
                                red: "bg-red-100 text-red-600",
                                green: "bg-green-100 text-green-600",
                                orange: "bg-orange-100 text-orange-600",
                                emerald: "bg-emerald-100 text-emerald-600",
                                purple: "bg-purple-100 text-purple-600",
                                yellow: "bg-yellow-100 text-yellow-600",
                            }[event.color as string] || "bg-gray-100 text-gray-600";

                            return (
                                <div key={event.id} className="relative">
                                    <span className={`absolute -left-[35px] flex items-center justify-center w-8 h-8 rounded-full ring-4 ring-white ${colorClasses}`}>
                                        <Icon size={14} />
                                    </span>

                                    <Card className={`shadow-sm border border-gray-100 transition-all ${isLatest ? 'ring-1 ring-blue-500/20 shadow-md' : 'opacity-80'}`}>
                                        <CardContent className="p-4 sm:p-5">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">{event.title}</h4>
                                                    <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                                                </div>
                                                <time className="text-xs font-medium text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md">
                                                    {new Date(event.timestamp).toLocaleString("en-US", {
                                                        month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true
                                                    })}
                                                </time>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}

                        {data.timeline.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No events found for this booking.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
