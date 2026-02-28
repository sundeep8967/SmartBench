"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { ViewToggle } from "@/components/ui/view-toggle";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import type { Project } from "@/types";

/**
 * Splits a single-line address into street + city/state/zip.
 * e.g. "123 Main St, Austin, TX 78701" → ["123 Main St", "Austin, TX 78701"]
 */
function formatAddress(address: string): [string, string] {
    const parts = address.split(",").map((s) => s.trim());
    if (parts.length <= 1) return [address, ""];
    const street = parts[0];
    const rest = parts.slice(1).join(", ");
    return [street, rest];
}

export function ProjectsList({ projects }: { projects: Project[] }) {
    const [view, setView] = useState<"card" | "table">("card");

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
            {/* View toggle */}
            <div className="flex justify-end">
                <ViewToggle view={view} onChange={setView} />
            </div>

            {view === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => {
                        const [street, cityState] = formatAddress(project.address);
                        return (
                            <Link
                                href={`/dashboard/projects/${project.id}`}
                                key={project.id}
                                className="group outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                            >
                                <Card className="h-full hover:shadow-md transition-all group-hover:border-primary/50 cursor-pointer flex flex-col">
                                    <div className="p-[25px] flex-grow">
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

                                    {project.daily_start_time && (
                                        <div className="px-[25px] pb-[25px] mt-auto">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                                <span>Starts at {project.daily_start_time.slice(0, 5)}</span>
                                            </div>
                                        </div>
                                    )}
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
                                    <th className="text-left px-4 py-3 font-medium text-gray-500">Project Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500">Address</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Description</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Start Time</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project) => {
                                    const [street, cityState] = formatAddress(project.address);
                                    return (
                                        <Link
                                            href={`/dashboard/projects/${project.id}`}
                                            key={project.id}
                                            className="contents"
                                        >
                                            <tr className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900">{project.name}</td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    <div className="leading-tight">
                                                        <p>{street}</p>
                                                        {cityState && <p className="text-xs text-gray-400">{cityState}</p>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 max-w-xs truncate hidden md:table-cell">
                                                    {project.project_description || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                                                    {project.daily_start_time?.slice(0, 5) || "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <ArrowRight className="h-4 w-4 text-gray-400" />
                                                </td>
                                            </tr>
                                        </Link>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
