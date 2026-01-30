"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock booking data
const bookings = [
    {
        id: "BK-0021",
        worker: { name: "Mike Ross", role: "Electrician", avatar: "MR" },
        project: "Lakeside Remodel",
        location: "Building A, Floor 3",
        schedule: "Oct 24 - Oct 26",
        hours: "24 Hours",
        rate: "$45.00/hr",
        total: "$1,080.00",
        status: "Active",
    },
    {
        id: "BK-0022",
        worker: { name: "Rachel Zane", role: "Planner", avatar: "RZ" },
        project: "City Center Reno",
        location: "Main Office",
        schedule: "Oct 28 - Nov 02",
        hours: "40 Hours",
        rate: "$38.00/hr",
        total: "$1,520.00",
        status: "Pending",
    },
    {
        id: "BK-0023",
        worker: { name: "Harvey Specter", role: "Site Manager", avatar: "HS" },
        project: "West Wing Extension",
        location: "Exterior",
        schedule: "Nov 05 - Nov 12",
        hours: "64 Hours",
        rate: "$55.00/hr",
        total: "$3,840.00",
        status: "Completed",
    },
];

const statusColors: Record<string, string> = {
    Active: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Completed: "bg-blue-100 text-blue-700",
};

export default function BookingsPage() {
    const [activeTab, setActiveTab] = useState<"hires" | "lending">("hires");
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 mb-1">
                        Bookings → Management
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
                    <p className="text-gray-500">Manage your workforce, schedules, and lending contracts.</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline">📊 Export Report</Button>
                    <Button>+ New Booking</Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200">
                <button
                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "hires"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    onClick={() => setActiveTab("hires")}
                >
                    My Hires (Borrowing)
                </button>
                <button
                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "lending"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    onClick={() => setActiveTab("lending")}
                >
                    My Lending (Lending)
                </button>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by worker..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm">
                        <option>All Statuses</option>
                        <option>Active</option>
                        <option>Pending</option>
                        <option>Completed</option>
                    </select>
                    <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm">
                        <option>This Month</option>
                        <option>Last Month</option>
                        <option>Last 3 Months</option>
                    </select>
                </div>
            </Card>

            {/* Bookings Table */}
            <Card noPadding>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Booking ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Worker
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Project / Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Schedule
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Financials
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        #{booking.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                                {booking.worker.avatar}
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">{booking.worker.name}</p>
                                                <p className="text-xs text-gray-500">{booking.worker.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm font-medium text-gray-900">{booking.project}</p>
                                        <p className="text-xs text-gray-500">{booking.location}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm text-gray-900">{booking.schedule}</p>
                                        <p className="text-xs text-gray-500">{booking.hours}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <p className="text-sm font-medium text-gray-900">{booking.rate}</p>
                                        <p className="text-xs text-gray-500">Total: {booking.total}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[booking.status]}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Button variant="ghost" size="sm">⋮</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Showing 1 to 3 of 24 results</p>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Previous</Button>
                        <Button variant="outline" size="sm">Next</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
