"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Make sure to call `loadStripe` outside of a component’s render
// to avoid recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function StripeCheckoutForm({
    clientSecret,
    onSuccess
}: {
    clientSecret: string,
    onSuccess: (paymentMethodId: string) => void
}) {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        // 1. Submit the form data to Stripe
        const { error: submitError } = await elements.submit();
        if (submitError) {
            toast({ title: "Validation Error", description: submitError.message, variant: "destructive" });
            setIsLoading(false);
            return;
        }

        // 2. Confirm the SetupIntent to tokenize the card without charging it yet.
        // We do NOT want to redirect. We want to save the card, get the PaymentMethod ID, 
        // and then send it to our own backend to create the Bookings and PaymentIntent atomically.
        const { error, setupIntent } = await stripe.confirmSetup({
            elements,
            redirect: 'if_required', // Prevent automatic redirect so we can handle the flow
        });

        if (error) {
            toast({ title: "Card Error", description: error.message, variant: "destructive" });
        } else if (setupIntent && setupIntent.status === 'succeeded') {
            // Success! The card is saved to the Stripe Customer. 
            // The setupIntent contains the generated payment_method string.
            if (typeof setupIntent.payment_method === 'string') {
                onSuccess(setupIntent.payment_method);
            } else {
                toast({ title: "Error", description: "Failed to retrieve payment method ID.", variant: "destructive" });
            }
        } else {
            toast({ title: "Error", description: "Something went wrong saving your card.", variant: "destructive" });
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            <Button
                type="submit"
                disabled={isLoading || !stripe || !elements}
                className="w-full mt-4 bg-blue-900 hover:bg-blue-800 text-white"
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Payment Method"}
            </Button>
        </form>
    );
}

export function CheckoutStripeProvider({ onSuccess }: { onSuccess: (paymentMethodId: string) => void }) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
        // Fetch the SetupIntent client secret
        fetch("/api/stripe/setup-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        })
            .then((res) => res.json())
            .then((data) => setClientSecret(data.clientSecret))
            .catch(err => console.error("Error fetching setup intent:", err));
    }, []);

    if (!clientSecret) {
        return <div className="p-4 text-center text-sm text-gray-500">Loading secure payment form...</div>;
    }

    return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripeCheckoutForm clientSecret={clientSecret} onSuccess={onSuccess} />
        </Elements>
    );
}
