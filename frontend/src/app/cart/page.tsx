'use client';

import Link from 'next/link';
import { useCart } from '@/providers/cart-provider';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const { user } = useAuth();
  const { items, total, count, updateItem, removeItem, loading } = useCart();

  if (!user) {
    return (
      <div className="container-custom py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>
        <p className="text-gray-500 mb-6">You need to sign in to view your cart</p>
        <Link href="/auth/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  if (loading) {
    return <div className="container-custom py-20 text-center"><div className="animate-pulse text-gray-400">Loading cart...</div></div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-custom py-20 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-200 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-6">Looks like you haven&apos;t added anything yet</p>
        <Link href="/shop"><Button>Continue Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shopping Cart ({count})</h1>
        <Link href="/shop" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
          <ArrowLeft size={14} /> Continue Shopping
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 border p-4">
              <Link href={`/product/${item.product.slug}`} className="w-24 h-28 bg-gray-50 flex-shrink-0">
                {item.product.primaryImage && (
                  <img src={item.product.primaryImage} alt={item.product.name} className="w-full h-full object-cover" />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.product.slug}`} className="text-sm font-medium hover:text-gray-600 line-clamp-2">
                  {item.product.name}
                </Link>
                <p className="text-sm font-bold mt-1">{formatPrice((item.product.salePrice || item.product.basePrice) * item.quantity)}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border">
                    <button onClick={() => item.quantity > 1 && updateItem(item.id, item.quantity - 1)} className="p-2 hover:bg-gray-50" disabled={item.quantity <= 1}>
                      <Minus size={14} />
                    </button>
                    <span className="px-4 text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateItem(item.id, item.quantity + 1)} className="p-2 hover:bg-gray-50">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 text-sm flex items-center gap-1">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border p-6 h-fit sticky top-24">
          <h2 className="text-lg font-bold mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span className="text-green-600">{total >= 499 ? 'FREE' : '₹49'}</span></div>
            <div className="border-t pt-3 flex justify-between text-base font-bold"><span>Total</span><span>{formatPrice(total + (total >= 499 ? 0 : 49))}</span></div>
          </div>
          <Link href="/checkout"><Button className="w-full mt-6">Proceed to Checkout</Button></Link>
        </div>
      </div>
    </div>
  );
}
