"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, XCircle, Info, UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Step = 'DECISION' | 'CONVENIENCE' | 'CAUSE_FORM' | 'CRITICAL_FORK' | 'SAFETY_CHECK';
type Severity = 'Warning' | 'Critical';
type IncidentType = 'Injury' | 'Property_Damage' | 'Tardiness' | 'Workmanship' | 'Conduct';

interface Props {
    booking: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EndBookingModal({ booking, open, onOpenChange, onSuccess }: Props) {
    const [step, setStep] = useState<Step>('DECISION');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Form State
    const [severity, setSeverity] = useState<Severity>('Warning');
    const [type, setType] = useState<IncidentType>('Conduct');
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);

    const reset = () => {
        setStep('DECISION');
        setSeverity('Warning');
        setType('Conduct');
        setNotes('');
        setPhotos([]);
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    const submitIncident = async (finalSeverity: Severity) => {
        setLoading(true);
        try {
            // NOTE: In a full implementation we would upload photos to Supabase Storage here and get URLs back.
            // For MVP we send empty array.

            const payload = {
                reason: "Cause",
                incidentData: {
                    severity: finalSeverity,
                    type,
                    notes,
                    photoUrls: [] // Placeholder
                }
            };

            const res = await fetch(`/api/bookings/${booking.id}/end`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit incident");

            toast({ title: "Incident Reported", description: `Booking status updated to ${data.bookingStatus}` });
            onSuccess();
            handleClose();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
        setLoading(false);
    };

    // Render Steps
    const renderDecision = () => (
        <div className="space-y-4">
            <DialogDescription>
                Why are you ending this booking? Your selection determines the refund and penalty rules.
            </DialogDescription>
            <div className="grid gap-4 mt-4">
                <button
                    onClick={() => setStep('CONVENIENCE')}
                    className="flex flex-col text-left p-4 border rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all gap-1"
                >
                    <div className="flex items-center text-blue-800 font-semibold gap-2">
                        <Info size={18} /> End for Convenience
                    </div>
                    <span className="text-sm text-gray-500">
                        Project finished early, no longer needed, scheduling conflict.
                        Subject to 24-hour notice periods and cancellation fees.
                    </span>
                </button>
                <button
                    onClick={() => setStep('CAUSE_FORM')}
                    className="flex flex-col text-left p-4 border rounded-xl hover:bg-red-50 hover:border-red-300 border-red-100 transition-all gap-1"
                >
                    <div className="flex items-center text-red-700 font-semibold gap-2">
                        <AlertTriangle size={18} /> End for Cause (Incident Report)
                    </div>
                    <span className="text-sm text-gray-600">
                        Safety issue, severe misconduct, or property damage.
                        Triggers immediate investigation and fast-track dispute.
                    </span>
                </button>
            </div>
        </div>
    );

    const renderConvenience = () => (
        <div className="space-y-4 py-4">
            <div className="bg-yellow-50 p-4 rounded-lg flex gap-3 text-yellow-800">
                <Info className="flex-shrink-0 mt-0.5" size={18} />
                <div className="text-sm">
                    <strong>Standard Cancellation Rules Apply</strong>
                    <p className="mt-1">For Convenience cancellations, please use the standard "Cancel" button on the booking card, which calculates the exact refund amount based on notice periods.</p>
                </div>
            </div>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setStep('DECISION')}>Go Back</Button>
                <Button onClick={handleClose}>Got it, close</Button>
            </DialogFooter>
        </div>
    );

    const renderCauseForm = () => (
        <div className="space-y-5 py-2">
            <DialogDescription>
                File an official incident report. This acts as a Fast-Track Dispute, skipping the normal timesheet approval loop.
            </DialogDescription>

            <div className="space-y-2">
                <Label>Incident Type</Label>
                <Select value={type} onValueChange={(val: IncidentType) => setType(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Safety">Safety Violation</SelectItem>
                        <SelectItem value="Conduct">Severe Misconduct</SelectItem>
                        <SelectItem value="Tardiness">Chronic Tardiness / No Show</SelectItem>
                        <SelectItem value="Workmanship">Grossly Poor Workmanship</SelectItem>
                        <SelectItem value="Property_Damage">Property Damage</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Severity Level</Label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setSeverity('Warning')}
                        className={`p-3 border rounded-lg text-sm text-left ${severity === 'Warning' ? 'bg-orange-50 border-orange-500' : 'hover:bg-gray-50'}`}
                    >
                        <strong className="block text-orange-700 mb-1">Warning (Level 1)</strong>
                        <span className="text-gray-500 text-xs">Worker continues shift, but formal warning is documented.</span>
                    </button>
                    <button
                        onClick={() => setSeverity('Critical')}
                        className={`p-3 border rounded-lg text-sm text-left ${severity === 'Critical' ? 'bg-red-50 border-red-500' : 'hover:bg-gray-50'}`}
                    >
                        <strong className="block text-red-700 mb-1">Critical (Level 2)</strong>
                        <span className="text-gray-500 text-xs">Severe violation requiring immediate removal from site.</span>
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Detailed Notes (Required)</Label>
                <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Describe exactly what happened..."
                    className="h-24"
                />
            </div>

            <div className="space-y-2">
                <Label>Evidence Photos (Optional)</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-500 text-sm flex flex-col items-center">
                    <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                    <span>Click to upload evidence photos</span>
                    <span className="text-xs mt-1">Maximum 3 photos (MVP constraint)</span>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={() => setStep('DECISION')}>Back</Button>
                <Button
                    className="bg-blue-900 hover:bg-blue-800"
                    disabled={!notes.trim()}
                    onClick={() => {
                        if (severity === 'Critical') setStep('SAFETY_CHECK');
                        else submitIncident('Warning');
                    }}
                >
                    {severity === 'Warning' ? "Submit Warning" : "Continue"}
                </Button>
            </DialogFooter>
        </div>
    );

    const renderSafetyCheck = () => (
        <div className="space-y-6 py-4">
            <div className="bg-red-50 text-red-800 p-5 rounded-xl border border-red-200 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto text-red-600 mb-3" />
                <h3 className="text-lg font-bold mb-2">Safety Protocol Stop</h3>
                <p className="text-sm">
                    You are about to file a Critical Incident Report.
                    Have you or your site supervisor physically notified the worker to stop working and leave the site?
                </p>
            </div>
            <DialogFooter className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep('CAUSE_FORM')}>No, Go Back</Button>
                <Button variant="destructive" className="flex-1" onClick={() => setStep('CRITICAL_FORK')}>Yes, Worker Notified</Button>
            </DialogFooter>
        </div>
    );

    const renderCriticalFork = () => (
        <div className="space-y-4 py-2">
            <DialogDescription>
                You have filed a Critical Incident. The worker has been removed from site. How do you want to handle the booking?
            </DialogDescription>

            <div className="grid gap-4 mt-4">
                <button
                    onClick={() => submitIncident('Critical')} // Keeps booking active, just pauses payment
                    disabled={loading}
                    className="flex flex-col text-left p-4 border rounded-xl hover:bg-blue-50 border-blue-200 transition-all gap-1"
                >
                    <div className="flex items-center text-blue-800 font-semibold gap-2">
                        Option A: Dispute Shift Only (Keep Booking)
                    </div>
                    <span className="text-sm text-gray-600">
                        Dispute today's timesheet but keep the worker scheduled for future days on this booking.
                        Funds are paused in escrow until admin review.
                    </span>
                </button>
                <button
                    onClick={() => submitIncident('Critical')} // NOTE: In prod, this would also TERMINATE booking status to 'Cancelled'
                    disabled={loading}
                    className="flex flex-col text-left p-4 border rounded-xl hover:bg-red-50 border-red-200 transition-all gap-1"
                >
                    <div className="flex items-center text-red-700 font-semibold gap-2">
                        Option B: End Booking & Dispute
                    </div>
                    <span className="text-sm text-gray-600">
                        Terminate the entire booking immediately and dispute today's timesheet.
                        Worker is released back to marketplace.
                    </span>
                </button>
            </div>
            {loading && <div className="text-center text-sm text-gray-500 py-2"><Loader2 className="animate-spin inline mr-2" /> Processing Incident...</div>}
        </div>
    );

    let content = renderDecision();
    let title = "End Booking";

    if (step === 'CONVENIENCE') {
        title = "End for Convenience";
        content = renderConvenience();
    } else if (step === 'CAUSE_FORM') {
        title = "File Incident Report";
        content = renderCauseForm();
    } else if (step === 'SAFETY_CHECK') {
        title = "Safety Protocol";
        content = renderSafetyCheck();
    } else if (step === 'CRITICAL_FORK') {
        title = "Fork in the Road";
        content = renderCriticalFork();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === 'CAUSE_FORM' || step === 'CRITICAL_FORK' || step === 'SAFETY_CHECK' ? <AlertTriangle className="text-red-500" size={20} /> : null}
                        {title}
                    </DialogTitle>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    );
}
