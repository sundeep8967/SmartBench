import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const { targetUserId } = await req.json();

        if (!targetUserId) {
            return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Verify caller is Super Admin
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split(" ")[1];

        const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
        if (authErr || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: superAdmin } = await supabaseAdmin
            .from("super_admins")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!superAdmin) {
            return NextResponse.json({ error: "Forbidden - Super Admin required" }, { status: 403 });
        }

        // 2. Get target user's email
        const { data: targetUserData, error: targetUserErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

        if (targetUserErr || !targetUserData?.user?.email) {
            return NextResponse.json({ error: "Target user not found or has no email" }, { status: 404 });
        }

        const targetEmail = targetUserData.user.email;
        const targetFullName = targetUserData.user.user_metadata?.full_name || "User";

        // 3. Generate Magic Link for the target user
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: targetEmail,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
            }
        });

        if (linkErr || !linkData?.properties?.action_link) {
            throw new Error(linkErr?.message || "Failed to generate link");
        }

        // 4. Log the audit trail
        await supabaseAdmin.from("audit_log").insert({
            target_entity: "User",
            target_id: targetUserId,
            action: "Impersonation Started",
            actor_id: user.id,
            metadata: { targetEmail }
        });

        return NextResponse.json({
            actionLink: linkData.properties.action_link,
            targetName: targetFullName,
            targetEmail
        });

    } catch (e: any) {
        console.error("[God Mode] Error generating link:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
