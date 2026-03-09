import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Service-role admin client (bypasses RLS, can invite users)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Authenticate the current user (admin/manager)
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { invites } = body; // Array of { email, firstName, lastName, role }

        if (!Array.isArray(invites) || invites.length === 0) {
            return NextResponse.json({ error: 'Invalid invite payload' }, { status: 400 });
        }

        // Verify current user has permission (Admin or Manager)
        const { data: inviterMember } = await supabase
            .from('company_members')
            .select('company_id, roles')
            .eq('user_id', user.id)
            .eq('status', 'Active')
            .single();

        if (!inviterMember) {
            return NextResponse.json({ error: 'No active company membership found' }, { status: 403 });
        }

        const inviterRoles: string[] = Array.isArray(inviterMember.roles)
            ? (inviterMember.roles as string[])
            : [];
        const canInvite = inviterRoles.some(r => ['Admin', 'Manager', 'company_admin'].includes(r));

        if (!canInvite) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const companyId = inviterMember.company_id;
        const results = [];

        for (const invite of invites) {
            try {
                // Enforce role assignment rules: Managers cannot invite Admins or other Managers
                const isManager = inviterRoles.includes('Manager') && !inviterRoles.includes('Admin');
                if (isManager && ['Admin', 'Manager', 'company_admin'].includes(invite.role)) {
                    results.push({
                        email: invite.email,
                        status: 'failed',
                        error: 'Managers cannot invite other managers or admins',
                    });
                    continue;
                }

                // 1. Invite the user via Supabase Auth Admin (sends email magic link)
                const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
                    invite.email,
                    {
                        data: {
                            first_name: invite.firstName,
                            last_name: invite.lastName,
                            full_name: `${invite.firstName} ${invite.lastName}`.trim(),
                            invited_role: invite.role || 'Worker',
                            company_id: companyId,
                        },
                    }
                );

                if (inviteError) {
                    throw inviteError;
                }

                const newUserId = inviteData.user.id;

                // 2. Create a company_members record with Invited state
                const { error: memberError } = await supabaseAdmin
                    .from('company_members')
                    .insert({
                        user_id: newUserId,
                        company_id: companyId,
                        roles: [invite.role || 'Worker'],
                        status: 'Invited',
                    });

                if (memberError) {
                    console.error('company_members insert error', memberError);
                }

                results.push({ email: invite.email, status: 'success' });
            } catch (err: any) {
                console.error(`Error inviting ${invite.email}:`, err);
                results.push({ email: invite.email, status: 'failed', error: err.message });
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;
        const failedCount = results.filter(r => r.status === 'failed').length;

        return NextResponse.json({
            message: `Successfully invited ${successCount} worker${successCount !== 1 ? 's' : ''}. ${failedCount > 0 ? `${failedCount} failed.` : ''}`.trim(),
            results,
        });
    } catch (error) {
        console.error('Bulk invite error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
