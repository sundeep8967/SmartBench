
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWorkerInvite } from '@/lib/services/mail';
import { getCurrentUserRole } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();


        // Normalize input: accepts { emails: string[] } OR { email: string }
        const emails: string[] = body.emails || (body.email ? [body.email] : []);
        const role = body.role || 'Worker'; // Title Case

        if (emails.length === 0) {
            return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
        }

        // 1. Auth & RBAC Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get Admin's Company Context
        const { data: adminMember } = await supabase
            .from('company_members')
            .select('company_id, companies(name)')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .maybeSingle();

        if (!adminMember) {
            return NextResponse.json({ error: 'Admin is not part of an active company' }, { status: 400 });
        }

        const companyId = adminMember.company_id;

        // Handle joined query result type safety
        const companies = adminMember.companies as any;
        const companyName = companies?.name || 'SmartBench';


        // Ensure user is Admin or Manager
        const userRoles = await getCurrentUserRole(user.id, companyId);
        const isAdminOrManager = userRoles.includes('Admin') || userRoles.includes('Manager');

        if (!isAdminOrManager) {
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }

        const results = [];

        // 3. Process each email
        for (const email of emails) {
            try {
                // Check if user exists
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', email)
                    .single();

                if (existingUser) {

                    // User exists: Add to company_members
                    const { error: memberError } = await supabase
                        .from('company_members')
                        .upsert({
                            user_id: existingUser.id,
                            company_id: companyId,
                            roles: [role], // 'Worker'
                            status: 'Invited'
                        }, { onConflict: 'user_id, company_id' }); // Update if exists

                    if (memberError) throw memberError;
                } else {
                    // User does not exist: Add to company_invitations
                    const { error: inviteError } = await supabase
                        .from('company_invitations')
                        .upsert({
                            company_id: companyId,
                            email,
                            role,
                            status: 'pending',
                            invited_by: user.id
                        }, { onConflict: 'company_id, email' });

                    if (inviteError) throw inviteError;
                }

                // 4. Send Email
                const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/login?invite_email=${encodeURIComponent(email)}`;

                await sendWorkerInvite({
                    email,
                    inviteUrl,
                    companyName,
                    inviterName: user.user_metadata?.full_name || 'An Admin'
                });

                results.push({ email, status: 'sent' });

            } catch (innerError: any) {
                console.error(`Failed to invite ${email}:`, innerError);
                results.push({ email, status: 'error', error: innerError.message });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Bulk Invite Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
