import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function MarketplaceLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Title */}
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 gap-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-6 w-32 mb-2" />
            </div>

            {/* Search & Filters */}
            <Card className="p-4 shadow-sm border-gray-200">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full rounded-md" />

                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-10 w-full rounded-md" />

                        <div className="flex space-x-2">
                            <Skeleton className="h-10 flex-1 rounded-md" />
                            <Skeleton className="h-10 w-32 rounded-md" />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Worker Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="p-5 shadow-sm border-gray-200">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-12 rounded-sm bg-orange-50" />
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mt-4 mb-6">
                            <Skeleton className="h-6 w-16 rounded-md" />
                            <Skeleton className="h-6 w-20 rounded-md" />
                            <Skeleton className="h-6 w-24 rounded-md" />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div>
                                <Skeleton className="h-7 w-20" />
                            </div>
                            <Skeleton className="h-9 w-28 rounded-md" />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
