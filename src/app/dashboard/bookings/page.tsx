"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Search,
    Filter,
    MoreHorizontal,
    MapPin,
    Clock
} from "lucide-react";

// Mock booking data
const bookings = [
    { id: "#BK-9021", worker: "Mike Ross", role: "Electrician", project: "Lakeside Remodel", location: "Austin, TX", start: "Oct 24, 2023", end: "Oct 26, 2023", status: "Active", avatar: "MR" },
    { id: "#BK-9022", worker: "Rachel Zane", role: "Project Manager", project: "Downtown Loft", location: "Dallas, TX", start: "Oct 28, 2023", end: "Nov 02, 2023", status: "Pending", avatar: "RZ" },
    { id: "#BK-9023", worker: "Harvey Specter", role: "Site Foreman", project: "Pearson HQ", location: "New York, NY", start: "Nov 05, 2023", end: "Nov 12, 2023", status: "Active", avatar: "HS" },
    { id: "#BK-9024", worker: "Donna Paulsen", role: "Interior Specialist", project: "Lakeside Remodel", location: "Austin, TX", start: "Nov 15, 2023", end: "Nov 20, 2023", status: "Pending", avatar: "DP" },
    { id: "#BK-9020", worker: "Louis Litt", role: "HVAC Tech", project: "Pearson HQ", location: "New York, NY", start: "Oct 10, 2023", end: "Oct 15, 2023", status: "Completed", avatar: "LL" },
];

export default function BookingsPage() {
    return (
        <div className="space-y-6">
            {/* Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bookings</h1>
                    <p className="text-gray-500">Manage your active, pending, and past worker bookings.</p>
                </div>
            </div>

            {/* Controls */}
            <Card className="p-4 shadow-sm border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search bookings by ID, worker, or project..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex items-center space-x-3">
                        <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:outline-none">
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Pending</option>
                            <option>Completed</option>
                        </select>
                        <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:outline-none">
                            <option>This Month</option>
                            <option>Last Month</option>
                        </select>
                        <Button variant="outline" className="text-gray-700 border-gray-300">
                            <Filter size={16} className="mr-2" />
                            More Filters
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Bookings Table */}
            <Card className="shadow-sm border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Booking ID</th>
                                <th className="px-6 py-4">Worker</th>
                                <th className="px-6 py-4">Project</th>
                                <th className="px-6 py-4">Dates</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-blue-600">{booking.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 border border-gray-200">
                                                {booking.avatar}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{booking.worker}</p>
                                                <p className="text-xs text-gray-500">{booking.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{booking.project}</span>
                                            <span className="text-xs text-gray-500 flex items-center mt-0.5">
                                                <MapPin size={10} className="mr-1" />
                                                {booking.location}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center">
                                            <Calendar size={14} className="mr-2 text-gray-400" />
                                            {booking.start} <span className="mx-1 text-gray-400">-</span> {booking.end}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${booking.status === "Active"
                                                ? "bg-green-50 text-green-700 border-green-100"
                                                : booking.status === "Pending"
                                                    ? "bg-orange-50 text-orange-700 border-orange-100"
                                                    : "bg-gray-50 text-gray-700 border-gray-100"
                                            }`}>
                                            {booking.status === "Active" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>}
                                            {booking.status === "Pending" && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></span>}
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreHorizontal size={16} className="text-gray-400" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination placeholder */}
                <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Showing 1-5 of 12 bookings</span>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" disabled>Previous</Button>
                        <Button variant="outline" size="sm">Next</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
