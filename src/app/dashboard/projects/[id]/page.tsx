"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WorkOrderDialog } from "@/components/projects/work-order-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar as CalendarIcon, Clock, ArrowLeft, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import type { Project, WorkOrder } from "@/types";

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            fetchProjectData();
        }
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            // Fetch Project Details (reusing list API for now or specific endpoint if needed. List endpoint filters by ID isn't implemented, so we need to add GET by ID to route or just fetch all and find.
            // Actually, we need a specific GET /api/projects/[id] endpoint.
            // Let's implement that or mock it for now.
            // Wait, I implemented /api/projects for LIST, but not [id].
            // I should have implemented [id].
            // I'll fetch list and filter client side for MVP speed if list is small, OR implement the endpoint.
            // Better to implement endpoint properly. But for now let's try to fetch list and find.

            const resProject = await fetch("/api/projects");
            if (resProject.ok) {
                const projects: Project[] = await resProject.json();
                const found = projects.find(p => p.id === projectId);
                if (found) setProject(found);
            }

            // Fetch Work Orders
            const resWO = await fetch(`/api/projects/${projectId}/work-orders`);
            if (resWO.ok) {
                const data = await resWO.json();
                setWorkOrders(data);
            }

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading project details...</div>;
    if (!project) return <div className="p-8">Project not found.</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild className="-ml-2">
                    <Link href="/dashboard/projects"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Link>
                </Button>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{project.name}</h1>
                        <div className="flex items-center text-muted-foreground spacy-x-4">
                            <div className="flex items-center mr-6">
                                <MapPin className="h-4 w-4 mr-2" />
                                {project.address}
                            </div>
                            <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                {project.timezone}
                            </div>
                        </div>
                    </div>
                    <Badge variant={project.status === 'Active' ? 'default' : 'secondary'} className="text-base px-3 py-1">
                        {project.status}
                    </Badge>
                </div>
            </div>

            <Separator />

            {/* Work Orders Section */}
            <section className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Work Orders</h2>
                        <p className="text-muted-foreground">Labor requirements and shifts for this project.</p>
                    </div>
                    <WorkOrderDialog projectId={projectId} />
                </div>

                <div className="grid gap-4">
                    {workOrders.length === 0 ? (
                        <Card className="bg-gray-50 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <div className="rounded-full bg-white p-3 mb-4 shadow-sm">
                                    <Users className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium mb-1">No Work Orders</h3>
                                <p className="text-muted-foreground mb-4 text-center max-w-sm">
                                    Create a work order to define the roles and shifts needed for this job.
                                </p>
                                <WorkOrderDialog projectId={projectId} />
                            </CardContent>
                        </Card>
                    ) : (
                        workOrders.map((wo) => (
                            <Card key={wo.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{wo.role}</CardTitle>
                                            <CardDescription>
                                                Quantity: <span className="font-semibold text-foreground">{wo.quantity} Workers</span>
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline">{wo.status}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center">
                                            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>
                                                {format(new Date(wo.start_date), "MMM d")} - {format(new Date(wo.end_date), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>{wo.start_time.slice(0, 5)} - {wo.end_time.slice(0, 5)}</span>
                                        </div>
                                        {(wo.hourly_rate_min || wo.hourly_rate_max) && (
                                            <div className="flex items-center">
                                                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>
                                                    {wo.hourly_rate_min ? `$${wo.hourly_rate_min}` : ''}
                                                    {wo.hourly_rate_min && wo.hourly_rate_max ? ' - ' : ''}
                                                    {wo.hourly_rate_max ? `$${wo.hourly_rate_max}` : ''} /hr
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {wo.description && (
                                        <div className="mt-4 pt-4 border-t text-muted-foreground text-sm">
                                            {wo.description}
                                        </div>
                                    )}
                                    <div className="mt-4 flex justify-end">
                                        <Button size="sm" asChild>
                                            <Link href={`/dashboard/search?workOrderId=${wo.id}&projectId=${projectId}`}>
                                                Find Workers
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
