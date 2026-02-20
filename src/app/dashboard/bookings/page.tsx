"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Search,
    Filter,
    MoreHorizontal,
    MapPin,
    Download,
    Plus,
    ChevronDown
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";



export default function BookingsPage() {
    const { data, isLoading: loading } = useSWR('/api/bookings', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 30000,
    });

    const bookings: any[] = data || [];

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

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by worker..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <select className="appearance-none w-40 pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Pending</option>
                            <option>Completed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Bookings Table */}
            <Card className="shadow-sm border border-gray-200 overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-bold tracking-wider text-gray-400">Booking ID</th>
                                <th className="px-6 py-4 font-bold tracking-wider text-gray-400">Worker</th>
                                <th className="px-6 py-4 font-bold tracking-wider text-gray-400">Project / Location</th>
                                <th className="px-6 py-4 font-bold tracking-wider text-gray-400">Schedule</th>
                                <th className="px-6 py-4 font-bold tracking-wider text-gray-400">Financials</th>
                                <th className="px-6 py-4 font-bold tracking-wider text-gray-400">Status</th>
                                <th className="px-6 py-4 text-right font-bold tracking-wider text-gray-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading bookings...</td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No bookings found.</td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">#{booking.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border border-white shadow-sm shrink-0 text-blue-700 font-bold">
                                                    {booking.worker?.full_name?.charAt(0) || "W"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{booking.worker?.full_name || "Unknown Worker"}</p>
                                                    <p className="text-xs text-gray-500">{booking.work_order?.role || "General Labor"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{booking.project?.name || "Untitled Project"}</span>
                                                <span className="text-xs text-gray-400 mt-0.5">
                                                    {booking.project?.address || "No Address"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-900">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</span>
                                                <span className="text-xs text-blue-600 font-medium mt-0.5">
                                                    Est. {Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24) + 1) * 8} Hours
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">${(booking.total_amount / 100).toFixed(2)}</span>
                                                <span className="text-xs text-gray-400 mt-0.5">Total Bill</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${booking.status === "Confirmed" ? "bg-green-50 text-green-600 border border-green-100" :
                                                booking.status === "Pending" ? "bg-orange-50 text-orange-500 border border-orange-100" :
                                                    "bg-gray-100 text-gray-600 border border-gray-200"
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
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
        </div>
    );
}
