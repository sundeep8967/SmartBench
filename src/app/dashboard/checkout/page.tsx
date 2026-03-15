"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, ChevronLeft, Loader2, AlertCircle, Briefcase, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CartItem } from "@/types";
import { CheckoutStripeProvider } from "@/components/checkout/stripe-checkout-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function CheckoutContent() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
    const [bookingType, setBookingType] = useState('Short-Term');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const res = await fetch("/api/cart");
            if (res.ok) {
                const data = await res.json();
                setCartItems(data);
                
                // If we have items with project_id, pre-select it
                if (data.length > 0 && data[0].project_id) {
                    setSelectedProjectId(data[0].project_id);
                }
                
                if (data.length > 0) {
                    // Fetch projects using the borrower_company_id of the first cart item
                    fetchProjects((data[0] as any).borrower_company_id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch cart", error);
            toast({ title: "Error", description: "Failed to load checkout details.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async (companyId: string) => {
        try {
            const res = await fetch(`/api/projects/list?companyId=${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error("Failed to fetch projects", error);
        }
    };

    const handleConfirm = async () => {
        if (!selectedProjectId) {
            toast({ title: "Project Required", description: "Please select a project to proceed.", variant: "destructive" });
            return;
        }

        if (!paymentMethodId) {
            toast({ title: "Payment Required", description: "Please save a payment method first.", variant: "destructive" });
            return;
        }
        
        if (!agreedToTerms) {
            toast({ title: "Agreement Required", description: "Please agree to the Master Service Agreement and Privacy Policy.", variant: "destructive" });
            return;
        }

        setProcessing(true);
        try {
            const res = await fetch("/api/bookings/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentMethodId, bookingType, projectId: selectedProjectId })
            });
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
        return sum + (item.hourly_rate * 1.30 * hours);
    }, 0);

    const serviceFeeEst = cartItems.reduce((sum, item) => {
        const start = new Date(item.start_date);
        const end = new Date(item.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const hours = diffDays * 8;
        return sum + (item.hourly_rate * 0.30 * hours);
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
                                <Label>Select Project</Label>
                                {projects.length === 0 ? (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 flex flex-col space-y-2">
                                        <p className="font-medium flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            No projects available
                                        </p>
                                        <p className="text-xs">You must create a project before you can book workers.</p>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full bg-white hover:bg-yellow-100 text-yellow-900 border-yellow-300 mt-2"
                                            onClick={() => router.push('/dashboard/projects')}
                                        >
                                            Create a Project
                                        </Button>
                                    </div>
                                ) : (
                                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Select a project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map((proj) => (
                                                <SelectItem key={proj.id} value={proj.id}>
                                                    {proj.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
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
                                    {projects.find(p => p.id === selectedProjectId)?.address || "No address provided for selected project"}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Booking Type Selection */}
                    <Card className="p-6 border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs mr-2">2</span>
                            Booking Type
                        </h2>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Select the expected duration for this booking. This helps set the correct terms and conditions.
                            </p>

                            <RadioGroup value={bookingType} onValueChange={setBookingType} className="space-y-3">
                                <div className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${bookingType === 'Short-Term' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'}`} onClick={() => setBookingType('Short-Term')}>
                                    <RadioGroupItem value="Short-Term" id="short-term" className="mt-1" />
                                    <div className="flex flex-col">
                                        <Label htmlFor="short-term" className="font-semibold cursor-pointer text-gray-900 flex items-center">
                                            <Calendar size={16} className="mr-2 text-blue-600" />
                                            Short-Term (1 - 4 Weeks)
                                        </Label>
                                        <p className="text-xs text-gray-500 mt-1 cursor-pointer">Ideal for quick projects, fill-ins, or temporary surges in volume.</p>
                                    </div>
                                </div>
                                <div className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${bookingType === 'Long-Term' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'}`} onClick={() => setBookingType('Long-Term')}>
                                    <RadioGroupItem value="Long-Term" id="long-term" className="mt-1" />
                                    <div className="flex flex-col">
                                        <Label htmlFor="long-term" className="font-semibold cursor-pointer text-gray-900 flex items-center">
                                            <Briefcase size={16} className="mr-2 text-blue-600" />
                                            Long-Term (4+ Weeks)
                                        </Label>
                                        <p className="text-xs text-gray-500 mt-1 cursor-pointer">Best for extended projects or semi-permanent placements.</p>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </Card>

                    {/* Payment Method */}
                    <Card className="p-6 border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs mr-2">3</span>
                            Payment Method
                        </h2>

                        {paymentMethodId ? (
                            <div className="bg-green-50 text-green-800 p-4 rounded-md border border-green-200 flex items-center">
                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                Payment Method Saved Successfully. You can now confirm your booking.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    Please enter your card details. Your card will not be charged until the timesheet is approved, or according to the weekly progress payment schedule.
                                </p>
                                <CheckoutStripeProvider onSuccess={(id) => setPaymentMethodId(id)} />
                            </div>
                        )}

                        <div className="mt-6 space-y-4">
                            <div className="flex items-start space-x-3">
                                <Checkbox 
                                    id="terms" 
                                    checked={agreedToTerms} 
                                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} 
                                    className="mt-1"
                                />
                                <div className="space-y-1 leading-none">
                                    <label htmlFor="terms" className="text-sm font-medium cursor-pointer text-gray-900">
                                        I adhere to the Terms & Conditions
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        I agree to the <a href="#" className="underline text-blue-600 hover:text-blue-800">Master Service Agreement</a> and <a href="#" className="underline text-blue-600 hover:text-blue-800">Privacy Policy</a>
                                    </p>
                                </div>
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
                                        {(item as any).worker?.full_name?.charAt(0) || 'W'}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-gray-900 text-sm">{(item as any).worker?.full_name || 'Worker'}</h4>
                                        <p className="text-xs text-gray-500">{(item as any).worker_profile?.trade || 'General Labor'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">${(item.hourly_rate * 1.30).toFixed(2)}/hr</p>
                                        <p className="text-[10px] text-gray-400 font-medium">All-inclusive</p>
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
                            className="w-full mt-8 bg-blue-900 hover:bg-blue-800 h-12 text-lg text-white disabled:bg-gray-300 disabled:text-gray-500"
                            onClick={handleConfirm}
                            disabled={processing || !paymentMethodId || !selectedProjectId || !agreedToTerms}
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
