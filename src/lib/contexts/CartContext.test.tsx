import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { CartProvider, useCart } from './CartContext';
import * as AuthContext from '@/lib/contexts/AuthContext';

vi.mock('@/lib/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('CartContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CartProvider>{children}</CartProvider>
    );

    it('should initialize with empty cart when no user is present', async () => {
        // Arrange
        (AuthContext.useAuth as any).mockReturnValue({ user: null });

        // Act
        const { result } = renderHook(() => useCart(), { wrapper });

        // Assert
        expect(result.current.cartItems).toEqual([]);
        expect(result.current.cartCount).toBe(0);
        expect(result.current.loading).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch cart items and update state when user is present', async () => {
        // Arrange
        (AuthContext.useAuth as any).mockReturnValue({ user: { id: 'user_1' }, hasCompletedOnboarding: true });
        const mockCartItems = [{ id: 'item_1', worker_id: 'worker_1' }];

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockCartItems,
        });

        // Act
        const { result } = renderHook(() => useCart(), { wrapper });

        // Assert
        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/cart');
        expect(result.current.cartItems).toEqual(mockCartItems);
        expect(result.current.cartCount).toBe(1);
    });

    it('should handle fetch errors gracefully', async () => {
        // Arrange
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (AuthContext.useAuth as any).mockReturnValue({ user: { id: 'user_1' }, hasCompletedOnboarding: true });

        (global.fetch as any).mockResolvedValue({
            ok: false,
        }); // Fails on ok

        // Act
        const { result } = renderHook(() => useCart(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Assert - Error should be caught, cart stays empty
        expect(result.current.cartItems).toEqual([]);

        // Cleanup
        consoleErrorSpy.mockRestore();
    });
});
