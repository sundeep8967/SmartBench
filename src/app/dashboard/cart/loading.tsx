import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default function CartLoading() {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
            </div>

            <div className="space-y-6">
                {[1, 2].map((i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <Skeleton className="h-12 w-12 rounded-full border border-white shadow-sm" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-40" />
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                </div>
                                <Skeleton className="h-8 w-24 rounded-md" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid gap-6 text-sm" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-5 w-32" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50/50 p-6 rounded-lg border border-blue-100 gap-4">
                    <div className="space-y-2 w-full md:w-auto">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-12 w-full md:w-56 rounded-md" />
                </div>
            </div>
        </div>
    );
}
