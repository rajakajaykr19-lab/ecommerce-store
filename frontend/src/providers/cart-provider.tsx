'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './auth-provider';
import type { CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  total: number;
  count: number;
  loading: boolean;
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateItem: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) { setItems([]); setTotal(0); return; }
    try {
      setLoading(true);
      const res = await api.getCart();
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setItems([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refreshCart(); }, [refreshCart]);

  const addItem = async (productId: string, quantity = 1, variantId?: string) => {
    await api.addToCart(productId, quantity, variantId);
    await refreshCart();
  };

  const updateItem = async (id: string, quantity: number) => {
    await api.updateCartItem(id, quantity);
    await refreshCart();
  };

  const removeItem = async (id: string) => {
    await api.removeFromCart(id);
    await refreshCart();
  };

  const clearCart = async () => {
    await api.clearCart();
    setItems([]);
    setTotal(0);
  };

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, total, count, loading, addItem, updateItem, removeItem, clearCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
