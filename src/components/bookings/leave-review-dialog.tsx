"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LeaveReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bookingId: string;
    workerId: string;
    workerName: string;
    onSuccess?: () => void;
}

export function LeaveReviewDialog({ open, onOpenChange, bookingId, workerId, workerName, onSuccess }: LeaveReviewDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [ratings, setRatings] = useState({
        punctuality: 0,
        attitude: 0,
        effort: 0,
        teamwork: 0
    });
    const [testimonial, setTestimonial] = useState("");

    const handleRatingChange = (dimension: keyof typeof ratings, value: number) => {
        setRatings(prev => ({ ...prev, [dimension]: value }));
    };

    const isSubmitDisabled = Object.values(ratings).some(val => val === 0) || loading;

    const handleSubmit = async () => {
        if (isSubmitDisabled) return;
        setLoading(true);

        const aggregateRating = (ratings.punctuality + ratings.attitude + ratings.effort + ratings.teamwork) / 4;

        try {
            const res = await fetch(`/api/workers/${workerId}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId,
                    aggregateRating,
                    punctualityRating: ratings.punctuality,
                    attitudeRating: ratings.attitude,
                    effortRating: ratings.effort,
                    teamworkRating: ratings.teamwork,
                    testimonialText: testimonial.trim() || undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit review");
            }

            toast({
                title: "Review Submitted",
                description: "Thank you for providing feedback on " + workerName
            });

            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                title: "Error submitting review",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const displayDimension = (label: string, key: keyof typeof ratings) => {
        return (
            <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">{label}</Label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`w-6 h-6 cursor-pointer transform transition-transform hover:scale-110 ${star <= ratings[key] ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                            onClick={() => handleRatingChange(key, star)}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Rate {workerName}</DialogTitle>
                    <DialogDescription>
                        Your feedback helps maintain trust and quality in our marketplace.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-2">
                    {displayDimension("Punctuality", "punctuality")}
                    {displayDimension("Attitude & Professionalism", "attitude")}
                    {displayDimension("Effort & Hard Work", "effort")}
                    {displayDimension("Teamwork & Safety", "teamwork")}

                    <div className="pt-4 space-y-2">
                        <Label>Testimonial (Optional)</Label>
                        <Textarea
                            placeholder={`Leave a public recommendation for ${workerName}...`}
                            value={testimonial}
                            onChange={(e) => setTestimonial(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            This may be shown on the worker's public profile if they allow it.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitDisabled} className="bg-blue-900 hover:bg-blue-800 text-white">
                        {loading ? "Submitting..." : "Submit Review"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
