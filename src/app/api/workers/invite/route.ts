import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWorkerInvite } from '@/lib/services/mail';
import { getCurrentUserRole } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { email, fullName, role = 'Worker' } = await request.json();

        // 1. Auth & RBAC Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get Admin's Company Context
        // (For MVP, we assume single active company. In future, get from header/token)
        const { data: adminMember } = await supabase
            .from('company_members')
            .select('company_id, companies(name)')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .single();

        if (!adminMember) {
            return NextResponse.json({ error: 'Admin is not part of an active company' }, { status: 400 });
        }

        const companyId = adminMember.company_id;

        // Ensure user is Admin or Manager for THIS company
        const userRole = await getCurrentUserRole(user.id, companyId);
        // Note: getCurrentUserRole returns Role[], check if it contains Admin or Manager
        const isAdminOrManager = userRole.includes('Admin') || userRole.includes('Manager');

        if (!isAdminOrManager) {
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }

        // 2. Get Admin's Company Context
        // (For MVP, we assume single active company. In future, get from header/token)
        const { data: adminMember } = await supabase
            .from('company_members')
            .select('company_id, companies(name)')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .single();

        if (!adminMember) {
            return NextResponse.json({ error: 'Admin is not part of an active company' }, { status: 400 });
        }

        const companyId = adminMember.company_id;
        const companyName = adminMember.companies
            ? (Array.isArray(adminMember.companies)
                ? adminMember.companies[0]?.name
                : (adminMember.companies as any).name)
            : 'SmartBench';

        // 3. Invite User Logic
        // We do NOT create a huge amount of logic here. 
        // Strategy: Use Supabase's `inviteUserByEmail` if we want Supabase to handle auth, 
        // OR manually create user record if they don't exist.
        // For Google Auth flow, the user might NOT exist yet.

        // Check if user exists in our public.users table
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        let userId = existingUser?.id;

        if (!userId) {
            // Option: Create a "shadow" user record or just use the email in company_members as a placeholder?
            // Better: We can create a user in `auth.users` via Admin API, but we are using public table.
            // Let's create a record in `public.users` with status 'Invited' if RLS allows, 
            // BUT public.users.id usually links to auth.users.id.

            // To properly link Google Auth later, we rely on email matching.
            // For now, we will create the membership record pending user creation?
            // Actually, we can't create `company_members` without a valid `user_id` (foreign key).

            // WORKAROUND Phase 1: 
            // We need `supabase.auth.admin.inviteUserByEmail(email)` to generate a real `auth.users` record + `public.users` trigger.
            // However, that sends a Supabase magic link.

            // ALTERNATIVE: Just send the email. When they sign up with Google, we match them.
            // To track the invite, we can create an `invitations` table, OR just check email domain.

            // Let's try to see if we can perform a "Soft Invite".
            // Since we can't create `company_members` without `user_id`, we will use `supabase.auth.admin` to create the user INVITE.
            // This is the cleanest way.

            // Note: This requires SERVICE_ROLE_KEY if we want to suppress the default email.
            // For now, let's assume we proceed *without* creating a DB record yet if user doesn't exist,
            // OR we create a "Pending Invites" table.

            // SIMPLIFICATION for MVP:
            // We will just send the email. The link will go to `/register?email=...&companyId=...`.
            // When they register/login with Google, the `onboarding` flow will check "Do I have an invite?".
            // We need a place to store this invite.

            // A `company_invitations` table is best. 
            // Docs say: "User registration creates Company and User records" (Story 1.3).
            // Story 1.4 says "Magic link... sends magic links...".

            // Let's create a `company_invitations` record.
            const { error: inviteError } = await supabase
                .from('company_invitations')
                .insert({
                    company_id: companyId,
                    email,
                    role,
                    status: 'pending',
                    invited_by: user.id
                });

            // If table doesn't exist (it wasn't in schema-identity.md but implied by "Invited" status),
            // we might need to add it or use `company_members` if we can pre-fill user_id.

            // Re-reading `schema-identity.md`:
            // "company_members: user_id UUID NOT NULL REFERENCES users(id)"
            // So we CANNOT use `company_members` for non-existing users.

            // Re-reading `identity_schema_revised` migration step 1011 (from previous turn):
            // It created `company_members`.

            // DECISION: Create `company_invitations` table in a new migration quickly.
        } else {
            // User exists, just add them to company
            await supabase
                .from('company_members')
                .upsert({
                    user_id: userId,
                    company_id: companyId,
                    roles: [role],
                    status: 'Invited'
                });
        }

        // 4. Send Email
        // Construct Invite URL (redirect to Google Login, passing some state?)
        // Or simple: Link to /login?invite=true
        const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?invite_email=${encodeURIComponent(email)}`;

        await sendWorkerInvite({
            email,
            inviteUrl,
            companyName: companyName,
            inviterName: user.user_metadata?.full_name || 'An Admin'
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Invite Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
