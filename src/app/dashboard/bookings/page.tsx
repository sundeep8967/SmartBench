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

// Mock booking data
const bookings = [
    {
        id: "#BK-9021",
        worker: "Mike Ross",
        role: "Electrician",
        project: "Lakeside Remodel",
        location: "Building A, Floor 2",
        start: "Oct 24",
        end: "Oct 26",
        hours: "24 Hours",
        rate: 45.00,
        total: 1080.00,
        status: "Active",
        avatarUrl: "/avatars/mike_ross.png",
        avatar: "MR"
    },
    {
        id: "#BK-9022",
        worker: "Rachel Zane",
        role: "Plumber",
        project: "City Center Reno",
        location: "Main Lobby",
        start: "Oct 28",
        end: "Nov 02",
        hours: "40 Hours",
        rate: 38.00,
        total: 1520.00,
        status: "Pending",
        avatarUrl: "/avatars/rachel_zane.png",
        avatar: "RZ"
    },
    {
        id: "#BK-9023",
        worker: "Harvey Specter",
        role: "Site Manager",
        project: "West Wing Extension",
        location: "Exterior",
        start: "Nov 05",
        end: "Nov 12",
        hours: "56 Hours",
        rate: 65.00,
        total: 3640.00,
        status: "Completed",
        avatarUrl: "/avatars/harvey_specter.png",
        avatar: "HS"
    },
    {
        id: "#BK-9024",
        worker: "Donna Paulsen",
        role: "Interior Specialist",
        project: "Lakeside Remodel",
        location: "Building A, Floor 2",
        start: "Nov 15",
        end: "Nov 20",
        hours: "32 Hours",
        rate: 42.00,
        total: 1344.00,
        status: "Pending",
        avatarUrl: "/avatars/donna_paulsen.png",
        avatar: "DP"
    }
];

export default function BookingsPage() {
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
                    <div className="relative">
                        <select className="appearance-none w-40 pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                            <option>This Month</option>
                            <option>Last Month</option>
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
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">{booking.id}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
                                                {booking.avatarUrl ? (
                                                    <img src={booking.avatarUrl} alt={booking.worker} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-600">{booking.avatar}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{booking.worker}</p>
                                                <p className="text-xs text-gray-500">{booking.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{booking.project}</span>
                                            <span className="text-xs text-gray-400 mt-0.5">
                                                {booking.location}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{booking.start} - {booking.end}</span>
                                            <span className="text-xs text-blue-600 font-medium mt-0.5">{booking.hours}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">${booking.rate.toFixed(2)}/hr</span>
                                            <span className="text-xs text-gray-400 mt-0.5">Total: ${booking.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${booking.status === "Active" ? "bg-green-50 text-green-600 border border-green-100" :
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
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Showing 1 to 4 of 24 results</p>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="text-xs" disabled>Previous</Button>
                        <Button variant="outline" size="sm" className="text-xs" >Next</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
