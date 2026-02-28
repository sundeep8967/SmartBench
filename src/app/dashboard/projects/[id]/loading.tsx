import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function ProjectDetailLoading() {
    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">
            {/* Header Skeleton */}
            <div className="space-y-4">
                <div className="flex items-center text-muted-foreground -ml-2 mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span className="text-sm">Back to Projects</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="space-y-2 w-full max-w-sm">
                        <Skeleton className="h-9 w-3/4" />
                        <Skeleton className="h-5 w-1/2" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/3" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-5 w-1/2" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-5 w-1/2" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="overflow-hidden shadow-sm">
                        <CardHeader className="px-3 pt-4 pb-2 border-b border-gray-100 bg-white">
                            <Skeleton className="h-5 w-1/2" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <Skeleton className="w-full h-48 sm:h-56 rounded-none" />
                            <div className="p-2 flex justify-center bg-gray-50 border-t border-gray-100">
                                <Skeleton className="h-4 w-1/3" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {[1, 2].map((i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-6 w-1/2" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 mt-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Skeleton className="h-8 w-24" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
