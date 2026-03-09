import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/services/mail'

// ─── Types ──────────────────────────────────────────────────────

interface CreateCompanyParams {
    companyName: string
    address?: string | null
    city?: string | null
    state?: string | null
    zipCode?: string | null
    ein?: string | null
    contactPhone?: string | null
    type?: string | null
    lat?: number | null
    lng?: number | null
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

    // Create an admin client to bypass RLS during onboarding
    // (User is not yet a member, so returning clause would fail)
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { companyName, address, city, state, zipCode, ein, contactPhone, type, lat, lng } = params

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
        // Update existing company (using admin client to be consistent and bypass RLS)
        const { error } = await supabaseAdmin
            .from('companies')
            .update({
                name: companyName,
                address: address ?? null,
                city: city ?? null,
                state: state ?? null,
                zip_code: zipCode ?? null,
                ein: ein ?? null,
                contact_phone: contactPhone ?? null,
                lat: lat ?? null,
                lng: lng ?? null,
            })
            .eq('id', existingMember.company_id)

        if (error) throw new Error(`Failed to update company: ${error.message}`)
        companyId = existingMember.company_id
    } else {
        // Create new company using admin client
        const { data: company, error: companyError } = await supabaseAdmin
            .from('companies')
            .insert({
                name: companyName,
                address: address ?? null,
                city: city ?? null,
                state: state ?? null,
                zip_code: zipCode ?? null,
                ein: ein ?? null,
                contact_phone: contactPhone ?? null,
                kyb_status: 'pending',
                type: type ?? null,
                lat: lat ?? null,
                lng: lng ?? null,
            })
            .select('id')
            .single()

        if (companyError) throw new Error(`Failed to create company: ${companyError.message}`)

        // Link user as admin using admin client
        const { error: memberError } = await supabaseAdmin
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
    // Standard client is used here as it handles the current user's session
    const { error: metadataError } = await supabase.auth.updateUser({
        data: { is_onboarded: true },
    })

    if (metadataError) throw new Error(`Failed to update auth metadata: ${metadataError.message}`)

    // 3. Also update public.users (using admin client)
    const { data: userRow } = await supabaseAdmin
        .from('users')
        .update({ is_onboarded: true })
        .eq('id', userId)
        .select('email, full_name')
        .single()

    // 4. Send welcome email to brand-new signups only
    if (isNew && userRow?.email) {
        const name = userRow.full_name || userRow.email.split('@')[0]
        sendWelcomeEmail(userRow.email, name, params.companyName).catch(() => {
            // Non-fatal: log handled inside sendWelcomeEmail
        })
    }

    return { companyId, isNew }
}
