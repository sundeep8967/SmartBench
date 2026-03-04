"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Store, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface UnlistWorkerButtonProps {
    workerId: string;
    workerName: string;
    onUnlistSuccess?: () => void;
}

export function UnlistWorkerButton({ workerId, workerName, onUnlistSuccess }: UnlistWorkerButtonProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleUnlist = async () => {
        setLoading(true);

        try {
            const response = await fetch('/api/workers/list', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ workerId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to unlist worker');
            }

            toast({
                title: "Worker Unlisted",
                description: `${workerName} has been removed from the marketplace.`,
            });

            if (onUnlistSuccess) {
                onUnlistSuccess();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to unlist worker. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
            onClick={handleUnlist}
            disabled={loading}
        >
            {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Store size={14} className="mr-1.5" />}
            Unlist
        </Button>
    );
}
