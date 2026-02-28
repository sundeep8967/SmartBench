import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function ProjectsLoading() {
    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div>
                <Skeleton className="h-9 w-48 mb-2" />
                <Skeleton className="h-5 w-72" />
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="flex flex-wrap items-stretch bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1 max-w-2xl h-[42px]">
                        <div className="flex items-center flex-1 min-w-[200px] px-3">
                            <Skeleton className="h-5 w-5 mr-3 rounded-full" />
                            <Skeleton className="h-5 w-3/4" />
                        </div>
                        <div className="w-px bg-gray-200 self-stretch" />
                        <div className="flex items-center px-2 space-x-2">
                            <Skeleton className="h-6 w-6 rounded-md" />
                            <Skeleton className="h-6 w-6 rounded-md" />
                        </div>
                    </div>
                </div>

                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="h-[200px] flex flex-col p-4">
                            <Skeleton className="h-6 w-3/4 mb-3" />
                            <div className="flex space-x-2 mb-3">
                                <Skeleton className="h-4 w-4" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-4/5" />
                                </div>
                            </div>
                            <Skeleton className="h-3 w-1/2 mt-auto mb-4" />
                            <div className="flex space-x-2 mb-4">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <Skeleton className="h-9 w-full rounded-md" />
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
