"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Search,
    MoreHorizontal,
    MapPin,
    Download,
    Plus,
    LayoutGrid,
    List
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";



export default function BookingsPage() {
    const [view, setView] = useState<"card" | "table">("table");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const { data, isLoading: loading } = useSWR('/api/bookings', fetcher, {
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

            const matchesStatus =
                statusFilter === "All" || b.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [bookings, searchTerm, statusFilter]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings Management</h1>
                    <p className="text-gray-500 mt-1">Manage your workforce, schedules, and lending contracts.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" className="text-gray-600 border-gray-300">
                        <Download size={16} className="mr-2" />
                        Export Report
                    </Button>
                    <Button className="bg-blue-900 hover:bg-blue-800 text-white">
                        <Plus size={16} className="mr-2" />
                        New Booking
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <a href="#" className="border-blue-500 text-blue-600 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">
                        My Hires (Borrowing)
                    </a>
                    <a href="#" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">
                        My Lending (Lending)
                    </a>
                </nav>
            </div>

            {/* Unified Filter Bar */}
            <div className="flex flex-wrap items-stretch bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Search */}
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

                {/* Divider */}
                <div className="w-px bg-gray-200 self-stretch" />

                {/* Status Filter */}
                <div className="flex items-center">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-full px-4 py-2.5 text-sm text-gray-600 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '2rem' }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>

                {/* Divider */}
                <div className="w-px bg-gray-200 self-stretch" />

                {/* View Toggle */}
                <div className="flex items-center">
                    <button
                        onClick={() => setView("card")}
                        className={`p-2.5 transition-colors ${view === "card" ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`}
                        title="Card view"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <div className="w-px bg-gray-200 self-stretch" />
                    <button
                        onClick={() => setView("table")}
                        className={`p-2.5 transition-colors ${view === "table" ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`}
                        title="Table view"
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Results count */}
            {searchTerm || statusFilter !== "All" ? (
                <p className="text-xs text-gray-500">{filteredBookings.length} of {bookings.length} bookings</p>
            ) : null}

            {view === "card" ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {loading ? (
                        <div className="col-span-full text-center py-12 text-gray-500">Loading bookings...</div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                            <p className="text-muted-foreground">{bookings.length === 0 ? "No bookings found." : "No bookings match your search."}</p>
                        </div>
                    ) : filteredBookings.map((booking) => (
                        <Card key={booking.id} className="p-[25px] border border-gray-200 hover:shadow-md transition-all cursor-pointer">
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
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${booking.status === "Confirmed" ? "bg-green-50 text-green-600 border border-green-100" :
                                    booking.status === "Pending" ? "bg-orange-50 text-orange-500 border border-orange-100" :
                                        "bg-gray-100 text-gray-600 border border-gray-200"
                                    }`}>{booking.status}</span>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start text-gray-500">
                                    <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="leading-[1.6] truncate">{booking.project?.name || "Untitled Project"}</span>
                                </div>
                                <div className="flex items-start text-gray-500">
                                    <Calendar className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="leading-[1.6]">{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t mt-4">
                                    <span className="font-bold text-gray-900">${(booking.total_amount / 100).toFixed(2)}</span>
                                    <span className="text-sm text-gray-500">Total Bill</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="shadow-sm border border-gray-200 overflow-hidden rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Booking ID</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Worker</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Project / Location</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Schedule</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Financials</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading bookings...</td>
                                    </tr>
                                ) : filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">{bookings.length === 0 ? "No bookings found." : "No bookings match your search."}</td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-blue-700">#{booking.id.slice(0, 8)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center border border-white shadow-sm shrink-0 text-blue-700 font-bold text-xs">
                                                        {booking.worker?.full_name?.charAt(0) || "W"}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-blue-700">{booking.worker?.full_name || "Unknown Worker"}</p>
                                                        <p className="text-xs text-gray-400">{booking.work_order?.role || "General Labor"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{booking.project?.name || "Untitled Project"}</span>
                                                    <span className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                                                        {booking.project?.address || "No Address"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</span>
                                                    <span className="text-xs text-blue-600 font-medium mt-0.5">
                                                        Est. {Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24) + 1) * 8} Hours
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden lg:table-cell">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">${(booking.total_amount / 100).toFixed(2)}</span>
                                                    <span className="text-xs text-gray-400 mt-0.5">Total Bill</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${booking.status === "Confirmed" ? "bg-green-50 text-green-600 border border-green-100" :
                                                    booking.status === "Pending" ? "bg-orange-50 text-orange-500 border border-orange-100" :
                                                        "bg-gray-100 text-gray-600 border border-gray-200"
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600">
                                                    <MoreHorizontal size={18} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
