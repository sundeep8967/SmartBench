"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function BulkDeleteProjectsDialog({ 
    selectedCount, 
    onConfirm, 
    isDeleting 
}: { 
    selectedCount: number, 
    onConfirm: () => Promise<void>, 
    isDeleting: boolean 
}) {
    const [open, setOpen] = useState(false);

    const handleConfirm = async () => {
        await onConfirm();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    disabled={isDeleting || selectedCount === 0}
                    className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center transition-colors disabled:opacity-50"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete {selectedCount} selected projects
                        and all their associated data.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : `Delete ${selectedCount} Projects`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
