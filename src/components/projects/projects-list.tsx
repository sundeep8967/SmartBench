"use client";

import { useState, useMemo, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ArrowRight, Search, LayoutGrid, List, Download, Upload, Trash2, CheckSquare, Loader2, MoreVertical, MoreHorizontal, Pencil } from "lucide-react";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Project } from "@/types";
import { bulkDeleteProjectsAction, bulkImportProjectsAction } from "@/app/dashboard/projects/actions";
import Papa from "papaparse";

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
    const [viewState, setViewState] = useState<"card" | "table">("card");

    useEffect(() => {
        const saved = localStorage.getItem("smartbench_projects_view") as "card" | "table";
        if (saved) setViewState(saved);
    }, []);

    const setView = (v: "card" | "table") => {
        setViewState(v);
        localStorage.setItem("smartbench_projects_view", v);
    };

    const view = viewState;
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPressTriggered = useRef(false);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [navigatingId, setNavigatingId] = useState<string | null>(null);

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

    useEffect(() => {
        // Auto-exit selection mode if no projects are selected
        if (selectedProjects.size === 0) {
            setSelectionMode(false);
        }
    }, [selectedProjects.size]);

    useEffect(() => {
        const handleExportEvent = () => handleExportCSV();
        const handleImportEvent = () => {
            if (!isImporting) fileInputRef.current?.click();
        };

        window.addEventListener('triggerProjectsExport', handleExportEvent);
        window.addEventListener('triggerProjectsImport', handleImportEvent);

        return () => {
            window.removeEventListener('triggerProjectsExport', handleExportEvent);
            window.removeEventListener('triggerProjectsImport', handleImportEvent);
        };
    }, [filteredProjects, isImporting]);

    const handleSelectAll = () => {
        if (selectedProjects.size === filteredProjects.length) {
            setSelectedProjects(new Set());
            setSelectionMode(false);
        } else {
            setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
            setSelectionMode(true);
        }
    };

    const toggleProjectSelect = (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const newSelected = new Set(selectedProjects);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProjects(newSelected);
    };

    const handlePressStart = (id: string, e: React.MouseEvent | React.TouchEvent) => {
        if (selectionMode) return; // Ignore if already in selection mode

        isLongPressTriggered.current = false;
        pressTimer.current = setTimeout(() => {
            isLongPressTriggered.current = true;
            setSelectionMode(true);
            toggleProjectSelect(id);
            // Vibrate on mobile
            if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }, 500); // 500ms long press
    };

    const handlePressEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
        // Safety timeout to reset the flag in case the click event doesn't fire or is delayed
        setTimeout(() => {
            isLongPressTriggered.current = false;
        }, 300);
    };

    const handleItemClick = (id: string, e: React.MouseEvent) => {
        if (isLongPressTriggered.current) {
            e.preventDefault();
            isLongPressTriggered.current = false;
            return;
        }

        if (selectionMode) {
            e.preventDefault();
            toggleProjectSelect(id, e);
        } else {
            // Ensure we don't navigate if they were just ending a long press
            // The pressEnd will clear the timer, we can safely navigate if selection mode didn't trigger
            setNavigatingId(id);
            startTransition(() => {
                router.push(`/dashboard/projects/${id}`);
            });
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedProjects.size} projects?`)) return;
        setIsDeleting(true);
        try {
            await bulkDeleteProjectsAction(Array.from(selectedProjects));
            setSelectedProjects(new Set());
            setSelectionMode(false);
        } catch (error) {
            console.error("Failed to delete projects", error);
            alert("Failed to delete projects. Make sure you have admin permissions.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExportCSV = () => {
        const dataToExport = filteredProjects.map(p => ({
            Name: p.name,
            Address: p.address,
            Description: p.project_description || "",
            Earliest_Start: p.daily_start_time || "",
            Meeting_Point: p.meeting_location_type || "",
            Instructions: p.meeting_instructions || "",
            Timezone: p.timezone || "America/Chicago"
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "projects_export.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const formattedData = results.data.map((row: any) => ({
                        name: row.Name || row.name,
                        address: row.Address || row.address,
                        project_description: row.Description || row.project_description || null,
                        daily_start_time: row.Earliest_Start || row.daily_start_time || null,
                        meeting_location_type: row.Meeting_Point || row.meeting_location_type || null,
                        meeting_instructions: row.Instructions || row.meeting_instructions || null,
                        timezone: row.Timezone || row.timezone || "America/Chicago",
                        lat: 0,
                        lng: 0, // Should be geocoded ideally
                    })).filter(p => p.name && p.address); // Basic validation

                    if (formattedData.length > 0) {
                        await bulkImportProjectsAction(formattedData);
                        alert(`Successfully imported ${formattedData.length} projects!`);
                    } else {
                        alert("No valid projects found in CSV.");
                    }
                } catch (error) {
                    console.error("Import failed:", error);
                    alert("Failed to import projects.");
                } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
            }
        });
    };

    if (projects.length === 0 && !isImporting) {
        return (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-muted-foreground mb-4">No projects found. Create your first project to get started.</p>
                <div className="flex items-center justify-center space-x-4">
                    <CreateProjectDialog />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Import CSV
                    </button>
                    <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative">
            {/* Unified Filter Bar & Actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex flex-wrap items-stretch bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1 max-w-2xl">
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
                            className={`p-2.5 transition-all duration-200 hover:scale-105 active:scale-95 ${view === "card" ? "text-blue-600 bg-blue-50 rounded-md" : "text-gray-400 hover:text-gray-600"}`}
                            title="Card view"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <div className="w-px bg-gray-200 self-stretch" />
                        <button
                            onClick={() => setView("table")}
                            className={`p-2.5 transition-all duration-200 hover:scale-105 active:scale-95 ${view === "table" ? "text-blue-600 bg-blue-50 rounded-md" : "text-gray-400 hover:text-gray-600"}`}
                            title="Table view"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
            </div>

            {/* Results count & Select All */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                    {searchTerm ? (
                        <span>{filteredProjects.length} of {projects.length} projects</span>
                    ) : (
                        <span>{projects.length} total projects</span>
                    )}
                    {(filteredProjects.length > 0 && selectionMode) && (
                        <button onClick={handleSelectAll} className="flex items-center hover:text-gray-900 focus:outline-none cursor-pointer">
                            <CheckSquare className="h-3 w-3 mr-1" />
                            {selectedProjects.size === filteredProjects.length ? "Deselect All" : "Select All"}
                        </button>
                    )}
                </div>
            </div>

            {view === "card" ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {filteredProjects.map((project) => {
                        const [street, cityState] = formatAddress(project.address);
                        const isSelected = selectedProjects.has(project.id);
                        const isNavigatingThis = isPending && navigatingId === project.id;
                        return (
                            <div
                                key={project.id}
                                onClick={(e) => handleItemClick(project.id, e)}
                                onMouseDown={(e) => handlePressStart(project.id, e)}
                                onMouseUp={handlePressEnd}
                                onMouseLeave={handlePressEnd}
                                onTouchStart={(e) => handlePressStart(project.id, e)}
                                onTouchEnd={handlePressEnd}
                                className="group outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl relative block animate-in fade-in zoom-in-95 duration-300"
                                style={{ animationFillMode: 'both', animationDelay: `${Math.min(filteredProjects.indexOf(project) * 50, 500)}ms` }}
                            >
                                <Card className={`h-full transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col relative overflow-hidden ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-primary/50'} ${isNavigatingThis ? 'opacity-80' : ''}`}>
                                    {isNavigatingThis && (
                                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                        </div>
                                    )}
                                    {/* Action Menu (Top Right) */}
                                    <div className="absolute top-2 right-2 z-30 opacity-0 xl:opacity-0 lg:opacity-100 md:opacity-100 sm:opacity-100 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1.5 rounded-md bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:bg-white text-gray-500 transition-colors">
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                <EditProjectDialog project={project} trigger={
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                } />
                                                <DeleteProjectButton projectId={project.id} trigger={
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 cursor-pointer">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                } />
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    {/* Selection Checkbox */}
                                    {selectionMode && (
                                        <div className="absolute top-3 left-3 z-10 animate-in zoom-in spin-in-12 duration-200">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => { }}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shadow-sm cursor-pointer pointer-events-none transition-transform duration-200 active:scale-90"
                                            />
                                        </div>
                                    )}
                                    <div className={`p-3 pb-2 ${selectionMode ? 'pl-9' : ''} pr-9 flex-grow`}>
                                        <h3 className="text-[15px] font-bold text-blue-700 hover:text-blue-900 transition-colors truncate mb-1">
                                            {project.name}
                                        </h3>
                                        <div className="flex items-start text-[13px] text-gray-500 mb-2">
                                            <MapPin className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0 text-gray-400" />
                                            <div className="leading-[1.5]">
                                                <p className="truncate">{street}</p>
                                                {cityState && (
                                                    <p className="truncate">{cityState}</p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[13px] text-gray-400 line-clamp-1">
                                            {project.project_description || "No description provided."}
                                        </p>
                                    </div>

                                    <div className="px-3 pb-2.5 mt-auto flex flex-wrap gap-1.5">
                                        {project.daily_start_time && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatTime12hr(project.daily_start_time)}
                                            </span>
                                        )}
                                        {project.meeting_location_type && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                {project.meeting_location_type}
                                            </span>
                                        )}
                                    </div>

                                    <div className="px-3 pb-3 pt-1 mt-auto">
                                        <div className="flex items-center justify-center w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium transition-all duration-300 ease-out group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 shadow-sm group-hover:shadow">
                                            View Details <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden relative">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50/50">
                                    <th className="px-4 py-3 w-10 text-center">
                                        {filteredProjects.length > 0 && (
                                            <input
                                                type="checkbox"
                                                checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                                                onChange={handleSelectAll}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shadow-sm cursor-pointer"
                                            />
                                        )}
                                    </th>
                                    <th className="text-left px-2 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Project Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Address</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Description</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Earliest Start</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Meeting Point</th>
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.map((project) => {
                                    const [street, cityState] = formatAddress(project.address);
                                    const isSelected = selectedProjects.has(project.id);
                                    const isNavigatingThis = isPending && navigatingId === project.id;
                                    return (
                                        <tr
                                            key={project.id}
                                            className={`border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors duration-200 animate-in fade-in slide-in-from-left-4 relative ${isSelected ? 'bg-primary/5' : ''}`}
                                            style={{ animationFillMode: 'both', animationDelay: `${Math.min(filteredProjects.indexOf(project) * 30, 300)}ms` }}
                                            onClick={(e) => handleItemClick(project.id, e)}
                                            onMouseDown={(e) => handlePressStart(project.id, e)}
                                            onMouseUp={handlePressEnd}
                                            onMouseLeave={handlePressEnd}
                                            onTouchStart={(e) => handlePressStart(project.id, e)}
                                            onTouchEnd={handlePressEnd}
                                        >
                                            <td className="px-4 py-3 text-center relative" onClick={(e) => e.stopPropagation()}>
                                                {isNavigatingThis && (
                                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-l-lg">
                                                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                                    </div>
                                                )}
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { toggleProjectSelect(project.id); }}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shadow-sm cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-2 py-3">
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
                                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                        <EditProjectDialog project={project} trigger={
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                        } />
                                                        <DeleteProjectButton projectId={project.id} trigger={
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        } />
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Floating Bulk Action Bar */}
            {selectedProjects.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-200 px-6 py-3 flex items-center space-x-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
                    <span className="text-sm font-medium text-gray-700">
                        {selectedProjects.size} selected
                    </span>
                    <div className="h-5 w-px bg-gray-200" />
                    <button
                        onClick={handleBulkDelete}
                        disabled={isDeleting || selectedProjects.size === 0}
                        className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                        onClick={() => setSelectedProjects(new Set())}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
