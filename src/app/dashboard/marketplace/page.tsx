"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin, BadgeCheck, Star, Loader2 } from "lucide-react";
import { useCart } from "@/lib/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";

const workers = [
    { id: 1, uuid: "053105b4-8107-43ff-ae39-e633983ea1d5", name: "Mike Ross", role: "Master Electrician", rating: 4.9, rate: 55, skills: ["Industrial", "High Voltage", "Wiring"], avatar: "MR", avatarUrl: "/avatars/mike_ross.png", verified: true },
    { id: 2, uuid: "1b5ac736-ebf6-4549-abb3-ccdebf5b74cc", name: "Rachel Zane", role: "Project Manager", rating: 4.8, rate: 75, skills: ["Planning", "Budgeting", "Safety"], avatar: "RZ", avatarUrl: "/avatars/rachel_zane.png", verified: true },
    { id: 3, uuid: "11a66e33-263b-4a5b-87c7-8f50526da3b8", name: "Harvey Specter", role: "Site Foreman", rating: 5.0, rate: 95, skills: ["Leadership", "Commercial", "Zoning"], avatar: "HS", avatarUrl: "/avatars/harvey_specter.png", verified: true },
];

export default function MarketplacePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState("All Roles");
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const { refreshCart, cartItems } = useCart();

    const handleAddToCart = async (worker: any) => {
        setAddingToCart(worker.id);
        try {
            // TODO: Get actual Work Order ID and Dates from user selection
            // For MVP, we are using a specific Work Order created for testing:
            // Project: Test Project 1, Work Order: General Labor (ID: f33bc9fc-0ced-440b-afc9-3983ed32907f)
            const mockPayload = {
                work_order_id: "f33bc9fc-0ced-440b-afc9-3983ed32907f", // Valid Work Order ID from DB
                worker_id: worker.uuid, // Use real UUID from DB
                hourly_rate: worker.rate,
                start_date: new Date().toISOString(),
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            // Real implementation:
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mockPayload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to add to cart");
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            await refreshCart(); // Update global cart count

            toast({
                title: "Added to cart",
                description: `${worker.name} has been added to your cart.`,
                variant: "success",
            });
        } catch (f) {
            toast({
                title: "Error",
                description: f instanceof Error ? f.message : "Could not add to cart",
                variant: "destructive"
            });
        } finally {
            setAddingToCart(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Title Section */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marketplace</h1>
                <p className="text-gray-500">Find and hire top-rated construction professionals.</p>
            </div>

            {/* Search & Filters */}
            <Card className="p-4 shadow-sm border-gray-200">
                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by trade, skill, or keyword..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    {/* Dropdowns Row */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <select className="px-3 py-2.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option>All Trades</option>
                            <option>Electrician</option>
                            <option>Plumber</option>
                        </select>

                        <select className="px-3 py-2.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option>Location</option>
                            <option>Within 10 miles</option>
                            <option>Within 25 miles</option>
                        </select>

                        <select className="px-3 py-2.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option>Availability</option>
                            <option>Available Now</option>
                        </select>

                        <select className="px-3 py-2.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option>Min Rating</option>
                            <option>4.5+</option>
                        </select>

                        <Button className="bg-blue-900 hover:bg-blue-800 text-white w-full h-auto">
                            Search
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {workers.map((worker) => (
                    <Card key={worker.id} className="p-5 shadow-sm border-gray-200 hover:shadow-md transition-shadow relative group">
                        <a href={`/dashboard/worker/${worker.id}`} className="absolute inset-0 z-0"></a>
                        <div className="flex items-start justify-between mb-2 relative z-10 pointer-events-none">
                            <div className="flex items-center space-x-3 pointer-events-auto">
                                <div className="h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm border border-gray-100 overflow-hidden shrink-0">
                                    {worker.avatarUrl ? (
                                        <img src={worker.avatarUrl} alt={worker.name} className="h-full w-full object-cover" />
                                    ) : (
                                        worker.avatar
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center">
                                        <h3 className="font-bold text-gray-900 mr-1 group-hover:text-blue-900 transition-colors">{worker.name}</h3>
                                        {worker.verified && <BadgeCheck size={16} className="text-green-500 fill-green-100" />}
                                    </div>
                                    <p className="text-xs text-gray-500">{worker.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center bg-orange-50 px-2 py-0.5 rounded text-orange-600 font-bold text-xs">
                                <Star size={12} className="fill-current mr-1" />
                                {worker.rating}
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mt-4 mb-6 relative z-10 pointer-events-none">
                            {worker.skills.map(skill => (
                                <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
                                    {skill}
                                </span>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 relative z-10">
                            <div>
                                <span className="text-xl font-bold text-gray-900">${worker.rate}</span>
                                <span className="text-xs text-gray-500">/hr</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-900 border-blue-200 hover:bg-blue-50 relative z-10 cursor-pointer"
                                onClick={() => handleAddToCart(worker)}
                                disabled={addingToCart === worker.id || cartItems.some(item => item.worker_id === worker.uuid)}
                            >
                                {addingToCart === worker.id ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : cartItems.some(item => item.worker_id === worker.uuid) ? (
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
                ))}
            </div>
        </div>
    );
}
