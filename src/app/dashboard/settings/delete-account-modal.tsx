"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccountModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmationText, setConfirmationText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const isConfirmed = confirmationText === "DELETE";

    const handleDelete = async () => {
        if (!isConfirmed) return;
        setIsLoading(true);

        try {
            const res = await fetch('/api/account/delete', {
                method: 'POST',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete account.');
            }

            // Also sign out on the client to clear session locally
            const supabase = createClient();
            await supabase.auth.signOut();

            toast({
                title: "Account Deleted",
                description: "Your account and all associated data have been permanently removed.",
            });

            // Redirect to home/landing page
            router.push("/");
            router.refresh();

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error Deleting Account",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            });
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-medium">
                    Delete Account
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-red-600">
                        <AlertTriangle className="mr-2" size={20} />
                        Delete Account
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-gray-700">
                        This action cannot be undone. This will permanently delete your account, remove your data from our servers, and delete any associated payment configurations from Stripe.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Please type <span className="font-bold text-red-600">DELETE</span> to confirm.
                    </label>
                    <input
                        type="text"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        placeholder="DELETE"
                    />
                </div>

                <DialogFooter className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!isConfirmed || isLoading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isLoading ? "Deleting..." : "Permanently Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
