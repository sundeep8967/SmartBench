import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, search_criteria, borrower_company_id, alert_preference } = body;

        if (!name || !search_criteria || !borrower_company_id) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("saved_searches")
            .insert({
                borrower_company_id,
                name,
                search_criteria,
                alert_preference: alert_preference || "Daily_Digest",
                timezone: "America/Chicago",
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating saved search:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Internal Server Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');

        if (!companyId) {
            return NextResponse.json(
                { error: "Missing companyId parameter" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("saved_searches")
            .select("*")
            .eq("borrower_company_id", companyId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching saved searches:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Internal Server Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
