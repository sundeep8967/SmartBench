"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, ShieldX, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ImpersonationBanner() {
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [targetName, setTargetName] = useState("");
    const [isExiting, setIsExiting] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        // Check for the sb-impersonation-mode cookie
        const cookies = document.cookie.split("; ");
        const modeCookie = cookies.find(row => row.startsWith("sb-impersonation-mode="));
        const targetCookie = cookies.find(row => row.startsWith("sb-impersonation-target="));

        if (modeCookie && modeCookie.split("=")[1] === "true") {
            setIsImpersonating(true);
            if (targetCookie) {
                setTargetName(decodeURIComponent(targetCookie.split("=")[1]));
            }
        }
    }, []);

    const handleExit = async () => {
        setIsExiting(true);
        try {
            // 1. Clear the cookies
            document.cookie = "sb-impersonation-mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "sb-impersonation-target=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

            // 2. Log out the impersonated user session
            await supabase.auth.signOut();

            // 3. Redirect back to login (or admin dashboard if they were to re-auth)
            // Forced reload to clear all states
            window.location.href = "/login?redirect=/dashboard/admin";
        } catch (e) {
            console.error(e);
            setIsExiting(false);
        }
    };

    if (!isImpersonating) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 border-b border-red-700 shadow-lg px-4 py-2 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-full animate-pulse">
                    <Eye className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-sm tracking-wide">GOD MODE <span className="text-red-200 mx-1">—</span> Viewing as {targetName || "User"}</h3>
                    <p className="text-[10px] text-red-100 uppercase tracking-widest font-semibold">READ-ONLY. ANY ACTIONS TAKEN WILL BE BLOCKED BY THE SERVER.</p>
                </div>
            </div>
            <Button
                size="sm"
                variant="outline"
                onClick={handleExit}
                disabled={isExiting}
                className="bg-white text-red-700 hover:bg-red-50 hover:text-red-800 border-transparent font-bold text-xs h-8"
            >
                {isExiting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4 mr-1.5" />}
                {isExiting ? "Exiting..." : "Exit Target"}
            </Button>
        </div>
    );
}
