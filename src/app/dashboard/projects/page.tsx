"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { Project } from "@/types";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/projects");
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading projects...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">Manage your job sites and work orders.</p>
                </div>
                <CreateProjectDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-semibold truncate pr-2">{project.name}</CardTitle>
                                <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>
                                    {project.status}
                                </Badge>
                            </div>
                            <CardDescription className="flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="truncate">{project.address}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                {project.description || "No description provided."}
                            </div>

                            <div className="flex items-center text-sm">
                                <CalendarIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                                {project.start_date ? (
                                    <span>{format(new Date(project.start_date), "MMM d, yyyy")}</span>
                                ) : (
                                    <span>TBD</span>
                                )}
                                {project.end_date && (
                                    <>
                                        <span className="mx-1">-</span>
                                        <span>{format(new Date(project.end_date), "MMM d, yyyy")}</span>
                                    </>
                                )}
                            </div>

                            <Button variant="outline" className="w-full" asChild>
                                <Link href={`/dashboard/projects/${project.id}`}>
                                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-muted-foreground mb-4">No projects found. Create your first project to get started.</p>
                        <CreateProjectDialog />
                    </div>
                )}
            </div>
        </div>
    );
}
