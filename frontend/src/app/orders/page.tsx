'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate, getStatusColor, getImageUrl } from '@/lib/utils';
import type { Order } from '@/types';
import { Package, Loader2 } from 'lucide-react';

const STATUS_TABS = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchOrders();
  }, [user, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.getOrders(params);
      setOrders(res.data || []);
    } catch { setOrders([]); }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="container-custom py-20 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>
        <Link href="/auth/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border ${statusFilter === status ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'hover:bg-gray-50'}`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 mb-4">No orders found</p>
          <Link href="/shop"><Button>Start Shopping</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border p-4 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-16 h-20 bg-gray-50 flex-shrink-0">
                      {item.product?.images?.[0]?.url && (
                        <img src={getImageUrl(item.product.images[0].url)} alt={item.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                    <p className="text-sm font-bold">{formatPrice(item.total)}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="font-bold">{formatPrice(order.total)}</p>
                <div className="flex gap-2">
                  <Link href={`/orders/${order.orderNumber}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                  <Link href={`/tracking?order=${order.orderNumber}`}>
                    <Button variant="ghost" size="sm">Track</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
