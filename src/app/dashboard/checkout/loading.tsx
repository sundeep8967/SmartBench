import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default function CheckoutLoading() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center text-sm text-gray-400">
                <ChevronLeft size={16} className="mr-1" />
                <Skeleton className="h-4 w-24" />
            </div>

            <Skeleton className="h-8 w-64" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Forms */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <Skeleton className="h-6 w-48 mb-4" />
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <Skeleton className="h-6 w-40 mb-4" />
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Summary */}
                <div className="space-y-6">
                    <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-6 space-y-6">
                            <Skeleton className="h-6 w-32" />

                            <div className="space-y-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex justify-between pb-4 border-b border-gray-100">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <div className="flex justify-between pt-4 border-t border-gray-200">
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            </div>

                            <Skeleton className="h-12 w-full mt-6" />
                            <Skeleton className="h-3 w-48 mx-auto" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
