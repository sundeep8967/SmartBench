
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Find user's company
        const { data: member } = await supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('status', 'active') // Assuming active
            .single();

        if (!member) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Mock Update: Set some verification flag or just acknowledge step completion
        // Real impl would check Stripe session status.
        // For now, we assume "Verified" if this endpoint is called in Dev.

        // We might want to store 'kyb_verified' on companies?
        // Schema checks: 'companies' doesn't have explicit 'kyb_status' column in schema-identity.md.
        // It has 'tax_exempt_status'.
        // We'll increment onboarding step or just return success.
        // Since we track session in `onboarding_sessions`, we might update that if implemented.
        // But simplified flow: Client navigates. Database persists implicit state via "completed fields".

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
