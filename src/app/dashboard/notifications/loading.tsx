import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function NotificationsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="flex space-x-2">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-32 rounded-md" />
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card
                        key={i}
                        className="shadow-sm border border-gray-100 p-5 transition-all bg-white"
                    >
                        <div className="flex items-start gap-4">
                            {/* Icon Based on Type */}
                            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

                            <div className="flex-1 space-y-2 flex-col justify-center">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-5 w-64" />
                                    <Skeleton className="h-3 w-16 whitespace-nowrap" />
                                </div>
                                <Skeleton className="h-4 w-3/4" />
                            </div>

                            <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex justify-center pt-4">
                <Skeleton className="h-4 w-40" />
            </div>
        </div>
    );
}
