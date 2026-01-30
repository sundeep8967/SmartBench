"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Placeholder icons - in a real app these would be lucide-react or similar
const Icons = {
    Dashboard: () => <span className="mr-2">📊</span>,
    Marketplace: () => <span className="mr-2">🛒</span>,
    Bookings: () => <span className="mr-2">📅</span>,
    Roster: () => <span className="mr-2">👥</span>,
    TimeClock: () => <span className="mr-2">⏱️</span>,
    Timesheets: () => <span className="mr-2">📝</span>,
    Financials: () => <span className="mr-2">💰</span>,
    Settings: () => <span className="mr-2">⚙️</span>,
};

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Icons.Dashboard },
    { name: "Marketplace", href: "/dashboard/marketplace", icon: Icons.Marketplace },
    { name: "My Bookings", href: "/dashboard/bookings", icon: Icons.Bookings },
    { name: "My Roster", href: "/dashboard/roster", icon: Icons.Roster },
    { name: "Time Clock", href: "/dashboard/time-clock", icon: Icons.TimeClock },
    { name: "Timesheets", href: "/dashboard/timesheets", icon: Icons.Timesheets },
    { name: "Financials", href: "/dashboard/financials", icon: Icons.Financials },
    { name: "Settings", href: "/dashboard/settings", icon: Icons.Settings },
];

export function Sidebar() {
    // Mock pathname for now since we aren't using router in this component yet
    // In a real app we'd use usePathname()
    const pathname = "/dashboard";

    return (
        <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white h-screen fixed left-0 top-0 overflow-y-auto z-40">
            <div className="flex h-16 items-center px-6 border-b border-gray-100">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    SmartBench
                </span>
            </div>

            <div className="px-3 py-4">
                <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Menu
                </div>
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                            >
                                <item.icon />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                        JD
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">John Doe</p>
                        <p className="text-xs text-gray-500">Acme Construction</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
