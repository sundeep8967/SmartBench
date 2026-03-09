"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ListWorkerDialogProps {
    workerId: string;
    workerName: string;
    trade: string | null;
    rate: number | null;
    homeZipCode: string | null;
    userState?: string;
    defaultMinShiftLength?: number;
    onListSuccess?: () => void;
}

export function ListWorkerDialog({ workerId, workerName, trade, rate, homeZipCode, userState, defaultMinShiftLength = 8, onListSuccess }: ListWorkerDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hourlyRate, setHourlyRate] = useState(rate ? String(rate) : "");
    const [minShiftLength, setMinShiftLength] = useState(String(defaultMinShiftLength));
    const [insuranceError, setInsuranceError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleList = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setInsuranceError(null);

        try {
            const response = await fetch('/api/workers/list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workerId,
                    minimum_shift_length_hours: parseInt(minShiftLength),
                    hourly_rate: parseFloat(hourlyRate)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error || 'Failed to list worker';

                if (errorMessage.toLowerCase().includes('insurance')) {
                    setInsuranceError(errorMessage);
                }

                throw new Error(errorMessage);
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
                            <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-gray-500">Home Zip Code:</span>
                                <span className="font-medium text-gray-900">{homeZipCode || 'N/A'}</span>
                            </div>
                        </div>

                        {(!trade || !homeZipCode || (userState && userState === 'Pending_Profile')) && (
                            <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-3 rounded-md mb-4">
                                <strong>Incomplete Profile:</strong> Workers must fully complete their profile steps (Trade, Experience, Zip Code) before they can be listed on the Marketplace. Status: {userState || 'Incomplete'}.
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="hourly_rate">Lending Rate ($/hr)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                                <input
                                    id="hourly_rate"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value)}
                                    placeholder="45.00"
                                    className="w-full flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-7"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500">The hourly amount your company earns when this worker is booked.</p>
                        </div>

                        {insuranceError && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-lg space-y-3">
                                <div className="flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-900">Insurance Required</p>
                                        <p className="text-xs text-red-700 mt-0.5">
                                            {insuranceError}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-white text-red-700 border-red-200 hover:bg-red-50"
                                    onClick={() => window.location.href = '/dashboard/settings?tab=Insurance'}
                                >
                                    Go to Insurance Settings
                                </Button>
                            </div>
                        )}

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
                        <Button
                            type="submit"
                            disabled={loading || !trade || !homeZipCode || !hourlyRate || userState === 'Pending_Profile' || !!insuranceError}
                            className="bg-blue-900 hover:bg-blue-800 text-white"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            List Worker
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
