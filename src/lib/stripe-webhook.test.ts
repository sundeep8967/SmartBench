import { describe, it, expect, vi } from 'vitest';
import { constructEvent, stripe } from './stripe-webhook';

vi.mock('./stripe', () => ({
    stripe: {
        webhooks: {
            constructEvent: vi.fn(),
        },
    },
}));

describe('stripe-webhook', () => {
    describe('constructEvent', () => {
        it('should call stripe.webhooks.constructEvent with correct parameters', async () => {
            // Arrange
            const mockEvent = { id: 'evt_123', type: 'payment_intent.succeeded' };
            (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);

            const body = '{"id":"evt_123"}';
            const signature = 't=123,v1=123';
            const secret = 'whsec_123';

            // Act
            const result = await constructEvent(body, signature, secret);

            // Assert
            expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(body, signature, secret);
            expect(result).toEqual(mockEvent);
        });

        it('should throw an Error when constructEvent fails', async () => {
            // Arrange
            (stripe.webhooks.constructEvent as any).mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            const body = '{"id":"evt_123"}';
            const signature = 't=123,v1=123';
            const secret = 'whsec_123';

            // Act & Assert
            await expect(constructEvent(body, signature, secret)).rejects.toThrow(
                'Webhook Error: Invalid signature'
            );
        });
    });
});
