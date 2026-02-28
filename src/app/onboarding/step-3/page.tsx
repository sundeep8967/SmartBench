"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BulkInviteForm } from "@/components/workers/bulk-invite-form";

export default function Step3Users() {
    const router = useRouter();

    const handleFinish = async () => {
        // Onboarding already marked complete in step-1
        // Full page navigation for clean session pickup
        window.location.href = "/dashboard";
    };

    return (
        <div className="space-y-6">
            <BulkInviteForm onSuccess={() => {
                // Optional: Show "Invite More" or just let them stay
            }} />

            <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={handleFinish}>
                    Finish Setup & Go to Dashboard
                </Button>
            </div>
        </div>
    );
}
