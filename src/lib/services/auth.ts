import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────────

interface CreateCompanyParams {
    companyName: string
    address?: string | null
    ein?: string | null
    contactPhone?: string | null
    type?: string | null
}

interface OnboardCompanyResult {
    companyId: string
    isNew: boolean
}

// ─── Company Onboarding ─────────────────────────────────────────

/**
 * Creates a company and links the user as admin, OR updates
 * the existing company if the user already has one (retry/resume).
 *
 * Also marks the user as onboarded in both auth metadata and public.users.
 */
export async function onboardCompany(
    userId: string,
    params: CreateCompanyParams
): Promise<OnboardCompanyResult> {
    const supabase = await createClient()
    const { companyName, address, ein, contactPhone, type } = params

    // 1. Check for existing membership (retry/resume flow)
    const { data: existingMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', userId)
        .eq('status', 'Active')
        .maybeSingle()

    let companyId: string
    let isNew = false

    if (existingMember) {
        // Update existing company
        const { error } = await supabase
            .from('companies')
            .update({
                name: companyName,
                address: address ?? null,
                ein: ein ?? null,
                contact_phone: contactPhone ?? null,
            })
            .eq('id', existingMember.company_id)

        if (error) throw new Error(`Failed to update company: ${error.message}`)
        companyId = existingMember.company_id
    } else {
        // Create new company
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .insert({
                name: companyName,
                address: address ?? null,
                ein: ein ?? null,
                contact_phone: contactPhone ?? null,
                kyb_status: 'pending',
                type: type ?? null,
            })
            .select('id')
            .single()

        if (companyError) throw new Error(`Failed to create company: ${companyError.message}`)

        // Link user as admin
        const { error: memberError } = await supabase
            .from('company_members')
            .insert({
                company_id: company.id,
                user_id: userId,
                roles: ['admin'],
                status: 'Active',
            })

        if (memberError) throw new Error(`Failed to link user to company: ${memberError.message}`)

        companyId = company.id
        isNew = true
    }

    // 2. Mark onboarding complete in auth metadata (baked into JWT)
    const { error: metadataError } = await supabase.auth.updateUser({
        data: { is_onboarded: true },
    })

    if (metadataError) throw new Error(`Failed to update auth metadata: ${metadataError.message}`)

    // 3. Also update public.users (for DB queries that don't read JWT)
    await supabase
        .from('users')
        .update({ is_onboarded: true })
        .eq('id', userId)

    return { companyId, isNew }
}
