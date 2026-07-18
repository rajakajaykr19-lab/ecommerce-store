'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Eye } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => { fetchOrders(); }, [page, statusFilter, search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.getAdminOrders(params);
      setOrders(res.data || []);
      setPagination(res.pagination);
    } catch { setOrders([]); }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateOrderStatus(id, { status });
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search orders..." className="w-full border pl-10 pr-4 py-2 text-sm outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border px-3 py-2 text-sm outline-none">
          <option value="">All Status</option>
          {['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','RETURNED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="text-left p-4 font-medium">Order</th><th className="text-left p-4 font-medium">Customer</th><th className="text-left p-4 font-medium">Items</th><th className="text-left p-4 font-medium">Total</th><th className="text-left p-4 font-medium">Payment</th><th className="text-left p-4 font-medium">Status</th><th className="text-left p-4 font-medium">Date</th><th className="text-left p-4 font-medium">Action</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-12 text-center"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">No orders found</td></tr>
            ) : orders.map((order: any) => (
              <tr key={order.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">#{order.orderNumber}</td>
                <td className="p-4">{order.user?.name || 'N/A'}</td>
                <td className="p-4">{order.items?.length}</td>
                <td className="p-4 font-medium">{formatPrice(order.total)}</td>
                <td className="p-4"><span className={`px-2 py-1 text-xs ${getStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                <td className="p-4"><span className={`px-2 py-1 text-xs ${getStatusColor(order.status)}`}>{order.status}</span></td>
                <td className="p-4 text-xs text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/orders/${order.orderNumber}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><Eye size={12} /> View</Link>
                    <select onChange={(e) => updateStatus(order.id, e.target.value)} defaultValue="" className="border px-2 py-1 text-xs outline-none">
                      <option value="" disabled>Update</option>
                      {['CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
