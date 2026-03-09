import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Verify Super Admin Access
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split(" ")[1];
        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: superAdminCheck } = await supabaseAdmin
            .from("super_admins")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!superAdminCheck) {
            return NextResponse.json({ error: "Forbidden - Super Admin required" }, { status: 403 });
        }

        // 2. Fetch all Disputed time entries
        // We'll join booking -> borrower company & lender company
        // and user -> worker name
        const { data: disputes, error } = await supabaseAdmin
            .from("time_entries")
            .select(`
                id,
                booking_id,
                status,
                clock_in,
                clock_out,
                bookings!inner (
                    id,
                    borrower_company_id,
                    companies!bookings_borrower_company_id_fkey (
                        name
                    )
                ),
                users!inner (
                    full_name,
                    company_members!inner (
                        companies!inner (
                            name
                        )
                    )
                )
            `)
            .eq("status", "Disputed")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[Super Admin Disputes] DB Error:", error);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        // 3. Format payload
        const formattedDisputes = (disputes || []).map((d: any) => ({
            timeEntryId: d.id,
            bookingId: d.booking_id,
            workerName: d.users.full_name,
            lenderCompanyName: d.users.company_members?.[0]?.companies?.name || "Unknown Lender",
            borrowerCompanyName: d.bookings.companies?.name || "Unknown Borrower",
            shiftDate: d.clock_in,
            status: d.status
        }));

        return NextResponse.json({ disputes: formattedDisputes });

    } catch (e: any) {
        console.error("[Super Admin Disputes] Server error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
