"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Plus } from "lucide-react";

interface BulkInviteFormProps {
    onSuccess: () => void;
}

export function BulkInviteForm({ onSuccess }: BulkInviteFormProps) {
    const [rawInput, setRawInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [report, setReport] = useState<any[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus("idle");
        setReport([]);

        // Parse Emails (comma or newline separated)
        const emails = rawInput
            .split(/[\n,]/)
            .map(e => e.trim())
            .filter(e => e && e.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));

        if (emails.length === 0) {
            alert("No valid emails found.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/workers/invite", { // Reusing backend component
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emails, role: "worker" }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to send invites");

            setStatus("success");
            setReport(data.results);
            setRawInput("");
            onSuccess();
        } catch (error) {
            console.error(error);
            setStatus("error");
            alert("Failed to send invites");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Invite your Crew</CardTitle>
                <CardDescription>
                    Enter email addresses of workers you want to add to your roster.
                    They will receive an email invitation to join your company.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="emails">Email Addresses</Label>
                        <Textarea
                            id="emails"
                            placeholder="worker1@example.com, worker2@example.com..."
                            rows={5}
                            value={rawInput}
                            onChange={(e) => setRawInput(e.target.value)}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Separate multiple emails with commas or new lines.
                        </p>
                    </div>

                    <Button type="submit" disabled={loading || !rawInput} className="w-full">
                        {loading ? "Sending Invites..." : (
                            <>
                                <Mail className="w-4 h-4 mr-2" /> Send Invites
                            </>
                        )}
                    </Button>

                    {status === "success" && (
                        <div className="rounded-md bg-green-50 p-4 mt-4">
                            <p className="text-sm font-medium text-green-800">
                                Invites sent successfully!
                            </p>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
