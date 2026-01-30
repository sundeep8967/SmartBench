"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin, BadgeCheck, Star } from "lucide-react";

const workers = [
    { id: 1, name: "Mike Ross", role: "Master Electrician", rating: 4.9, rate: 55, skills: ["Industrial", "High Voltage", "Wiring"], avatar: "MR", verified: true },
    { id: 2, name: "Rachel Zane", role: "Project Manager", rating: 4.8, rate: 75, skills: ["Planning", "Budgeting", "Safety"], avatar: "RZ", verified: true },
    { id: 3, name: "Harvey Specter", role: "Site Foreman", rating: 5.0, rate: 95, skills: ["Leadership", "Commercial", "Zoning"], avatar: "HS", verified: true },
    { id: 4, name: "Donna Paulsen", role: "Interior Specialist", rating: 4.9, rate: 65, skills: ["Finishing", "Design", "Detailing"], avatar: "DP", verified: true },
    { id: 5, name: "Louis Litt", role: "HVAC Technician", rating: 4.7, rate: 60, skills: ["Ventilation", "Heating", "Repairs"], avatar: "LL", verified: true },
    { id: 6, name: "Jessica P.", role: "Senior Architect", rating: 5.0, rate: 120, skills: ["Blueprints", "Modeling", "Surveying"], avatar: "JP", verified: true },
];

export default function MarketplacePage() {
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
                    <Card key={worker.id} className="p-5 shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
                                    {worker.avatar}
                                </div>
                                <div>
                                    <div className="flex items-center">
                                        <h3 className="font-bold text-gray-900 mr-1">{worker.name}</h3>
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
                        <div className="flex flex-wrap gap-2 mt-4 mb-6">
                            {worker.skills.map(skill => (
                                <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium border border-gray-200">
                                    {skill}
                                </span>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div>
                                <span className="text-xl font-bold text-gray-900">${worker.rate}</span>
                                <span className="text-xs text-gray-500">/hr</span>
                            </div>
                            <Button variant="outline" size="sm" className="text-blue-900 border-blue-200 hover:bg-blue-50">
                                Add to Cart
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
