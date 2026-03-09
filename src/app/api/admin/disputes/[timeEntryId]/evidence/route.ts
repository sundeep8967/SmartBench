import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ timeEntryId: string }> }) {
    try {
        const { timeEntryId } = await params;
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

        // 2. Fetch Time Entry with Booking & User context
        const { data: timeEntry, error: teErr } = await supabaseAdmin
            .from("time_entries")
            .select(`
                id,
                booking_id,
                user_id,
                clock_in,
                clock_out,
                system_clock_in,
                system_clock_out,
                gps_clock_in,
                gps_clock_out,
                status,
                photo_url_clock_in,
                photo_url_clock_out,
                bookings!inner (
                    id,
                    project_id,
                    borrower_company_id,
                    projects!inner ( name, address )
                ),
                users!inner (
                    full_name,
                    email,
                    company_members!inner (
                        companies!inner ( name )
                    )
                )
            `)
            .eq("id", timeEntryId)
            .single();

        if (teErr || !timeEntry) {
            return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
        }

        // Fetch Borrower Company Name
        const { data: borrowerInfo } = await supabaseAdmin
            .from("companies")
            .select("name")
            .eq("id", (timeEntry.bookings as any).borrower_company_id)
            .single();

        // 3. Fetch Dispute Messages (Chat Transcript)
        const { data: messages } = await supabaseAdmin
            .from("dispute_messages")
            .select(`
                id,
                message,
                sender_id,
                is_system_message,
                created_at,
                users ( full_name )
            `)
            .eq("time_entry_id", timeEntryId)
            .order("created_at", { ascending: true });

        // 4. Fetch Audit Logs related to this Time Entry
        const { data: auditLogs } = await supabaseAdmin
            .from("audit_log")
            .select("*")
            .eq("target_entity", "TimeEntry")
            .eq("target_id", timeEntryId)
            .order("timestamp", { ascending: true });

        // Construct Evidence Payload
        const evidence = {
            timeEntry: {
                id: timeEntry.id,
                status: timeEntry.status,
                clockIn: timeEntry.clock_in,
                clockOut: timeEntry.clock_out,
                systemClockIn: timeEntry.system_clock_in,
                systemClockOut: timeEntry.system_clock_out,
                gpsClockIn: timeEntry.gps_clock_in,
                gpsClockOut: timeEntry.gps_clock_out,
                photoClockIn: timeEntry.photo_url_clock_in,
                photoClockOut: timeEntry.photo_url_clock_out,
            },
            booking: {
                id: timeEntry.booking_id,
                projectName: (timeEntry.bookings as any)?.projects?.name,
                projectAddress: (timeEntry.bookings as any)?.projects?.address,
            },
            parties: {
                workerName: (timeEntry.users as any)?.full_name,
                workerEmail: (timeEntry.users as any)?.email,
                lenderCompanyName: (timeEntry.users as any)?.company_members?.[0]?.companies?.name || "Unknown Lender",
                borrowerCompanyName: borrowerInfo?.name || "Unknown Borrower",
            },
            chatTranscript: (messages || []).map((m: any) => ({
                id: m.id,
                message: m.message,
                sender: m.is_system_message ? "SYSTEM" : (m.users?.full_name || "Unknown"),
                isSystem: m.is_system_message,
                timestamp: m.created_at
            })),
            auditTrail: auditLogs || []
        };

        return NextResponse.json({ evidence });

    } catch (e: any) {
        console.error("[Super Admin Evidence] Server error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
