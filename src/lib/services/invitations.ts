import { createClient } from '@/lib/supabase/server';

export async function acceptInvite(userId: string, email: string) {
    const supabase = await createClient();

    // 1. Check for pending invitations for this email
    const { data: invitations, error } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

    if (error || !invitations || invitations.length === 0) {
        return; // No pending invites
    }

    // 2. Accept invites
    for (const invite of invitations) {
        // a. Add to company_members
        const { error: memberError } = await supabase
            .from('company_members')
            .upsert({
                user_id: userId,
                company_id: invite.company_id,
                roles: [invite.role], // Role from invite
                status: 'Active' // Auto-activate upon acceptance
            }, { onConflict: 'user_id, company_id' });

        if (memberError) {
            console.error(`Failed to add user ${userId} to company ${invite.company_id}`, memberError);
            continue;
        }

        // b. Mark invite as accepted
        await supabase
            .from('company_invitations')
            .update({ status: 'accepted' })
            .eq('id', invite.id);

        console.log(`User ${userId} accepted invite ${invite.id} for company ${invite.company_id}`);
    }
}
