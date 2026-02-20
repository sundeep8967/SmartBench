"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Store,
    Users,
    Calendar,
    Clock,
    ShieldCheck,
    DollarSign,
    Briefcase,
    Bookmark,
    Bell,
    Settings,
    ChevronLeft,
    LogOut,
    Shield,
    BookOpen
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";

const mainNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/dashboard/projects", icon: Briefcase },
    { name: "Marketplace", href: "/dashboard/marketplace", icon: Store },
    { name: "Roster", href: "/dashboard/roster", icon: Users },
    { name: "Bookings", href: "/dashboard/bookings", icon: Calendar },
    { name: "Time Clock", href: "/dashboard/time-clock", icon: Clock },
    { name: "Verification", href: "/dashboard/timesheets", icon: ShieldCheck },
    { name: "Financials", href: "/dashboard/financials", icon: DollarSign },
];

const systemNav = [
    { name: "Insurance", href: "/dashboard/insurance", icon: Shield },
    { name: "Policies", href: "/dashboard/settings/policies", icon: BookOpen },
    { name: "Saved Searches", href: "/dashboard/saved-searches", icon: Bookmark },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, loading, logout } = useAuth();

    console.log("Sidebar: Auth Status - Loading:", loading);
    console.log("Sidebar: Current User Data:", user);

    return (
        <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-50">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100 justify-between">
                <div className="flex items-center space-x-2.5">
                    <img src="/Logo.png" alt="SmartBench" className="h-8 w-8" />
                    <span className="text-xl font-bold text-gray-900 tracking-tight">SmartBench</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
                {/* Main Nav */}
                <nav className="space-y-1">
                    {mainNav.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${isActive
                                    ? "bg-blue-900 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                <item.icon
                                    size={20}
                                    className={`mr-3 transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-500"
                                        }`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* System Nav */}
                <div>
                    <div className="px-3 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        System
                    </div>
                    <nav className="space-y-1">
                        {systemNav.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${isActive
                                        ? "bg-blue-900 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <item.icon
                                        size={20}
                                        className={`mr-3 transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-500"
                                            }`}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center min-w-0">
                        <img
                            src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || user?.email || 'User')}&background=111827&color=fff`}
                            alt={user?.user_metadata?.full_name || "User"}
                            className="h-9 w-9 rounded-full ring-2 ring-white shadow-sm flex-shrink-0"
                        />
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.user_metadata?.full_name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all ml-2"
                        title="Sign Out"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
