import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProjectsList } from "@/components/projects/projects-list";
import type { Project } from "@/types";

export default async function ProjectsPage() {
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
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed mt-6 max-w-6xl mx-auto">
                <p className="text-muted-foreground">You must be affiliated with an active company to view projects.</p>
            </div>
        );
    }

    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', member.company_id)
        .order('created_at', { ascending: false });

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                <p className="text-muted-foreground">Manage your job sites and work orders.</p>
            </div>

            <ProjectsList projects={(projects as Project[]) || []} />
        </div>
    );
}
