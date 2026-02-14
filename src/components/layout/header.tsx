"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Upload, ShoppingCart, Bookmark, Download, Filter, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/contexts/CartContext";

const routeConfig: Record<string, { section: string; page: string }> = {
  "/dashboard": { section: "Dashboard", page: "Overview" },
  "/dashboard/marketplace": { section: "Marketplace", page: "Search" },
  "/dashboard/bookings": { section: "Bookings", page: "Management" },
  "/dashboard/roster": { section: "Roster", page: "Team" },
  "/dashboard/time-clock": { section: "Time Clock", page: "Tracker" },
  "/dashboard/timesheets": { section: "Verification", page: "Queue" },
  "/dashboard/financials": { section: "Financials", page: "Overview" },
  "/dashboard/projects": { section: "Projects", page: "Active" },
  "/dashboard/saved-searches": { section: "System", page: "Saved Searches" },
  "/dashboard/notifications": { section: "System", page: "Notifications" },
  "/dashboard/settings": { section: "System", page: "Settings" },
};

export function Header() {
  const pathname = usePathname() || "";
  const config = routeConfig[pathname] || { section: "Dashboard", page: "Overview" };
  const isMarketplace = pathname.includes("/marketplace");
  const isRoster = pathname.includes("/roster");
  const { cartCount } = useCart();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm">
        <span className="text-gray-500 font-medium">
          {config.section}
        </span>
        <span className="mx-2 text-gray-400">›</span>
        <span className="text-gray-900 font-semibold bg-gray-100 px-2 py-0.5 rounded text-xs">
          {config.page}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {isMarketplace ? (
          <>
            <Button variant="outline" size="sm" className="hidden md:flex items-center text-gray-700 h-9">
              <Bookmark size={16} className="mr-2" />
              Saved
            </Button>
            <Link href="/dashboard/cart">
              <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white flex items-center shadow-sm relative h-9 px-4">
                <ShoppingCart size={16} className="mr-2" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-orange-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </>
        ) : isRoster ? (
          <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white flex items-center shadow-sm h-9 px-4">
            <UserPlus size={16} className="mr-2" />
            Add Worker
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" className="hidden md:flex items-center text-gray-700 h-9">
              <Download size={16} className="mr-2" />
              Export
            </Button>
            <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white flex items-center shadow-sm h-9 px-4">
              <Plus size={16} className="mr-1" />
              New Project
            </Button>
          </>
        )}
      </div>
    </header >
  );
}
