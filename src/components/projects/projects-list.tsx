"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ArrowRight, Search, MoreHorizontal, LayoutGrid, List } from "lucide-react";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import type { Project } from "@/types";

function formatAddress(address: string): [string, string] {
    const parts = address.split(",").map((s) => s.trim());
    if (parts.length <= 1) return [address, ""];
    const street = parts[0];
    const rest = parts.slice(1).join(", ");
    return [street, rest];
}

function formatTime12hr(time: string): string {
    const [hStr, mStr] = time.slice(0, 5).split(":");
    let h = parseInt(hStr, 10);
    const suffix = h >= 12 ? "pm" : "am";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${mStr}${suffix}`;
}

export function ProjectsList({ projects }: { projects: Project[] }) {
    const [view, setView] = useState<"card" | "table">("card");
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    const filteredProjects = useMemo(() => {
        return projects.filter((p) => {
            return (
                !searchTerm ||
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.project_description || "").toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [projects, searchTerm]);

    if (projects.length === 0) {
        return (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-muted-foreground mb-4">No projects found. Create your first project to get started.</p>
                <CreateProjectDialog />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Unified Filter Bar */}
            <div className="flex flex-wrap items-stretch bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Search */}
                <div className="flex items-center flex-1 min-w-[200px] px-3">
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                    />
                </div>

                {/* Divider */}
                <div className="w-px bg-gray-200 self-stretch" />

                {/* View Toggle */}
                <div className="flex items-center">
                    <button
                        onClick={() => setView("card")}
                        className={`p-2.5 transition-colors ${view === "card" ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`}
                        title="Card view"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <div className="w-px bg-gray-200 self-stretch" />
                    <button
                        onClick={() => setView("table")}
                        className={`p-2.5 transition-colors ${view === "table" ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-600"}`}
                        title="Table view"
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Results count */}
            {searchTerm ? (
                <p className="text-xs text-gray-500">{filteredProjects.length} of {projects.length} projects</p>
            ) : null}

            {view === "card" ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {filteredProjects.map((project) => {
                        const [street, cityState] = formatAddress(project.address);
                        return (
                            <Link
                                href={`/dashboard/projects/${project.id}`}
                                key={project.id}
                                className="group outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                            >
                                <Card className="h-full hover:shadow-md transition-all group-hover:border-primary/50 cursor-pointer flex flex-col">
                                    <div className="p-4 flex-grow">
                                        <h3 className="text-base font-bold text-gray-900 truncate mb-3">
                                            {project.name}
                                        </h3>
                                        <div className="flex items-start text-sm text-gray-500 mb-4">
                                            <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                            <div className="leading-[1.6]">
                                                <p className="truncate">{street}</p>
                                                {cityState && (
                                                    <p className="truncate">{cityState}</p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                            {project.project_description || "No description provided."}
                                        </p>
                                    </div>

                                    <div className="px-4 pb-3 mt-auto flex flex-wrap gap-2">
                                        {project.daily_start_time && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatTime12hr(project.daily_start_time)}
                                            </span>
                                        )}
                                        {project.meeting_location_type && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                {project.meeting_location_type}
                                            </span>
                                        )}
                                    </div>

                                    <div className="px-4 pb-4 pt-1 mt-auto">
                                        <div className="flex items-center justify-center w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium transition-colors group-hover:bg-gray-50 text-gray-900 shadow-sm">
                                            View Details <ArrowRight className="ml-2 h-4 w-4" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50/50">
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Project Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Address</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Description</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Earliest Start</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Meeting Point</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.map((project) => {
                                    const [street, cityState] = formatAddress(project.address);
                                    return (
                                        <tr
                                            key={project.id}
                                            className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-blue-700 hover:text-blue-900">
                                                    {project.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                <div className="leading-tight">
                                                    <p>{street}</p>
                                                    {cityState && <p className="text-xs text-gray-400">{cityState}</p>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 max-w-xs truncate hidden lg:table-cell">
                                                {project.project_description || "—"}
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                {project.daily_start_time ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                        {formatTime12hr(project.daily_start_time)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                {project.meeting_location_type ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        {project.meeting_location_type}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filteredProjects.length === 0 && projects.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>No projects match your search or filters.</p>
                </div>
            )}
        </div>
    );
}
