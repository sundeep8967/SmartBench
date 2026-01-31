"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Bookmark,
    Search,
    Clock,
    MoreHorizontal,
    Play,
    Edit2,
    Trash2
} from "lucide-react";

// Mock Saved Searches Data
const savedSearches = [
    {
        id: 1,
        name: "Available Electricians (Austin)",
        criteria: "Role: Electrician • Location: Austin, TX • Status: Bench",
        lastRun: "2 hours ago",
        resultsCount: 12,
        type: "Roster"
    },
    {
        id: 2,
        name: "High Value Projects (> $100k)",
        criteria: "Budget: > $100,000 • Status: Active",
        lastRun: "Yesterday",
        resultsCount: 3,
        type: "Projects"
    },
    {
        id: 3,
        name: "Pending Compliance Reviews",
        criteria: "Compliance: Pendant • Role: All",
        lastRun: "3 days ago",
        resultsCount: 5,
        type: "Roster"
    },
    {
        id: 4,
        name: "San Francisco HVAC Crew",
        criteria: "Role: HVAC • Location: San Francisco, CA • Status: Deployed",
        lastRun: "1 week ago",
        resultsCount: 8,
        type: "Roster"
    }
];

export default function SavedSearchesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="text-sm text-gray-500 mb-1">System → Saved Searches</div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Saved Searches</h1>
                    <p className="text-gray-500 mt-1">Quickly access your frequently used filters and queries.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Filter saved searches..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* Searches List */}
            <div className="grid gap-4">
                {savedSearches.map((search) => (
                    <Card key={search.id} className="shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-start space-x-4 flex-1">
                                <div className={`p-3 rounded-lg ${search.type === "Roster" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                                    }`}>
                                    <Bookmark size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        {search.name}
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                                            {search.type}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">{search.criteria}</p>
                                    <div className="flex items-center text-xs text-gray-400 mt-2 space-x-4">
                                        <span className="flex items-center">
                                            <Clock size={12} className="mr-1" /> Last run: {search.lastRun}
                                        </span>
                                        <span className="font-medium text-gray-500">
                                            {search.resultsCount} matches found
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                                <Button size="sm" className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm">
                                    <Play size={14} className="mr-2 text-green-600" /> Run Search
                                </Button>
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-400 hover:text-blue-600">
                                    <Edit2 size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-400 hover:text-red-600">
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
