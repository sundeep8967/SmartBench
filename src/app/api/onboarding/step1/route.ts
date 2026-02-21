
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

        // 1. Create Company
        // Note: For MVP we assume 1 user = 1 company creation flow right now.
        // We need to insert into `companies`.

        // First, check if user already has a company (resume flow).
        // For simplicity, we'll assume new creation or update if partial.

        // Actually, we need to create the company and link the user as Admin.

        // Transaction not easily possible via Supabase Client without RPC, doing sequential.

        const { data: company, error: companyError } = await supabase
            .from('companies')
            .insert({
                name: companyName,
                address: address,
                ein: ein
            })
            .select()
            .single();

        if (companyError) {
            // Handle case where column might be missing
            console.error("Company creation error:", companyError);
            return NextResponse.json({ error: companyError.message }, { status: 500 });
        }

        // 2. Link User as Admin
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
