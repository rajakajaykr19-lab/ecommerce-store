'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatDate, getStatusColor, formatPrice } from '@/lib/utils';
import type { Order } from '@/types';
import { Package, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function TrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await api.trackOrder(orderNumber.trim());
      setOrder(res.data);
    } catch {
      setError('Order not found. Please check your order number.');
    }
    setLoading(false);
  };

  return (
    <div className="container-custom py-8 md:py-16">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-gray-500">Enter your order number to track the status</p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-2 mb-8">
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="Enter order number (e.g., ORD-...)"
            className="flex-1 border px-4 py-3 text-sm outline-none"
          />
          <Button type="submit" loading={loading} className="flex items-center gap-2"><Search size={16} /> Track</Button>
        </form>

        {error && <p className="text-center text-red-500 text-sm">{error}</p>}

        {order && (
          <div className="border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
              </div>
              <span className={`px-3 py-1 text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
            </div>

            <div className="space-y-4 mb-6">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <div className="w-12 h-14 bg-gray-50 flex-shrink-0" />
                  <span className="flex-1">{item.name} x{item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>

            {order.statusHistory && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Status Updates</h3>
                <div className="space-y-3">
                  {order.statusHistory.map((h) => (
                    <div key={h.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${h.status === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div>
                        <p className="text-sm">{h.status}</p>
                        {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                        <p className="text-xs text-gray-400">{formatDate(h.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <Link href={`/orders/${order.orderNumber}`}><Button variant="outline" size="sm">View Full Details</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
