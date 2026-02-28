import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function InsuranceLoading() {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">
            <div>
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {/* Upload Form */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex items-start space-x-2 pt-2">
                            <Skeleton className="h-4 w-4 shrink-0 rounded" />
                            <div className="space-y-1 w-full">
                                <Skeleton className="h-4 w-64" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-full mt-4" />
                    </CardContent>
                </Card>

                {/* Current Policies & Status Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Skeleton className="h-5 w-40" />
                                            <Skeleton className="h-4 w-4 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Status Summary */}
                    <Card className="border-l-4 border-gray-200">
                        <CardHeader>
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </div>
    );
}
