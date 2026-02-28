import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default function WorkerProfileLoading() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
            {/* Back Button */}
            <div className="flex items-center text-sm text-gray-400">
                <ChevronLeft size={16} className="mr-1" />
                <Skeleton className="h-4 w-32" />
            </div>

            {/* Header Card */}
            <Card className="p-6 md:p-8 border-gray-200 shadow-sm relative overflow-hidden bg-white">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <Skeleton className="h-32 w-32 rounded-full border-4 border-white shadow-lg shrink-0" />

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="flex flex-col md:flex-row items-center gap-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                        <Skeleton className="h-6 w-56" />

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-5 w-24" />
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-3 w-32 mx-auto mt-2" />
                    </div>
                </div>
            </Card>

            {/* Content Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex border-b border-gray-200 bg-white rounded-t-lg px-4 pt-4">
                        <Skeleton className="h-6 w-24 mb-3 mr-4" />
                        <Skeleton className="h-6 w-32 mb-3 mr-4" />
                        <Skeleton className="h-6 w-28 mb-3" />
                    </div>

                    <Card className="p-6 rounded-t-none border-t-0 shadow-sm border-gray-200">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-40 mb-4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <Card className="p-5 shadow-sm border-gray-200 space-y-4">
                        <Skeleton className="h-6 w-40 mb-4" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                        ))}
                    </Card>

                    <Card className="p-5 shadow-sm border-gray-200 bg-blue-50/50 space-y-3">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-full mt-2" />
                    </Card>
                </div>
            </div>
        </div>
    );
}
