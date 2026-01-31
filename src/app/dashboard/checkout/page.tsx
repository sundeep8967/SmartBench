"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, FileText, CheckCircle2, ChevronLeft, MapPin } from "lucide-react";

// Helper to wrap search params usage
function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const workerId = searchParams.get('workerId');
    const [step, setStep] = useState(1);

    // Mock worker lookup (in real app, fetch from API)
    const worker = {
        name: "Mike Ross",
        role: "Master Electrician",
        rate: 55,
        avatar: "MR",
        location: "Minneapolis, MN"
    };

    const handleConfirm = () => {
        // Simulate API call
        setTimeout(() => {
            setStep(3); // Success state
        }, 1000);
    };

    if (step === 3) {
        return (
            <div className="max-w-2xl mx-auto text-center space-y-6 pt-12">
                <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
                <p className="text-gray-600 max-w-md mx-auto">
                    You have successfully booked <strong>{worker.name}</strong>. A confirmation email has been sent to your inbox.
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
                                <Label htmlFor="project">Select Project</Label>
                                <select id="project" className="w-full h-10 px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option>Downtown Office Complex</option>
                                    <option>Riverside Apartments</option>
                                    <option>+ Create New Project</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dates">Duration</Label>
                                <select id="dates" className="w-full h-10 px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option>1 Week (40 Hours)</option>
                                    <option>2 Weeks (80 Hours)</option>
                                    <option>1 Month (160 Hours)</option>
                                </select>
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <Label htmlFor="address">Site Address</Label>
                                <Input id="address" placeholder="123 Construction Way, Minneapolis, MN 55401" defaultValue="100 S Washington Ave, Minneapolis, MN" />
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

                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                            <div className="h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm border border-white shadow-sm shrink-0">
                                {worker.avatar}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{worker.name}</h4>
                                <p className="text-sm text-gray-500">{worker.role}</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Hourly Rate</span>
                                <span className="font-medium text-gray-900">${worker.rate.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Est. Hours (1 Week)</span>
                                <span className="font-medium text-gray-900">40</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Service Fee (10%)</span>
                                <span className="font-medium text-gray-900">${(worker.rate * 40 * 0.10).toFixed(2)}</span>
                            </div>
                            <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between">
                                <span className="font-bold text-gray-900 text-base">Total Est. Weekly</span>
                                <span className="font-bold text-blue-900 text-xl">${(worker.rate * 40 * 1.10).toFixed(2)}</span>
                            </div>
                        </div>

                        <Button className="w-full mt-8 bg-blue-900 hover:bg-blue-800 h-12 text-lg text-white" onClick={handleConfirm}>
                            Confirm Booking
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
