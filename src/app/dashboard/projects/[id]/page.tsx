import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { WorkOrderDialog } from "@/components/projects/work-order-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar as CalendarIcon, Clock, ArrowLeft, Users, DollarSign, Navigation2 } from "lucide-react";
import { format } from "date-fns";
import type { Project, WorkOrder } from "@/types";
import { StaticMap } from "@/components/ui/static-map";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) {
        return <div className="p-8">Unauthorized. No active company.</div>;
    }

    // Parallel Fetching
    const [projectRes, workOrdersRes] = await Promise.all([
        supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('company_id', member.company_id)
            .single(),
        supabase
            .from('work_orders')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
    ]);

    const project = projectRes.data as Project | null;
    const workOrders = workOrdersRes.data as WorkOrder[] || [];

    if (!project) {
        return (
            <div className="max-w-6xl mx-auto p-6 space-y-8">
                <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
                    <Link href="/dashboard/projects"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Link>
                </Button>
                <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed">
                    Project not found or you do not have permission to view it.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild className="-ml-2">
                    <Link href="/dashboard/projects"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Link>
                </Button>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{project.name}</h1>
                        <a
                            href={project.lat && project.lng
                                ? `https://www.google.com/maps/search/?api=1&query=${project.lat},${project.lng}`
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-muted-foreground hover:text-blue-600 transition-colors"
                        >
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="underline underline-offset-2 break-words">{project.address}</span>
                        </a>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <EditProjectDialog project={project} />
                        <DeleteProjectButton projectId={projectId} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {project.project_description && (
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Project Description</h4>
                                    <p className="text-sm">{project.project_description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Earliest Start Time</h4>
                                    <p className="text-sm font-medium flex items-center">
                                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                                        {project.daily_start_time ? (() => {
                                            const [h, m] = project.daily_start_time.slice(0, 5).split(":");
                                            let hr = parseInt(h, 10);
                                            const suffix = hr >= 12 ? "pm" : "am";
                                            if (hr === 0) hr = 12;
                                            else if (hr > 12) hr -= 12;
                                            return `${hr}:${m}${suffix}`;
                                        })() : 'Not specified'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Meeting Point</h4>
                                    <p className="text-sm font-medium flex items-center">
                                        <Users className="w-4 h-4 mr-2 text-green-600" />
                                        {project.meeting_location_type || 'Front of House'}
                                    </p>
                                </div>
                            </div>
                            {project.meeting_instructions && (
                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Arrival Instructions</h4>
                                    <p className="text-sm bg-amber-50 text-amber-900 p-3 rounded-md border border-amber-200">
                                        {project.meeting_instructions}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center">
                                <Navigation2 className="w-4 h-4 mr-2" />
                                Site Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3 space-y-2">
                            <div className="aspect-square w-full rounded-md overflow-hidden bg-gray-100 border relative">
                                {project.lat && project.lng ? (
                                    <StaticMap lat={project.lat} lng={project.lng} zoom={18} />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm p-4 text-center">
                                        No coordinates available for this location.
                                    </div>
                                )}
                            </div>
                            {project.lat && project.lng && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${project.lat},${project.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors py-1"
                                >
                                    <MapPin className="h-3.5 w-3.5" />
                                    Open in Google Maps
                                </a>
                            )}
                        </CardContent>
                    </Card>
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
                                    <div className="grid gap-4 text-sm mt-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
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
        </div >
    );
}
