import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WorkOrderDialog } from "@/components/projects/work-order-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar as CalendarIcon, Clock, ArrowLeft, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import type { Project, WorkOrder } from "@/types";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
    const projectId = params.id;
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

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">{project.name}</h1>
                        <div className="flex items-center text-muted-foreground space-x-4">
                            <div className="flex items-center">
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
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
