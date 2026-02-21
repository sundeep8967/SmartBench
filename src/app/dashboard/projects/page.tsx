import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { Project } from "@/types";

export default async function ProjectsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user's company
    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('status', 'Active')
        .single();

    if (!member) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed mt-6 max-w-6xl mx-auto">
                <p className="text-muted-foreground">You must be affiliated with an active company to view projects.</p>
            </div>
        );
    }

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', member.company_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching projects:", error);
    }

    const projectList: Project[] = projects || [];

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
                {projectList.map((project) => (
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

                {projectList.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-muted-foreground mb-4">No projects found. Create your first project to get started.</p>
                        <CreateProjectDialog />
                    </div>
                )}
            </div>
        </div>
    );
}
