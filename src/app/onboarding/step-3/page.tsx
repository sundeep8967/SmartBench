"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BulkInviteForm } from "@/components/workers/bulk-invite-form";

export default function Step3Users() {
    const router = useRouter();

    const handleFinish = async () => {
        try {
            await fetch("/api/onboarding/complete", { method: "POST" });
        } catch (error) {
            console.error("Failed to complete onboarding", error);
        }
        router.push("/dashboard");
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
