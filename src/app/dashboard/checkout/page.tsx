"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, FileText, CheckCircle2, ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CartItem } from "@/types";

function CheckoutContent() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const res = await fetch("/api/cart");
            if (res.ok) {
                const data = await res.json();
                setCartItems(data);
                if (data.length === 0) {
                    // Redirect if empty? Or just show empty state.
                    // For now, let's just let them see empty.
                }
            }
        } catch (error) {
            console.error("Failed to fetch cart", error);
            toast({ title: "Error", description: "Failed to load checkout details.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setProcessing(true);
        try {
            const res = await fetch("/api/bookings/checkout", { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Checkout failed");
            }

            setStep(3); // Success state
            toast({ title: "Success", description: "Bookings confirmed!" });
        } catch (error: any) {
            toast({ title: "Checkout Error", description: error.message, variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    // Calculate Totals
    const totalWeeklyEst = cartItems.reduce((sum, item) => {
        const start = new Date(item.start_date);
        const end = new Date(item.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const hours = diffDays * 8;
        return sum + (item.hourly_rate * hours);
    }, 0);

    // Service Fee (Simplification: 30% overhead on top? Or included? 
    // Billing service says: Service Fee is PART of total. 
    // But UI usually shows "Total + Tax/Fee".
    // Let's stick to the previous UI logic: "Service Fee (10%)" added on top for transparency, 
    // even if backend logic is different. 
    // Wait, the backend logic `calculateServiceFee` takes Total and SPLITS it.
    // So `item.hourly_rate` is likely the "Client Bill Rate".
    // So the Worker gets `Rate - Fee`.
    // The UI previously showed: Rate, Est Hours, Service Fee (10%), Total. 
    // That implies Rate + 10% = Total.
    // Let's adjust to be consistent with `billing.ts`: 
    // `billing.ts` says: `serviceFee = total * 0.30`. 
    // That means the Rate IS the Total Bill Rate.
    // So, we should show:
    // Subtotal (Worker Pay + Margin): $X
    // Service Fee (included in rate): $Y
    // Total: $X (Same as Rate * Hours)
    // OR, if we want to show a breakdown:
    // "Total Estimated: $X"
    // "Includes Service Fee: $Y"

    // For this UI, let's keep it simple: Total = Rate * Hours.
    // And mentions fees are included or calculated.

    const serviceFeeEst = totalWeeklyEst * 0.30;


    if (step === 3) {
        return (
            <div className="max-w-2xl mx-auto text-center space-y-6 pt-12">
                <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
                <p className="text-gray-600 max-w-md mx-auto">
                    You have successfully booked your team. A confirmation email has been sent.
                </p>
                <div className="pt-8 flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => router.push('/dashboard/marketplace')}>
                        Browse More Workers
                    </Button>
                    <Button className="bg-blue-900 hover:bg-blue-800 text-white" onClick={() => router.push('/dashboard/bookings')}>
                        View My Bookings
                    </Button>
                </div>
            </div>
        );
    }

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

    if (cartItems.length === 0) {
        return (
            <div className="max-w-4xl mx-auto text-center pt-12 space-y-4">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
                <h2 className="text-xl font-bold">Your cart is empty</h2>
                <Button variant="outline" onClick={() => router.push('/dashboard/marketplace')}>
                    Return to Marketplace
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ChevronLeft size={16} className="mr-1" />
                Cancel & Return
            </button>

            <h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Forms */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Project Details */}
                    <Card className="p-6 border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs mr-2">1</span>
                            Project Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Project</Label>
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-900">
                                    {cartItems[0]?.work_order?.project?.name || "Untitled Project"}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dates">Duration</Label>
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-900">
                                    {cartItems[0]?.start_date ? `${new Date(cartItems[0].start_date).toLocaleDateString()} - ${new Date(cartItems[0].end_date).toLocaleDateString()}` : 'Custom Dates'}
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <Label>Site Address</Label>
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                                    {cartItems[0]?.work_order?.project?.address || "No address provided"}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Payment Method */}
                    <Card className="p-6 border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs mr-2">2</span>
                            Payment Method
                        </h2>
                        <div className="space-y-4">
                            <div className="relative flex items-center space-x-3 rounded-lg border border-blue-200 bg-blue-50 px-6 py-4 shadow-sm">
                                <input type="radio" name="payment" id="card" defaultChecked className="h-4 w-4 border-gray-300 text-blue-900 focus:ring-blue-500" />
                                <div className="min-w-0 flex-1">
                                    <label htmlFor="card" className="font-medium text-gray-900 flex items-center">
                                        <CreditCard size={18} className="mr-2 text-blue-900" />
                                        Credit Card
                                    </label>
                                    <p className="text-gray-500 text-xs">Visa ending in 4242</p>
                                </div>
                            </div>
                            <div className="relative flex items-center space-x-3 rounded-lg border border-gray-200 px-6 py-4 shadow-sm hover:bg-gray-50">
                                <input type="radio" name="payment" id="invoice" className="h-4 w-4 border-gray-300 text-blue-900 focus:ring-blue-500" />
                                <div className="min-w-0 flex-1">
                                    <label htmlFor="invoice" className="font-medium text-gray-900 flex items-center">
                                        <FileText size={18} className="mr-2 text-gray-500" />
                                        Net-30 Invoice
                                    </label>
                                    <p className="text-gray-500 text-xs">Subject to credit approval</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="terms" />
                                <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I agree to the <a href="#" className="underline text-blue-600">Master Service Agreement</a> and <a href="#" className="underline text-blue-600">Privacy Policy</a>
                                </label>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Summary */}
                <div className="space-y-6">
                    <Card className="p-6 border-gray-200 shadow-md bg-gray-50 sticky top-6">
                        <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>

                        <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 max-h-60 overflow-y-auto">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs border border-white shadow-sm shrink-0">
                                        {item.worker_profile?.user?.full_name?.charAt(0) || 'W'}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-gray-900 text-sm">{item.worker_profile?.user?.full_name || 'Worker'}</h4>
                                        <p className="text-xs text-gray-500">{item.work_order?.role}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">${item.hourly_rate}/hr</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Workers</span>
                                <span className="font-medium text-gray-900">{cartItems.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Est. Weekly Hours</span>
                                <span className="font-medium text-gray-900">{cartItems.length * 40}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Includes Service Fee (30%)</span>
                                <span>${serviceFeeEst.toFixed(2)}</span>
                            </div>
                            <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between">
                                <span className="font-bold text-gray-900 text-base">Total Est. Weekly</span>
                                <span className="font-bold text-blue-900 text-xl">${totalWeeklyEst.toFixed(2)}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full mt-8 bg-blue-900 hover:bg-blue-800 h-12 text-lg text-white"
                            onClick={handleConfirm}
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Confirm Booking"
                            )}
                        </Button>
                        <p className="text-xs text-center text-gray-400 mt-3">
                            You won't be charged until the timesheet is approved.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div>Loading checkout...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
