"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    MapPin,
    Wallet,
    ClipboardCheck,
    Search,
    Plus,
    UserPlus,
    Lightbulb,
    MoreHorizontal
} from "lucide-react";

// Mock bookings
const bookings = [
    { id: "#BK-9021", worker: "Mike Ross", dates: "Oct 24 - Oct 26", status: "Active", avatar: "MR" },
    { id: "#BK-9022", worker: "Rachel Zane", dates: "Oct 28 - Nov 02", status: "Pending", avatar: "RZ" },
    { id: "#BK-9023", worker: "Harvey Specter", dates: "Nov 05 - Nov 12", status: "Active", avatar: "HS" },
    { id: "#BK-9024", worker: "Donna Paulsen", dates: "Nov 15 - Nov 20", status: "Pending", avatar: "DP" },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back to your construction management hub.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Active Bookings */}
                        <Card className="shadow-sm border-gray-200">
                            <CardContent className="pt-6">
                                <div className="flex flex-col h-full justify-between">
                                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Active Bookings</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">5</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Verifications */}
                        <Card className="shadow-sm border-gray-200">
                            <CardContent className="pt-6">
                                <div className="flex flex-col h-full justify-between">
                                    <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                                        <ClipboardCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Pending Verifications</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">3</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Bookings Table */}
                    <Card className="shadow-sm border-gray-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
                            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Booking ID</th>
                                        <th className="px-6 py-3">Worker</th>
                                        <th className="px-6 py-3">Dates</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{booking.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                        {booking.avatar}
                                                    </div>
                                                    <span className="text-gray-900 font-medium">{booking.worker}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{booking.dates}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === "Active"
                                                        ? "bg-green-50 text-green-700 border border-green-100"
                                                        : "bg-orange-50 text-orange-700 border border-orange-100"
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar (1/3) */}
                <div className="space-y-6">
                    {/* Stripe Balance */}
                    <Card className="shadow-sm border-gray-200 bg-white">
                        <CardContent className="pt-6">
                            <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
                                <Wallet size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Stripe Balance</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">$2,450.00</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white justify-start h-12 text-base font-medium shadow-sm">
                                <Search size={18} className="mr-3" />
                                Search Workers
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 text-base font-medium text-gray-700 border-gray-300 hover:bg-gray-50">
                                <Plus size={18} className="mr-3" />
                                Create Project
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 text-base font-medium text-gray-700 border-gray-300 hover:bg-gray-50">
                                <UserPlus size={18} className="mr-3" />
                                Add to Roster
                            </Button>
                        </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center space-x-2 mb-3">
                            <Lightbulb size={18} className="text-orange-500 fill-orange-500" />
                            <span className="font-bold text-gray-900">Pro Tip</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Need to verify workers quickly? Use the bulk action tool in the Verification tab to process multiple profiles at once.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
