"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Calendar, Search, MapPin, Download, Plus, LayoutGrid,
    List, X, AlertTriangle, Loader2, Star
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { useToast } from "@/components/ui/use-toast";
import { LeaveReviewDialog } from "@/components/bookings/leave-review-dialog";
import { EndBookingModal } from "@/components/dashboard/bookings/end-booking-modal";

// Cancel Confirmation Dialog
function CancelDialog({
    booking,
    onClose,
    onConfirm,
    loading,
}: {
    booking: any;
    onClose: () => void;
    onConfirm: (fault: "borrower" | "lender", reason: string) => void;
    loading: boolean;
}) {
    const [fault, setFault] = useState<"borrower" | "lender">("borrower");
    const [reason, setReason] = useState("");
    const startDate = new Date(booking.start_date);
    const hoursUntilStart = (startDate.getTime() - Date.now()) / (1000 * 60 * 60);
    const totalCents = Number(booking.total_amount) || 0;
    const serviceFeeCents = Number(booking.service_fee_amount) || 0;

    const expectedRefundCents = fault === "lender"
        ? totalCents
        : hoursUntilStart >= 24 ? totalCents : totalCents - serviceFeeCents;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle size={18} className="text-red-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Cancel Booking</h2>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Booking #{booking.id.slice(0, 8)} · {booking.worker?.full_name}
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    {/* Fault Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Who is at fault?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setFault("borrower")}
                                className={`border rounded-lg p-3 text-sm font-medium transition-all ${fault === "borrower" ? "border-blue-500 bg-blue-50 text-blue-800" : "border-gray-200 hover:border-gray-300 text-gray-600"}`}
                            >
                                <div className="font-semibold">Our Company</div>
                                <div className="text-xs opacity-70 mt-0.5">We are cancelling</div>
                            </button>
                            <button
                                onClick={() => setFault("lender")}
                                className={`border rounded-lg p-3 text-sm font-medium transition-all ${fault === "lender" ? "border-orange-500 bg-orange-50 text-orange-800" : "border-gray-200 hover:border-gray-300 text-gray-600"}`}
                            >
                                <div className="font-semibold">Lender at Fault</div>
                                <div className="text-xs opacity-70 mt-0.5">They failed to deliver</div>
                            </button>
                        </div>
                    </div>

                    {/* Refund Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <p className="font-semibold text-gray-700">Refund Summary</p>
                        <div className="flex justify-between text-gray-600">
                            <span>Total Paid</span>
                            <span className="font-medium">${(totalCents / 100).toFixed(2)}</span>
                        </div>
                        {fault === "borrower" && hoursUntilStart < 24 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Service Fee Retained (late cancel)</span>
                                <span className="font-medium text-red-600">-${(serviceFeeCents / 100).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-900 border-t pt-2 mt-2">
                            <span>You Will Receive</span>
                            <span className="text-green-700">${(expectedRefundCents / 100).toFixed(2)}</span>
                        </div>
                        {fault === "lender" && (
                            <p className="text-xs text-green-600 font-medium">✅ Full refund — lender at fault</p>
                        )}
                        {fault === "borrower" && hoursUntilStart < 24 && (
                            <p className="text-xs text-orange-600 font-medium">⚠️ {Math.round(hoursUntilStart)}h until start — service fee retained</p>
                        )}
                    </div>

                    {/* Reason */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-600">Reason (optional)</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Brief explanation for cancellation..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                            rows={2}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                        Keep Booking
                    </Button>
                    <Button
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => onConfirm(fault, reason)}
                        disabled={loading}
                    >
                        {loading ? <><Loader2 size={15} className="mr-2 animate-spin" /> Processing...</> : "Confirm Cancel"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function BookingsPage() {
    const [view, setView] = useState<"card" | "table">("table");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [cancelTarget, setCancelTarget] = useState<any | null>(null);
    const [reviewTarget, setReviewTarget] = useState<any | null>(null);
    const [endBookingTarget, setEndBookingTarget] = useState<any | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const { toast } = useToast();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const { data, isLoading: loading, mutate } = useSWR('/api/bookings', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 30000,
    });

    const bookings: any[] = data || [];

    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            const matchesSearch =
                !searchTerm ||
                (b.worker?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (b.project?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (b.work_order?.role || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || b.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [bookings, searchTerm, statusFilter]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, view]);

    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const currentBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleCancelConfirm = async (fault: "borrower" | "lender", reason: string) => {
        if (!cancelTarget) return;
        setCancelLoading(true);
        try {
            const res = await fetch("/api/bookings/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ booking_id: cancelTarget.id, fault, reason }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Cancel failed");
            toast({
                title: "Booking Cancelled",
                description: `Refund of $${result.refund_amount_usd} initiated. ${result.reason}`,
            });
            setCancelTarget(null);
            await mutate();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
        setCancelLoading(false);
    };

    const statusBadgeClass = (status: string) => {
        switch (status) {
            case "Confirmed": return "bg-green-50 text-green-600 border border-green-100";
            case "Pending": return "bg-orange-50 text-orange-500 border border-orange-100";
            case "Cancelled": return "bg-red-50 text-red-500 border border-red-100";
            default: return "bg-gray-100 text-gray-600 border border-gray-200";
        }
    };

    return (
        <div className="space-y-6">
            {/* Cancel Dialog */}
            {cancelTarget && (
                <CancelDialog
                    booking={cancelTarget}
                    onClose={() => setCancelTarget(null)}
                    onConfirm={handleCancelConfirm}
                    loading={cancelLoading}
                />
            )}

            {/* Leave Review Dialog */}
            {reviewTarget && (
                <LeaveReviewDialog
                    open={!!reviewTarget}
                    onOpenChange={(open) => !open && setReviewTarget(null)}
                    bookingId={reviewTarget.id}
                    workerId={reviewTarget.worker_id}
                    workerName={reviewTarget.worker?.full_name || "Unknown Worker"}
                />
            )}

            {/* End Booking Dialog */}
            {endBookingTarget && (
                <EndBookingModal
                    open={!!endBookingTarget}
                    onOpenChange={(open) => !open && setEndBookingTarget(null)}
                    booking={endBookingTarget}
                    onSuccess={() => { mutate(); setEndBookingTarget(null); }}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings Management</h1>
                    <p className="text-gray-500 mt-1">Manage your workforce, schedules, and lending contracts.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" className="text-gray-600 border-gray-300">
                        <Download size={16} className="mr-2" /> Export Report
                    </Button>
                    <Button className="bg-blue-900 hover:bg-blue-800 text-white">
                        <Plus size={16} className="mr-2" /> New Booking
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <a href="#" className="border-blue-500 text-blue-600 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">My Hires (Borrowing)</a>
                    <a href="#" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">My Lending (Lending)</a>
                </nav>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-stretch bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center flex-1 min-w-[200px] px-3">
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search by worker, project..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                    />
                </div>
                <div className="w-px bg-gray-200 self-stretch" />
                <div className="flex items-center">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-full px-4 py-2.5 text-sm text-gray-600 bg-transparent border-none focus:outline-none cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div className="w-px bg-gray-200 self-stretch" />
                <div className="flex items-center">
                    <button onClick={() => setView("card")} className={`p-2.5 transition-colors ${view === "card" ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`} title="Card view">
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <div className="w-px bg-gray-200 self-stretch" />
                    <button onClick={() => setView("table")} className={`p-2.5 transition-colors ${view === "table" ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`} title="Table view">
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    Showing {currentBookings.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
                </p>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
                        <span className="text-xs font-medium px-2">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                    </div>
                )}
            </div>

            {/* Card View */}
            {view === "card" ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {loading ? (
                        <div className="col-span-full text-center py-12 text-gray-500">Loading...</div>
                    ) : currentBookings.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                            <p className="text-muted-foreground">{bookings.length === 0 ? "No bookings found." : "No matches."}</p>
                        </div>
                    ) : currentBookings.map((booking) => (
                        <Card key={booking.id} className="p-[25px] border border-gray-200 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                                        {booking.worker?.full_name?.charAt(0) || "W"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate">{booking.worker?.full_name || "Unknown Worker"}</p>
                                        <p className="text-sm text-gray-500">{booking.work_order?.role || "General Labor"}</p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${statusBadgeClass(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start text-gray-500">
                                    <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="truncate">{booking.project?.name || "Untitled Project"}</span>
                                </div>
                                <div className="flex items-start text-gray-500">
                                    <Calendar className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t mt-3">
                                    <span className="font-bold text-gray-900">${(booking.total_amount / 100).toFixed(2)}</span>
                                    {booking.status === "Active" && (
                                        <button
                                            onClick={() => setEndBookingTarget(booking)}
                                            className="text-xs text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1 bg-orange-50 px-2 py-1 rounded"
                                        >
                                            <AlertTriangle size={12} /> End Booking
                                        </button>
                                    )}
                                    {booking.status !== "Cancelled" && booking.status !== "Completed" && booking.status !== "Active" && (
                                        <button
                                            onClick={() => setCancelTarget(booking)}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                                        >
                                            <X size={12} /> Cancel
                                        </button>
                                    )}
                                    {booking.status === "Completed" && (
                                        <button
                                            onClick={() => setReviewTarget(booking)}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <Star size={12} className="fill-blue-100" /> Leave Review
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                /* Table View */
                <Card className="shadow-sm border border-gray-200 overflow-hidden rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Booking ID</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Worker</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Project</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Schedule</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Total</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {loading ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                                ) : currentBookings.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">{bookings.length === 0 ? "No bookings found." : "No matches."}</td></tr>
                                ) : currentBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-blue-700">#{booking.id.slice(0, 8)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                                                    {booking.worker?.full_name?.charAt(0) || "W"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-blue-700">{booking.worker?.full_name || "Unknown"}</p>
                                                    <p className="text-xs text-gray-400">{booking.work_order?.role || "General Labor"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{booking.project?.name || "Untitled"}</p>
                                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{booking.project?.address || ""}</p>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <p className="font-medium text-gray-900">{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <span className="font-bold text-gray-900">${(booking.total_amount / 100).toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadgeClass(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {booking.status === "Active" && (
                                                <button
                                                    onClick={() => setEndBookingTarget(booking)}
                                                    className="text-orange-500 hover:text-orange-700 transition-colors p-1 rounded bg-orange-50 mr-2"
                                                    title="End Active Booking"
                                                >
                                                    <AlertTriangle size={16} />
                                                </button>
                                            )}
                                            {booking.status !== "Cancelled" && booking.status !== "Completed" && booking.status !== "Active" && (
                                                <button
                                                    onClick={() => setCancelTarget(booking)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                                                    title="Cancel booking"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                            {booking.status === "Completed" && (
                                                <button
                                                    onClick={() => setReviewTarget(booking)}
                                                    className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded"
                                                    title="Leave Review"
                                                >
                                                    <Star size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
