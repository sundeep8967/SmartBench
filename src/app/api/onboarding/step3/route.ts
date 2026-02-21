
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { type } = body; // 'solopreneur' | 'company'

        if (type === 'solopreneur') {
            // Find user's company membership
            const { data: member } = await supabase
                .from('company_members')
                .select('id, roles, company_id')
                .eq('user_id', user.id)
                .eq('status', 'Active')
                .maybeSingle();

            if (member) {
                // Auto-assign roles for Solopreneur: ['admin', 'supervisor', 'worker']
                // Currently they likely have ['admin'] from Step 1.
                // We add 'supervisor' and 'worker'.

                // Fetch current roles first to avoid duplicates, or just set strictly.
                // Step 1 set 'admin'.

                const newRoles = ['admin', 'supervisor', 'worker'];

                const { error: updateError } = await supabase
                    .from('company_members')
                    .update({ roles: newRoles })
                    .eq('id', member.id);

                if (updateError) {
                    console.error("Role update error:", updateError);
                    return NextResponse.json({ error: updateError.message }, { status: 500 });
                }
            }
        }

        // If 'company', we don't strictly need to do anything else here role-wise yet.
        // Step 4 will handle invites.

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
