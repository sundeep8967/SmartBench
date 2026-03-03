import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { workerId, minimum_shift_length_hours } = body;

        if (!workerId || minimum_shift_length_hours === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify the current user belongs to a company that this worker also belongs to
        const { data: companyMember } = await supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .maybeSingle();

        if (!companyMember) {
            return NextResponse.json({ error: "No active company found for user" }, { status: 403 });
        }

        const { data: workerMember } = await supabase
            .from('company_members')
            .select('id')
            .eq('user_id', workerId)
            .eq('company_id', companyMember.company_id)
            .maybeSingle();

        if (!workerMember) {
            return NextResponse.json({ error: "Worker does not belong to your company" }, { status: 403 });
        }

        // Upsert worker availability
        const { error: availabilityError } = await supabase
            .from('worker_availability')
            .upsert({
                worker_id: workerId,
                company_id: companyMember.company_id,
                availability_mode: 'active',
                is_active: true,
                minimum_shift_length_hours: minimum_shift_length_hours
            }, {
                onConflict: 'worker_id,company_id'
            });

        if (availabilityError) {
            console.error("Error upserting worker availability:", availabilityError);
            return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Listing error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
