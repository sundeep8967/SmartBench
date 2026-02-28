import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { success, error, unauthorized } from '@/lib/api/responses'
import { onboardCompany } from '@/lib/services/auth'

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return unauthorized()
    }

    try {
        const { companyName, address, city, state, zipCode, ein, contactPhone, lat, lng } = await req.json()

        const result = await onboardCompany(user.id, {
            companyName,
            address,
            city,
            state,
            zipCode,
            ein,
            contactPhone,
            lat,
            lng,
        })

        return success(result)
    } catch (err: any) {
        console.error('Onboarding step1 error:', err)
        return error(err.message)
    }
}
