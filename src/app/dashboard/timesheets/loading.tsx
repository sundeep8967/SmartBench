import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function TimesheetsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-full w-fit">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>

            {/* List */}
            <div className="space-y-4 mt-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-0 shadow-sm border-gray-200 overflow-hidden">
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Worker */}
                            <div className="flex items-center space-x-4 min-w-[200px]">
                                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                            </div>

                            {/* Date & Hours Stacked on Mobile, Row on Desktop */}
                            <div className="flex space-x-8">
                                <div className="text-center min-w-[100px]">
                                    <Skeleton className="h-3 w-10 mx-auto mb-1" />
                                    <Skeleton className="h-4 w-20 mx-auto" />
                                </div>
                                <div className="text-center min-w-[80px]">
                                    <Skeleton className="h-3 w-10 mx-auto mb-1" />
                                    <Skeleton className="h-4 w-16 mx-auto" />
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center space-x-3 min-w-[120px]">
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-3 mt-4 md:mt-0">
                                <Skeleton className="h-9 w-20 rounded-md" />
                                <Skeleton className="h-9 w-24 rounded-md" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
