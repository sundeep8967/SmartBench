import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function SettingsLoading() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="mb-8">
                <Skeleton className="h-9 w-48 mb-2" />
                <Skeleton className="h-5 w-72" />
            </div>

            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center space-x-6">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-8 w-24 rounded-md mt-2" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48 mb-1" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            <Skeleton className="h-6 w-11 rounded-full" />
                        </div>
                    ))}
                    <div className="pt-6 border-t flex justify-end">
                        <Skeleton className="h-10 w-32 rounded-md" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
