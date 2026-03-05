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
        const { workerId, minimum_shift_length_hours, hourly_rate } = body;

        if (!workerId || minimum_shift_length_hours === undefined || hourly_rate === undefined) {
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

        // Check if user state is Profile_Complete
        const { data: workerUser } = await supabase
            .from('users')
            .select('user_state')
            .eq('id', workerId)
            .single();

        if (!workerUser || workerUser.user_state !== 'Profile_Complete') {
            return NextResponse.json({ error: `Worker profile must be complete before listing. Current status: ${workerUser?.user_state || 'Unknown'}.` }, { status: 400 });
        }

        // Check if company has active GL and WC insurance
        const { data: policies } = await supabase
            .from('insurance_policies')
            .select('insurance_type, expiration_date')
            .eq('company_id', companyMember.company_id)
            .eq('is_active', true);

        const now = new Date();
        const hasValidGL = policies?.some(p => p.insurance_type === 'General Liability' && new Date(p.expiration_date) > now);
        const hasValidWC = policies?.some(p => p.insurance_type === 'Workers Compensation' && new Date(p.expiration_date) > now);

        if (!hasValidGL || !hasValidWC) {
            return NextResponse.json({ error: "Cannot list worker. Lender company must have valid, active General Liability and Workers Compensation insurance." }, { status: 403 });
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

        // Upsert worker rate
        const { error: rateError } = await supabase
            .from('worker_rates')
            .upsert({
                worker_id: workerId,
                company_id: companyMember.company_id,
                hourly_rate: hourly_rate
            }, {
                onConflict: 'worker_id,company_id'
            });

        if (rateError) {
            console.error("Error upserting worker rate:", rateError);
            return NextResponse.json({ error: "Failed to save lending rate" }, { status: 500 });
        }

        // Update user state to Listed
        const { error: userStateError } = await supabase
            .from('users')
            .update({ user_state: 'Listed' })
            .eq('id', workerId);

        if (userStateError) {
            console.error("Error updating user state:", userStateError);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Listing error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { workerId } = body;

        if (!workerId) {
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

        // Update worker availability to inactive
        const { error: availabilityError } = await supabase
            .from('worker_availability')
            .update({ is_active: false })
            .eq('worker_id', workerId)
            .eq('company_id', companyMember.company_id);

        if (availabilityError) {
            console.error("Error unlisting worker availability:", availabilityError);
            return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
        }

        // Revert user state back to Profile_Complete
        const { error: userStateError } = await supabase
            .from('users')
            .update({ user_state: 'Profile_Complete' })
            .eq('id', workerId);

        if (userStateError) {
            console.error("Error reverting user state:", userStateError);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Unlisting error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
