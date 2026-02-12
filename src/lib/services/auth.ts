import { createClient } from "@/lib/supabase/server";

interface CreateCompanyParams {
    userId: string;
    email: string;
    fullName?: string | null;
    companyName: string;
    ein?: string | null;
    address?: string | null;
    type?: string | null;
}

export async function createCompanyAndAdmin(params: CreateCompanyParams) {
    const supabase = await createClient();
    const { userId, email, fullName, companyName, ein, address, type } = params;

    // 1. Ensure User Record Exists
    let { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

    if (userError?.code === 'PGRST116') {
        const { error: createUserError } = await supabase
            .from('users')
            .insert({
                id: userId,
                email: email,
                full_name: fullName || null,
                user_state: 'Active' // Auto-activate for first user/creator
            });

        if (createUserError) throw new Error(`Failed to create user record: ${createUserError.message}`);
    }

    // 2. Create Company
    const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
            name: companyName,
            ein: ein || null,
            address: address || null,
            kyb_status: 'pending',
            type: type || null,
        })
        .select('id')
        .single();

    if (companyError) throw new Error(`Failed to create company record: ${companyError.message}`);

    const companyId = newCompany.id;

    // 3. Link User as Admin in Company_Members
    const { error: linkError } = await supabase
        .from('company_members')
        .insert({
            user_id: userId,
            company_id: companyId,
            roles: ['Admin'], // Default role for creator
            status: 'Active'
        });

    if (linkError) throw new Error(`Failed to link user to company: ${linkError.message}`);

    return { companyId, userId };
}
