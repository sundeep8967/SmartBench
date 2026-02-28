"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

/**
 * Converts "07:00" or "14:30" to "7:00am" or "2:30pm"
 */
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
    const router = useRouter();

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
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {projects.map((project) => {
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

                                    {project.daily_start_time && (
                                        <div className="px-4 mt-auto">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                                <span>Earliest Start: {formatTime12hr(project.daily_start_time)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="px-4 pb-4 pt-3 mt-auto">
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
                                    <th className="text-left px-4 py-3 font-medium text-gray-500">Project Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500">Address</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Description</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Earliest Start</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.map((project) => {
                                    const [street, cityState] = formatAddress(project.address);
                                    return (
                                        <tr
                                            key={project.id}
                                            className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                        >
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
                                                {project.daily_start_time ? formatTime12hr(project.daily_start_time) : "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                            </td>
                                        </tr>
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
