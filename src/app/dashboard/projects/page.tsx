"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Folder,
    Users,
    DollarSign,
    MapPin,
    Search,
    Plus,
    Clock,
    AlertTriangle
} from "lucide-react";

// Mock Data matching Projects.png
const projects = [
    {
        id: 1,
        title: "Lakeside Remodel",
        address: "124 Lakeview Dr, Austin, TX",
        status: "Active",
        workersCount: 5,
        crewName: "Full Crew On-site",
        avatars: ["/avatars/mike_ross.png", "/avatars/rachel_zane.png", "/avatars/harvey_specter.png"],
        extraAvatars: 2,
        progress: 30,
        budgetUsed: 15,
        budgetTotal: 50,
        latestUpdate: "2 workers clocked in today",
        isBudgetAlert: false
    },
    {
        id: 2,
        title: "Downtown Office Lofts",
        address: "404 Market St, San Francisco, CA",
        status: "Active",
        workersCount: 7,
        crewName: "HVAC Crew",
        avatars: ["/avatars/donna_paulsen.png", "/avatars/louis_litt.png"],
        extraAvatars: 5,
        progress: 65,
        budgetUsed: 125,
        budgetTotal: 140,
        latestUpdate: "Inspection passed for Level 2 framing",
        isBudgetAlert: true
    }
];

export default function ProjectsPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <span>Dashboard</span>
                        <span className="text-gray-300">›</span>
                        <span>Projects</span>
                        <span className="text-gray-300">›</span>
                        <span className="bg-gray-100 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">Active</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Active Projects</h1>
                    <p className="text-gray-500 mt-1">Manage ongoing construction sites and resource allocation.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                        />
                    </div>
                    <Button className="bg-[#1e3a8a] hover:bg-blue-900 text-white shadow-md font-medium">
                        <Plus size={18} className="mr-2" />
                        Create New Project
                    </Button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm border border-gray-100 p-1">
                    <CardContent className="p-6 flex items-start space-x-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Folder size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Projects</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">4</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-gray-100 p-1">
                    <CardContent className="p-6 flex items-start space-x-4">
                        <div className="p-3 bg-orange-50 text-orange-500 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Workforce</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">12 <span className="text-lg font-medium text-gray-400">Workers</span></p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border border-gray-100 p-1">
                    <CardContent className="p-6 flex items-start space-x-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Monthly Spend</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">$12,400</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Project List */}
            <div className="space-y-6">
                {projects.map((project) => (
                    <Card key={project.id} className="shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            {/* Card Header: Title & Status */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{project.title}</h3>
                                    <div className="flex items-center text-gray-500 text-sm mt-1">
                                        <MapPin size={14} className="mr-1" />
                                        {project.address}
                                    </div>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                    {project.status}
                                </span>
                            </div>

                            {/* Card Content: Workers & Progress */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                {/* Workers Section */}
                                <div className="flex items-center space-x-4">
                                    <div className="flex -space-x-3">
                                        {project.avatars.map((avatar, index) => (
                                            <div key={index} className="h-10 w-10 rounded-full ring-2 ring-white bg-gray-200 overflow-hidden">
                                                <img src={avatar} alt="Worker" className="h-full w-full object-cover" />
                                            </div>
                                        ))}
                                        <div className="h-10 w-10 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                            +{project.extraAvatars}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{project.workersCount} Active Workers</p>
                                        <p className="text-xs text-gray-500">{project.crewName}</p>
                                    </div>
                                </div>

                                {/* Progress Section */}
                                <div className="flex-1 w-full max-w-md">
                                    <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                                        <span>Timeline Progress</span>
                                        <span className="text-orange-500 font-bold">{project.progress}%</span>
                                    </div>
                                    {/* Enforcing height and width on parent container */}
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 relative overflow-hidden">
                                        <div
                                            className="bg-orange-500 h-2.5 rounded-full absolute top-0 left-0"
                                            style={{ width: `${project.progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-end items-center text-xs">
                                        {project.isBudgetAlert && (
                                            <AlertTriangle size={12} className="text-yellow-500 mr-1" />
                                        )}
                                        <span className={`${project.isBudgetAlert ? "text-yellow-600 font-bold" : "text-gray-500"}`}>
                                            {project.isBudgetAlert && "Budget Alert: "} ${project.budgetUsed}k / ${project.budgetTotal}k used
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="bg-gray-50/50 px-6 py-3 border-t border-gray-100 flex items-center text-xs text-gray-500 font-medium">
                            <Clock size={14} className="mr-2 text-blue-500" />
                            <span className="text-blue-900 font-bold mr-1">Latest:</span>
                            {project.latestUpdate}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
