"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function Step1Info() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: "",
        address: "",
        ein: "",
        contactPhone: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error("No user found");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/onboarding/step1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save");
            }

            // Mark onboarding as complete so the proxy allows dashboard access
            const completeRes = await fetch("/api/onboarding/complete", {
                method: "POST",
            });

            if (!completeRes.ok) {
                console.error("Failed to mark onboarding complete");
            }

            // Full page navigation to ensure server-side session cookies
            // are properly sent when the dashboard server component loads
            window.location.href = "/dashboard";
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Error saving company info. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label htmlFor="companyName">Business Name</Label>
                <Input
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="Acme Construction Inc."
                />
            </div>

            <div>
                <Label htmlFor="address">Business Address</Label>
                <Input
                    id="address"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="123 Main St, Anytown"
                />
            </div>

            <div>
                <Label htmlFor="ein">EIN (Tax ID)</Label>
                <Input
                    id="ein"
                    name="ein"
                    required
                    value={formData.ein}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="12-3456789"
                />
            </div>

            <div>
                <Label htmlFor="contactPhone">Contact Phone (Mobile)</Label>
                <Input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    required
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="+1 (555) 123-4567"
                />
                <p className="text-xs text-neutral-500 mt-1">
                    Used for critical alerts (e.g., insurance expiration).
                </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Continue"}
            </Button>
        </form>
    );
}
