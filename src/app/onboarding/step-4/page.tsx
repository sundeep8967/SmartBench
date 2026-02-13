"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BulkInviteForm } from "@/components/workers/bulk-invite-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function Step4Users() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const mode = searchParams.get("mode") || "invite"; // 'invite' or 'profile'

    const handleFinish = () => {
        router.push("/dashboard");
    };

    // Solopreneur View
    if (mode === "profile") {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center text-green-500">
                    <CheckCircle className="w-16 h-16" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">You're almost done!</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                    Your company is set up. Now let's complete your personal profile so you can accept bookings.
                </p>
                <div className="pt-4">
                    <Button onClick={() => router.push("/dashboard/profile")} size="lg" className="w-full">
                        Complete My Profile
                    </Button>
                </div>
                <Button variant="ghost" onClick={handleFinish} className="text-sm text-gray-400">
                    Skip for now
                </Button>
            </div>
        );
    }

    // Company View
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
