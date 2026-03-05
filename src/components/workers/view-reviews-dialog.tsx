"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/swr-fetcher";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Loader2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ViewReviewsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workerId: string;
    workerName: string;
}

export function ViewReviewsDialog({ open, onOpenChange, workerId, workerName }: ViewReviewsDialogProps) {
    const { data: reviewsData, isLoading } = useSWR(
        open ? `/api/workers/${workerId}/reviews` : null,
        fetcher
    );

    const averages = reviewsData?.averages;
    const reviews = reviewsData?.reviews || [];

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const totalVisible = hasHalfStar ? fullStars + 1 : fullStars;

        return (
            <div className="flex text-yellow-500">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} size={14} className="fill-current" />
                ))}
                {hasHalfStar && <Star key="half" size={14} className="fill-current opacity-50" />}
                {[...Array(5 - totalVisible)].map((_, i) => (
                    <Star key={`empty-${i}`} size={14} className="text-gray-300" />
                ))}
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto w-11/12 rounded-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl border-b pb-4">
                        <Star className="text-yellow-500 fill-yellow-500 size-6" />
                        {workerName}'s Ratings
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                        <span className="text-gray-500 text-sm">Loading reviews...</span>
                    </div>
                ) : !averages ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                        <Star className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p>No reviews yet for this worker.</p>
                    </div>
                ) : (
                    <div className="space-y-6 pt-2">
                        {/* Summary Block */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col items-center justify-center shadow-inner">
                            <span className="text-4xl font-extrabold text-gray-900 mb-2">{averages.aggregate}</span>
                            {renderStars(Number(averages.aggregate))}
                            <span className="text-xs font-medium text-gray-500 mt-2 uppercase tracking-wide">
                                Based on {reviews.length} completed book{reviews.length === 1 ? 'ing' : 'ings'}
                            </span>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-3 px-2">
                            <h4 className="text-sm font-semibold text-gray-900 border-b pb-1 mb-3">Dimension Averages</h4>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">Punctuality</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 w-6 text-right">{averages.punctuality}</span>
                                    {renderStars(Number(averages.punctuality))}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">Attitude & Pro</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 w-6 text-right">{averages.attitude}</span>
                                    {renderStars(Number(averages.attitude))}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">Effort & Work</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 w-6 text-right">{averages.effort}</span>
                                    {renderStars(Number(averages.effort))}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">Teamwork & Safety</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 w-6 text-right">{averages.teamwork}</span>
                                    {renderStars(Number(averages.teamwork))}
                                </div>
                            </div>
                        </div>

                        {/* Testimonials List */}
                        <div className="pt-2 px-2">
                            <h4 className="text-sm font-semibold text-gray-900 border-b pb-1 mb-4 flex justify-between items-center">
                                Written Testimonials
                                {!reviewsData?.privacy_enabled && reviews.length > 0 && (
                                    <Badge variant="outline" className="text-[10px] text-gray-500 bg-gray-50">Private</Badge>
                                )}
                            </h4>
                            {!reviewsData?.privacy_enabled ? (
                                <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-center">
                                    <p className="text-sm text-orange-800">
                                        This worker has chosen to keep their written testimonials private. Only aggregate scores are public.
                                    </p>
                                </div>
                            ) : reviews.filter((r: any) => r.testimonial_text).length === 0 ? (
                                <p className="text-sm text-gray-500 italic text-center py-4">
                                    No written testimonials provided yet.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.filter((r: any) => r.testimonial_text).map((review: any) => (
                                        <div key={review.id} className="bg-white border rounded-lg p-4 shadow-sm relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                        {review.reviewer?.full_name?.charAt(0) || "U"}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-900">{review.reviewer?.full_name || "Anonymous Borrower"}</p>
                                                        <p className="text-[10px] text-gray-500">{review.project?.name || "Completed Booking"}</p>
                                                    </div>
                                                </div>
                                                <div className="flex">
                                                    <Star size={12} className="fill-yellow-500 text-yellow-500" />
                                                    <span className="text-xs font-bold ml-1">{review.aggregate_rating}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-2 bg-gray-50/50 p-2 rounded italic">
                                                "{review.testimonial_text}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
