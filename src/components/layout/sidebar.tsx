"use client";

import Link from "next/link";
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
    Bell,
    LogOut,
    Shield,
    BookOpen,
    MoreVertical,
    Settings,
    X,
    ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useSidebar } from "@/lib/contexts/SidebarContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/dashboard/projects", icon: Briefcase },
    { name: "Marketplace", href: "/dashboard/marketplace", icon: Store },
    { name: "Employees", href: "/dashboard/roster", icon: Users },
    { name: "Bookings", href: "/dashboard/bookings", icon: Calendar },
    { name: "Time Clock", href: "/dashboard/time-clock", icon: Clock },
    { name: "Time Sheets", href: "/dashboard/timesheets", icon: ShieldCheck },
    { name: "Financials", href: "/dashboard/financials", icon: DollarSign },
    { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    { name: "Super Admin", href: "/dashboard/admin", icon: ShieldAlert },
];

const dropdownNav = [
    { name: "My Profile", href: "/dashboard/profile", icon: Users },
    { name: "Insurance", href: "/dashboard/insurance", icon: Shield },
    { name: "Policies", href: "/dashboard/settings/policies", icon: BookOpen },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, loading, logout } = useAuth();
    const { isOpen, close } = useSidebar();

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={close}
                />
            )}

            <aside
                className={`
                    w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-50
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0
                `}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100 justify-between">
                    <div className="flex items-center space-x-2.5">
                        <img src="/Logo.png" alt="SmartBench" className="h-8 w-8" />
                        <span className="text-xl font-bold text-gray-900 tracking-tight">SmartBench</span>
                    </div>
                    {/* Close button on mobile */}
                    <button
                        onClick={close}
                        className="text-gray-400 hover:text-gray-600 transition-colors lg:hidden block"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Nav */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <nav className="space-y-1">
                        {mainNav.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    prefetch={true}
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

                {/* User Profile */}
                <div className="p-4 border-t border-gray-100">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
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
                                <MoreVertical size={16} className="text-gray-400 group-hover:text-gray-600" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {dropdownNav.map((item) => (
                                <Link key={item.name} href={item.href} prefetch={true}>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <item.icon className="mr-2 h-4 w-4" />
                                        <span>{item.name}</span>
                                    </DropdownMenuItem>
                                </Link>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>
        </>
    );
}
