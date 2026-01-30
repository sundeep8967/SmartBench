"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock worker data
const workers = [
    {
        id: 1,
        name: "Mike Ross",
        role: "Master Electrician",
        rating: 4.8,
        rate: 55,
        skills: ["Industrial", "High Voltage", "Wiring"],
        avatar: "MR",
        verified: true,
    },
    {
        id: 2,
        name: "Rachel Zane",
        role: "Project Manager",
        rating: 4.8,
        rate: 75,
        skills: ["Planning", "Budgeting", "Safety"],
        avatar: "RZ",
        verified: true,
    },
    {
        id: 3,
        name: "Harvey Specter",
        role: "Site Foreman",
        rating: 5.0,
        rate: 95,
        skills: ["Leadership", "Commercial", "Zoning"],
        avatar: "HS",
        verified: true,
    },
    {
        id: 4,
        name: "Donna Paulsen",
        role: "Interior Specialist",
        rating: 4.8,
        rate: 65,
        skills: ["Finishing", "Design", "Detailing"],
        avatar: "DP",
        verified: true,
    },
    {
        id: 5,
        name: "Louis Litt",
        role: "HVAC Technician",
        rating: 4.7,
        rate: 60,
        skills: ["Ventilation", "Heating", "Repairs"],
        avatar: "LL",
        verified: true,
    },
    {
        id: 6,
        name: "Jessica P.",
        role: "Senior Architect",
        rating: 5.0,
        rate: 120,
        skills: ["Blueprints", "Modeling", "Surveying"],
        avatar: "JP",
        verified: true,
    },
];

export default function MarketplacePage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-gray-500 mb-1">
                        Marketplace → Search
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
                    <p className="text-gray-500">Find and hire top-rated construction professionals.</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline">☆ Saved Searches</Button>
                    <Button>🛒 View Cart</Button>
                </div>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by trade, skill, or keyword..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm">
                            <option>All Trades</option>
                            <option>Electrician</option>
                            <option>Plumber</option>
                            <option>HVAC</option>
                        </select>
                        <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm">
                            <option>Location</option>
                            <option>Within 10 miles</option>
                            <option>Within 25 miles</option>
                            <option>Within 50 miles</option>
                        </select>
                        <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm">
                            <option>Availability</option>
                            <option>Available Now</option>
                            <option>This Week</option>
                            <option>Next Week</option>
                        </select>
                        <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm">
                            <option>Min Rating</option>
                            <option>4.0+</option>
                            <option>4.5+</option>
                            <option>5.0</option>
                        </select>
                        <Button>Search</Button>
                    </div>
                </div>
            </Card>

            {/* Worker Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workers.map((worker) => (
                    <Card key={worker.id} className="p-4">
                        <div className="flex items-start space-x-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {worker.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <h3 className="font-semibold text-gray-900 truncate">{worker.name}</h3>
                                    {worker.verified && (
                                        <span className="text-green-500 text-sm">✓</span>
                                    )}
                                    <span className="ml-auto flex items-center text-sm text-yellow-500">
                                        ★ {worker.rating}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">{worker.role}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {worker.skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                            <div>
                                <span className="text-xl font-bold text-gray-900">${worker.rate}</span>
                                <span className="text-sm text-gray-500">/hr</span>
                            </div>
                            <Button variant="outline" size="sm">Add to Cart</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
