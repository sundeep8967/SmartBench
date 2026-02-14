"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";

type CartItem = {
    id: string;
    worker_id: string;
    [key: string]: any;
};

type CartContextType = {
    cartItems: CartItem[];
    cartCount: number;
    refreshCart: () => Promise<void>;
    loading: boolean;
};

const CartContext = createContext<CartContextType>({
    cartItems: [],
    cartCount: 0,
    refreshCart: async () => { },
    loading: false,
});

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);

    const cartCount = cartItems.length;

    const refreshCart = useCallback(async () => {
        if (!user) {
            setCartItems([]);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("/api/cart");
            if (res.ok) {
                const data = await res.json();
                setCartItems(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch cart items:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    return (
        <CartContext.Provider value={{ cartItems, cartCount, refreshCart, loading }}>
            {children}
        </CartContext.Provider>
    );
}
