"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Trash2, ArrowRight, BadgeCheck } from "lucide-react";
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

    const handleCheckout = () => {
        // Navigate to the checkout page where the user can confirm details and pay
        // We do not call the API here directly anymore, we let the CheckoutPage handle the final booking
        router.push("/dashboard/checkout");
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

    const totalEstimated = cartItems.reduce((sum, item) => {
        // Estimate 40 hours per week or based on dates
        const start = new Date(item.start_date);
        const end = new Date(item.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const hours = diffDays * 8;
        return sum + (item.hourly_rate * hours);
    }, 0);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Review Bookings</h1>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/projects">Continue Shopping</Link>
                </Button>
            </div>

            {cartItems.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Your cart is empty</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">Looks like you haven't added any workers to your team yet.</p>
                    <Button className="bg-blue-900 hover:bg-blue-800" asChild>
                        <Link href="/dashboard/marketplace">Browse Marketplace</Link>
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {cartItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg border border-white shadow-sm">
                                            {item.worker_profile?.user?.full_name?.charAt(0) || 'W'}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{item.worker_profile?.user?.full_name || 'Worker'} </CardTitle>
                                            <CardDescription className="flex items-center gap-2">
                                                <BadgeCheck size={14} className="text-green-500" />
                                                Verified Professional
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleRemove(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                    <div className="space-y-1">
                                        <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Role & Rate</span>
                                        <p className="font-medium text-gray-900">{item.work_order?.role || 'General Labor'}</p>
                                        <p className="text-gray-600">${item.hourly_rate}/hr</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Duration</span>
                                        <p className="font-medium text-gray-900">{new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}</p>
                                        <p className="text-gray-600">Est. 40 hrs/week</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Project</span>
                                        <p className="font-medium text-gray-900">Work Order #{item.work_order_id.slice(0, 8)}...</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50 p-6 rounded-lg border border-blue-100 gap-4">
                        <div>
                            <p className="text-blue-900 font-medium">Estimated Total (Weekly)</p>
                            <p className="text-3xl font-bold text-blue-900">${totalEstimated.toLocaleString()}</p>
                            <p className="text-blue-600 text-xs">Excludes service fees and taxes</p>
                        </div>
                        <Button size="lg" onClick={handleCheckout} className="w-full md:w-auto bg-blue-900 hover:bg-blue-800 h-12 px-8 text-lg shadow-lg shadow-blue-900/20">
                            Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
