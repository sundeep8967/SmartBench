"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ListWorkerDialogProps {
    workerId: string;
    workerName: string;
    trade: string | null;
    rate: number | null;
    defaultMinShiftLength?: number;
    onListSuccess?: () => void;
}

export function ListWorkerDialog({ workerId, workerName, trade, rate, defaultMinShiftLength = 8, onListSuccess }: ListWorkerDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [minShiftLength, setMinShiftLength] = useState(String(defaultMinShiftLength));
    const { toast } = useToast();

    const handleList = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/workers/list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workerId,
                    minimum_shift_length_hours: parseInt(minShiftLength)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to list worker');
            }

            toast({
                title: "Worker Listed",
                description: `${workerName} is now active on the marketplace.`,
            });

            setOpen(false);
            if (onListSuccess) {
                onListSuccess();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to list worker. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    <Store size={14} className="mr-1.5" /> List
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleList}>
                    <DialogHeader>
                        <DialogTitle>List Worker on Marketplace</DialogTitle>
                        <DialogDescription>
                            Configure listing settings for {workerName}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Trade:</span>
                                <span className="font-medium text-gray-900">{trade || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-gray-500">Current Rate:</span>
                                <span className="font-medium text-gray-900">{rate ? `$${rate}/hr` : 'N/A'}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shift_length">Minimum Shift Length (Hours)</Label>
                            <Select value={minShiftLength} onValueChange={setMinShiftLength}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select hours" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2">2 Hours</SelectItem>
                                    <SelectItem value="3">3 Hours</SelectItem>
                                    <SelectItem value="4">4 Hours</SelectItem>
                                    <SelectItem value="5">5 Hours</SelectItem>
                                    <SelectItem value="6">6 Hours</SelectItem>
                                    <SelectItem value="7">7 Hours</SelectItem>
                                    <SelectItem value="8">8 Hours</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">This worker will only appear in searches for shifts meeting this minimum.</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-900 hover:bg-blue-800 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            List Worker
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
