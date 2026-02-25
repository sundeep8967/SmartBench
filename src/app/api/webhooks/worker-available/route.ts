import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSavedSearchAlertEmail } from "@/lib/services/mail";

// Force dynamic since webhooks are POST requests
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate the Webhook request
        const authHeader = request.headers.get("authorization");
        const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

        // Note: Supabase sends webhooks with a Bearer token or custom header based on your configuration.
        // We assume it's sent as a Bearer token matching SUPABASE_WEBHOOK_SECRET for security.
        if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await request.json();

        // 2. Validate payload structure (expecting INSERT or UPDATE on worker_profiles)
        if (!payload || !payload.record || !payload.record.user_id) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const workerRecord = payload.record;

        // 3. Initialize Supabase Admin Client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch worker's full name for the email
        const { data: userRecord } = await supabaseAdmin
            .from('users')
            .select('full_name')
            .eq('id', workerRecord.user_id)
            .single();

        const workerName = userRecord?.full_name?.toLowerCase() || "";
        const workerTrade = (workerRecord.trade || "").toLowerCase();
        const workerSkills = Array.isArray(workerRecord.skills)
            ? workerRecord.skills.map((s: string) => s.toLowerCase()).join(" ")
            : "";

        // 4. Fetch active Instant Alert searches
        const { data: searches, error: searchError } = await supabaseAdmin
            .from("saved_searches")
            .select("*")
            .eq("is_active", true)
            .eq("alert_preference", "Instant");

        if (searchError) throw searchError;

        if (!searches || searches.length === 0) {
            return NextResponse.json({ message: "No instant searches active." });
        }

        let totalEmailsSent = 0;

        // 5. Check which searches match this new/updated worker
        for (const search of searches) {
            const criteria = search.search_criteria || {};

            // Check Trade mismatch
            if (criteria.trade && criteria.trade !== "All") {
                if (workerTrade !== criteria.trade.toLowerCase()) {
                    continue; // Skip, trade doesn't match
                }
            }

            // Check Query Name/Keyword mismatch
            const queryText = criteria.searchTerm?.toLowerCase();
            if (queryText) {
                const matchesKeyword = workerName.includes(queryText) ||
                    workerTrade.includes(queryText) ||
                    workerSkills.includes(queryText);
                if (!matchesKeyword) {
                    continue; // Skip, keyword doesn't match
                }
            }

            // If we reach here, it's a match! Send the Instant email
            const { data: members } = await supabaseAdmin
                .from('company_members')
                .select('user:users!inner(email)')
                .eq('company_id', search.borrower_company_id);

            if (members && members.length > 0) {
                const uniqueEmails = Array.from(new Set(members.map((m: any) => m.user?.email).filter(Boolean)));
                for (const email of uniqueEmails) {
                    // Send strictly defined Instant Alert
                    await sendSavedSearchAlertEmail(email as string, search.name, 1, false);
                    totalEmailsSent++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            matchedSearchesCount: totalEmailsSent
        });

    } catch (error: any) {
        console.error("Webhook Job Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
