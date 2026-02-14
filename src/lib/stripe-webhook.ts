import { stripe } from './stripe';
import Stripe from 'stripe';

export { stripe };

export async function constructEvent(
    body: string,
    signature: string,
    secret: string
): Promise<Stripe.Event> {
    try {
        return stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err: any) {
        throw new Error(`Webhook Error: ${err.message}`);
    }
}
