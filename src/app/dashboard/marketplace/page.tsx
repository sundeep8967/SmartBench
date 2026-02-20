"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, BadgeCheck, Star, Loader2, Users } from "lucide-react";
import { useCart } from "@/lib/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";

interface WorkerData {
    id: string;
    user_id: string;
    trade: string | null;
    skills: string[] | null;
    home_zip_code: string | null;
    photo_url: string | null;
    hourly_rate: number;
    user: { full_name: string; email: string } | null;
}

interface WorkOrder {
    id: string;
    role: string;
}

export default function MarketplacePage() {
    const { toast } = useToast();
    const [workers, setWorkers] = useState<WorkerData[]>([]);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTrade, setSelectedTrade] = useState("All");
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const { refreshCart, cartItems } = useCart();

    const fetchWorkers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.set("q", searchTerm);
            if (selectedTrade !== "All") params.set("trade", selectedTrade);

            const res = await fetch(`/api/workers/available?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setWorkers(data.workers || []);
                setWorkOrders(data.work_orders || []);
            }
        } catch (error) {
            console.error("Failed to fetch workers", error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedTrade]);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchWorkers();
    };

    const handleAddToCart = async (worker: WorkerData) => {
        if (workOrders.length === 0) {
            toast({
                title: "No Work Orders",
                description: "Create a work order under a project first before adding workers.",
                variant: "destructive",
            });
            return;
        }

        setAddingToCart(worker.user_id);
        try {
            const payload = {
                work_order_id: workOrders[0].id,
                worker_id: worker.user_id,
                hourly_rate: worker.hourly_rate,
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            };

            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to add to cart");
            }

            await refreshCart();

            toast({
                title: "Added to cart",
                description: `${worker.user?.full_name} has been added to your cart.`,
                variant: "success",
            });
        } catch (f) {
            toast({
                title: "Error",
                description: f instanceof Error ? f.message : "Could not add to cart",
                variant: "destructive",
            });
        } finally {
            setAddingToCart(null);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const trades = ["All", "Electrician", "Plumber", "HVAC Technician", "General Contractor", "Project Manager", "Carpenter"];

    return (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marketplace</h1>
                <p className="text-gray-500">Find and hire top-rated construction professionals.</p>
            </div>

            {/* Search & Filters */}
            <Card className="p-4 shadow-sm border-gray-200">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, trade, or skill..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            value={selectedTrade}
                            onChange={(e) => setSelectedTrade(e.target.value)}
                            className="px-3 py-2.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            {trades.map((t) => (
                                <option key={t} value={t}>{t === "All" ? "All Trades" : t}</option>
                            ))}
                        </select>

                        <select className="px-3 py-2.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option>Availability</option>
                            <option>Available Now</option>
                        </select>

                        <Button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white w-full h-auto">
                            Search
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-3 text-gray-500">Loading workers...</span>
                </div>
            )}

            {/* Empty State */}
            {!loading && workers.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed">
                    <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2">No workers found matching your criteria.</p>
                    <p className="text-gray-400 text-sm">Try adjusting your search or filters.</p>
                </div>
            )}

            {/* Worker Grid */}
            {!loading && workers.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {workers.map((worker) => {
                        const name = worker.user?.full_name || "Unknown Worker";
                        const initials = getInitials(name);
                        const skills = Array.isArray(worker.skills) ? worker.skills : [];
                        const isInCart = cartItems.some((item) => item.worker_id === worker.user_id);

                        return (
                            <Card key={worker.id} className="p-5 shadow-sm border-gray-200 hover:shadow-md transition-shadow relative group">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm border border-gray-100 overflow-hidden shrink-0">
                                            {worker.photo_url ? (
                                                <img src={worker.photo_url} alt={name} className="h-full w-full object-cover" />
                                            ) : (
                                                initials
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center">
                                                <h3 className="font-bold text-gray-900 mr-1 group-hover:text-blue-900 transition-colors">{name}</h3>
                                                <BadgeCheck size={16} className="text-green-500 fill-green-100" />
                                            </div>
                                            <p className="text-xs text-gray-500">{worker.trade || "General"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-orange-50 px-2 py-0.5 rounded text-orange-600 font-bold text-xs">
                                        <Star size={12} className="fill-current mr-1" />
                                        4.8
                                    </div>
                                </div>

                                {/* Skills */}
                                <div className="flex flex-wrap gap-2 mt-4 mb-6">
                                    {skills.slice(0, 4).map((skill) => (
                                        <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
                                            {skill}
                                        </span>
                                    ))}
                                    {skills.length > 4 && (
                                        <span className="px-2 py-1 text-gray-400 text-xs">+{skills.length - 4} more</span>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div>
                                        <span className="text-xl font-bold text-gray-900">${worker.hourly_rate}</span>
                                        <span className="text-xs text-gray-500">/hr</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-blue-900 border-blue-200 hover:bg-blue-50 cursor-pointer"
                                        onClick={() => handleAddToCart(worker)}
                                        disabled={addingToCart === worker.user_id || isInCart}
                                    >
                                        {addingToCart === worker.user_id ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Adding...
                                            </>
                                        ) : isInCart ? (
                                            <>
                                                <BadgeCheck className="mr-2 h-4 w-4" />
                                                Added
                                            </>
                                        ) : (
                                            "Add to Cart"
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
