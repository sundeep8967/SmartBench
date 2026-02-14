"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CartItem } from "@/types";

export default function CartPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(false);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const res = await fetch("/api/cart");
            if (res.ok) {
                const data = await res.json();
                setCartItems(data);
            }
        } catch (error) {
            console.error("Failed to fetch cart", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id: string) => {
        try {
            const res = await fetch(`/api/cart/${id}`, { method: "DELETE" });
            if (res.ok) {
                setCartItems(prev => prev.filter(item => item.id !== id));
                toast({ title: "Removed", description: "Item removed from cart." });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove item.", variant: "destructive" });
        }
    };

    const handleCheckout = async () => {
        setCheckingOut(true);
        try {
            const res = await fetch("/api/bookings/checkout", { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Checkout failed");
            }

            toast({ title: "Success", description: "Bookings confirmed!" });
            router.push("/dashboard/projects"); // Redirect to projects or bookings list
        } catch (error: any) {
            toast({ title: "Checkout Error", description: error.message, variant: "destructive" });
        } finally {
            setCheckingOut(false);
        }
    };

    if (loading) return <div className="p-8">Loading cart...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Review Bookings</h1>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/projects">Continue Shopping</Link>
                </Button>
            </div>

            {cartItems.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/10">
                    <h3 className="text-lg font-medium text-muted-foreground">Your cart is empty</h3>
                    <Button className="mt-4" asChild>
                        <Link href="/dashboard/projects">Browse Projects</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {cartItems.map((item) => (
                        <Card key={item.id}>
                            <CardHeader>
                                <div className="flex justify-between">
                                    <div className="space-y-1">
                                        <CardTitle>{item.worker_profile?.user?.full_name || 'Worker'} - {item.work_order?.role}</CardTitle>
                                        <CardDescription>
                                            Project: {item.work_order?.project_id} | Rate: ${item.hourly_rate}/hr
                                        </CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Start Date:</span> {new Date(item.start_date).toLocaleDateString()}
                                    </div>
                                    <div>
                                        <span className="font-medium">End Date:</span> {new Date(item.end_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex justify-end pt-4 border-t">
                        <Button size="lg" onClick={handleCheckout} disabled={checkingOut}>
                            {checkingOut ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Confirm & Book <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
