
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use service role key to bypass RLS and see everything
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUser() {
    console.log('Checking status for sundeep8967@gmail.com...');

    // 1. Get User ID from Auth (if possible via admin, or just search public users if synced)
    // We'll search company_invitations first as that's what we know.
    const { data: invites } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('email', 'sundeep8967@gmail.com');

    console.log('Invites found:', invites);

    // 2. Search company_members for this email (if we joined users table)
    // Since we don't have email in company_members, we need to find the user_id from auth or public users.
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'sundeep8967@gmail.com');

    console.log('Public Users found:', users);

    if (users && users.length > 0) {
        const userId = users[0].id;
        const { data: members } = await supabase
            .from('company_members')
            .select('*, companies(name)')
            .eq('user_id', userId);

        console.log('Company Memberships:', members);
    }
}

checkUser();
