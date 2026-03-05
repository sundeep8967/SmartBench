"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import WorkerAvailabilityCalendar from "@/app/dashboard/settings/worker-availability-calendar";

interface ManageAvailabilityDialogProps {
    workerId: string;
    workerName: string;
}

export function ManageAvailabilityDialog({ workerId, workerName }: ManageAvailabilityDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 font-medium text-blue-700 border-blue-200 hover:bg-blue-50">
                    <CalendarDays size={14} className="mr-1.5" />
                    Availability
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] overflow-hidden p-0 bg-white">
                <DialogHeader className="p-5 border-b bg-gray-50/50">
                    <DialogTitle>Worker Availability</DialogTitle>
                    <DialogDescription>
                        Set the start date, optional end date, and block out specific days for {workerName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-0 bg-gray-50/20 max-h-[80vh] overflow-y-auto">
                    <WorkerAvailabilityCalendar workerId={workerId} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
