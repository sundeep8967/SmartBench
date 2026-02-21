import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { companyName, address, ein, contactPhone } = body;

        // Check if user already has an active company membership (resume/retry flow)
        const { data: existingMember } = await supabase
            .from('company_members')
            .select('company_id')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .maybeSingle(); // Use maybeSingle to avoid 406 when no rows

        if (existingMember) {
            // User already has a company — update it instead of creating a duplicate
            const { error: updateError } = await supabase
                .from('companies')
                .update({
                    name: companyName,
                    address: address,
                    ein: ein,
                    contact_phone: contactPhone
                })
                .eq('id', existingMember.company_id);

            if (updateError) {
                console.error("Company update error:", updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, companyId: existingMember.company_id });
        }

        // New user — create company and link membership
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .insert({
                name: companyName,
                address: address,
                ein: ein,
                contact_phone: contactPhone
            })
            .select()
            .single();

        if (companyError) {
            console.error("Company creation error:", companyError);
            return NextResponse.json({ error: companyError.message }, { status: 500 });
        }

        const { error: memberError } = await supabase
            .from('company_members')
            .insert({
                company_id: company.id,
                user_id: user.id,
                roles: ['admin'],
                status: 'Active'
            });

        if (memberError) {
            console.error("Member linking error:", memberError);
            return NextResponse.json({ error: memberError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, companyId: company.id });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
