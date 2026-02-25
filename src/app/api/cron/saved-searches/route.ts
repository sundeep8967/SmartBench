import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSavedSearchAlertEmail } from "@/lib/services/mail";

// Force edge or node, node is fine
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // 1. Authenticate the Cron request
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.VERCEL_CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Missing Supabase env vars for Cron");
        return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 3. Fetch active Daily_Digest searches
        const { data: searches, error: searchError } = await supabaseAdmin
            .from("saved_searches")
            .select("*")
            .eq("is_active", true)
            .eq("alert_preference", "Daily_Digest");

        if (searchError) throw searchError;
        if (!searches || searches.length === 0) {
            return NextResponse.json({ message: "No daily searches found." });
        }

        let totalEmailsSent = 0;

        // 4. Process each search
        for (const search of searches) {
            const lastChecked = search.last_checked_at || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            // Query for workers created/updated since last check
            let profilesQuery = supabaseAdmin
                .from('worker_profiles')
                .select(`
                    id,
                    user_id,
                    trade,
                    skills,
                    created_at,
                    updated_at,
                    user:users!inner(full_name)
                `)
                .gte('updated_at', lastChecked); // Assuming we care about ones updated since last check

            // Apply trade filter if exists
            if (search.search_criteria?.trade && search.search_criteria.trade !== "All") {
                profilesQuery = profilesQuery.ilike('trade', `%${search.search_criteria.trade}%`);
            }

            const { data: workers, error: workerError } = await profilesQuery;

            if (workerError) {
                console.error(`Error fetching workers for search ${search.id}:`, workerError);
                continue;
            }

            // Filter by search query text in memory (similar to the view route)
            const queryText = search.search_criteria?.searchTerm?.toLowerCase();
            let matchedWorkers = workers || [];

            if (queryText) {
                matchedWorkers = matchedWorkers.filter((w: any) => {
                    const name = (w.user?.full_name || "").toLowerCase();
                    const workerTrade = (w.trade || "").toLowerCase();
                    const skills = Array.isArray(w.skills)
                        ? w.skills.map((s: string) => s.toLowerCase()).join(" ")
                        : "";
                    return name.includes(queryText) || workerTrade.includes(queryText) || skills.includes(queryText);
                });
            }

            // If we found matches, send email
            if (matchedWorkers.length > 0) {
                // Get company members (Admin) to send the email to
                const { data: members } = await supabaseAdmin
                    .from('company_members')
                    .select('user:users!inner(email)')
                    .eq('company_id', search.borrower_company_id);

                if (members && members.length > 0) {
                    // Send to all members of the company for now (or just admins if we add role filter later)
                    const uniqueEmails = Array.from(new Set(members.map((m: any) => m.user?.email).filter(Boolean)));

                    for (const email of uniqueEmails) {
                        await sendSavedSearchAlertEmail(email as string, search.name, matchedWorkers.length, true);
                        totalEmailsSent++;
                    }
                }
            }

            // 5. Update last_checked_at
            await supabaseAdmin
                .from("saved_searches")
                .update({ last_checked_at: new Date().toISOString() })
                .eq("id", search.id);
        }

        return NextResponse.json({
            success: true,
            processedSearches: searches.length,
            emailsSent: totalEmailsSent
        });

    } catch (error: any) {
        console.error("Cron Job Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
