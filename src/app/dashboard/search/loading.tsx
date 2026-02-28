import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function SearchLoading() {
    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row overflow-hidden animate-in fade-in duration-300">
            {/* Left Sidebar (Search Params + Results) */}
            <div className="w-full md:w-1/3 min-w-[320px] lg:w-2/5 xl:w-[450px] bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
                {/* Search Header */}
                <div className="p-4 border-b border-gray-100 shrink-0 bg-white">
                    <div className="mb-4 flex items-center justify-between">
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                    {/* Filter Inputs Area */}
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full rounded-md" />
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-1/2 rounded-md" />
                            <Skeleton className="h-10 w-1/2 rounded-md" />
                        </div>
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    <Skeleton className="h-4 w-32 mb-4" />
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="cursor-pointer transition-all border-gray-200 shadow-none">
                            <CardContent className="p-4 flex gap-4">
                                <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-5 w-8 rounded-full" />
                                    </div>
                                    <Skeleton className="h-4 w-1/2 mb-2" />
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                        <Skeleton className="h-5 w-24 rounded-full" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right Side Map Area */}
            <div className="flex-1 h-[40vh] md:h-full bg-gray-100 flex items-center justify-center relative">
                <div className="absolute inset-0 z-0">
                    {/* Placeholder for map background */}
                    <div className="w-full h-full bg-slate-200/50" />
                </div>
                {/* Centered Map Spinner */}
                <Skeleton className="h-12 w-12 rounded-full z-10 animate-pulse bg-white/80 shadow-md" />
            </div>
        </div>
    );
}
