"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Bell,
    CheckCircle,
    AlertTriangle,
    Info,
    Calendar,
    Settings,
    MoreHorizontal
} from "lucide-react";

// Mock Notifications Data
const notifications = [
    {
        id: 1,
        title: "Budget Alert: Downtown Office Lofts",
        message: "Project spending has reached 90% of the allocated budget ($125k / $140k).",
        time: "Just now",
        type: "warning",
        isRead: false
    },
    {
        id: 2,
        title: "New Application Received",
        message: "David Miller applied for 'Senior Foreman' position via Marketplace.",
        time: "2 hours ago",
        type: "success",
        isRead: false
    },
    {
        id: 3,
        title: "System Maintenance Scheduled",
        message: "SmartBench will undergo maintenance on Sunday at 2:00 AM EST.",
        time: "1 day ago",
        type: "info",
        isRead: true
    },
    {
        id: 4,
        title: "License Expiration Warning",
        message: "General Liability Policy #GL-9832290 expires in 30 days.",
        time: "2 days ago",
        type: "warning",
        isRead: true
    },
    {
        id: 5,
        title: "Weekly Payout Processed",
        message: "$12,450.00 has been transferred to your Stripe account.",
        time: "3 days ago",
        type: "success",
        isRead: true
    }
];

export default function NotificationsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-sm text-gray-500 mb-1">System → Notifications</div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="text-gray-600">
                        <Settings size={14} className="mr-2" /> Settings
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600">
                        Mark all as read
                    </Button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {notifications.map((notification) => (
                    <Card
                        key={notification.id}
                        className={`shadow-sm border border-gray-100 p-5 transition-all hover:bg-gray-50 ${!notification.isRead ? "bg-white border-l-4 border-l-blue-500" : "bg-gray-50/50 opacity-75"
                            }`}
                    >
                        <div className="flex items-start gap-4">
                            {/* Icon Based on Type */}
                            <div className={`p-2 rounded-full flex-shrink-0 ${notification.type === "warning" ? "bg-yellow-100 text-yellow-600" :
                                    notification.type === "success" ? "bg-green-100 text-green-600" :
                                        "bg-blue-100 text-blue-600"
                                }`}>
                                {notification.type === "warning" ? <AlertTriangle size={20} /> :
                                    notification.type === "success" ? <CheckCircle size={20} /> :
                                        <Info size={20} />}
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className={`text-base font-semibold ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                                        {notification.title}
                                    </h3>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">{notification.time}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            </div>

                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400">
                                <MoreHorizontal size={16} />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex justify-center pt-4">
                <Button variant="ghost" className="text-gray-500 text-sm">Load older notifications</Button>
            </div>
        </div>
    );
}
