'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/providers/cart-provider';
import { formatPrice } from '@/lib/utils';
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, total, count, updateItem, removeItem } = useCart();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#1a1a2e] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-[#16213e] transition-colors lg:hidden"
        aria-label="Cart"
      >
        <ShoppingBag size={22} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#e94560] text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Shopping Cart ({count})</h2>
              <button onClick={() => setOpen(false)} className="p-1 hover:text-gray-600"><X size={20} /></button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                <ShoppingBag size={48} />
                <p className="text-lg">Your cart is empty</p>
                <Link href="/shop" onClick={() => setOpen(false)} className="text-sm text-[#1a1a2e] underline">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b">
                      <div className="w-20 h-24 bg-gray-50 flex-shrink-0">
                        {item.product.primaryImage && (
                          <img src={item.product.primaryImage} alt={item.product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.product.slug}`} onClick={() => setOpen(false)} className="text-sm font-medium hover:text-gray-600 line-clamp-2">
                          {item.product.name}
                        </Link>
                        <p className="text-sm font-bold mt-1">{formatPrice((item.product.salePrice || item.product.basePrice) * item.quantity)}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border">
                            <button onClick={() => item.quantity > 1 && updateItem(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-100" disabled={item.quantity <= 1}>
                              <Minus size={14} />
                            </button>
                            <span className="px-3 text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => updateItem(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-100">
                              <Plus size={14} />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Total</span>
                    <span className="text-lg font-bold">{formatPrice(total)}</span>
                  </div>
                  <Link
                    href="/checkout"
                    onClick={() => setOpen(false)}
                    className="block w-full bg-[#1a1a2e] text-white text-center py-3 font-medium hover:bg-[#16213e] transition-colors"
                  >
                    Checkout
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setOpen(false)}
                    className="block w-full text-center py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    View Cart
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
