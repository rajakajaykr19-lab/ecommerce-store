'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types';
import { ArrowLeft, Loader2, Clock, CheckCircle, Package, Truck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchOrder();
  }, [user, orderNumber]);

  const fetchOrder = async () => {
    try {
      const res = await api.getOrderByNumber(orderNumber);
      setOrder(res.data);
      setStatus(res.data.status);
    } catch { setOrder(null); }
    setLoading(false);
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await api.updateOrderStatus(order!.id, { status, note, trackingNumber: trackingNumber || undefined });
      toast.success('Order updated');
      fetchOrder();
    } catch (err: any) { toast.error(err.message); }
    setUpdating(false);
  };

  const handleVerifyPayment = async () => {
    setUpdating(true);
    try {
      await api.adminVerifyPayment(order!.id);
      toast.success('Payment verified');
      fetchOrder();
    } catch (err: any) { toast.error(err.message); }
    setUpdating(false);
  };

  const handleGenerateInvoice = async () => {
    setUpdating(true);
    try {
      const res = await api.generateInvoice(order!.id);
      toast.success('Invoice generated');
      if (res.data?.invoiceNumber) {
        window.open(`/api/v1/invoices/html/${res.data.invoiceNumber}`, '_blank');
      }
    } catch (err: any) { toast.error(err.message); }
    setUpdating(false);
  };

  if (loading) return <div className="container-custom py-20 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>;
  if (!order) return <div className="container-custom py-20 text-center"><h1 className="text-2xl font-bold">Order not found</h1></div>;

  return (
    <div className="container-custom py-8">
      <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-6">
        <ArrowLeft size={14} /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
          {order.user && <p className="text-sm text-gray-500">Customer: {order.user.name} ({order.user.email})</p>}
        </div>
        <div className="flex gap-2">
          <span className={`px-4 py-1 text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
          <span className={`px-4 py-1 text-sm font-medium ${getStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="border p-6">
          <h2 className="text-lg font-semibold mb-4">Admin Actions</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Update Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border p-2 text-sm">
                {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking Number (optional)" className="w-full border p-2 text-sm" />
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="w-full border p-2 text-sm" />
            <Button onClick={handleUpdateStatus} loading={updating} className="w-full">Update Order</Button>

            {['UPI', 'BANK_TRANSFER'].includes(order.paymentMethod) && order.paymentStatus !== 'SUCCESS' && (
              <Button onClick={handleVerifyPayment} loading={updating} variant="gold" className="w-full">Verify Payment</Button>
            )}

            <Button onClick={handleGenerateInvoice} loading={updating} variant="outline" className="w-full">Generate Invoice</Button>
          </div>
        </div>

        <div className="border p-6">
          <h2 className="text-lg font-semibold mb-4">Order Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Payment Method</span><span>{order.paymentMethod}</span></div>
            <div className="flex justify-between"><span>Payment Status</span><span>{order.paymentStatus}</span></div>
            {order.upiTxId && <div className="flex justify-between"><span>UPI Tx ID</span><span className="font-mono text-xs">{order.upiTxId}</span></div>}
            <div className="border-t pt-2 mt-2"><span className="font-medium">Subtotal:</span> {formatPrice(order.subtotal)}</div>
            {order.discount > 0 && <div><span className="font-medium">Discount:</span> -{formatPrice(order.discount)}</div>}
            <div><span className="font-medium">Shipping:</span> {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</div>
            <div className="border-t pt-2 font-bold text-lg"><span>Total:</span> {formatPrice(order.total)}</div>
          </div>
        </div>
      </div>

      <div className="border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Items ({order.items.length})</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
              <div className="w-16 h-20 bg-gray-50 flex-shrink-0">
                {item.product?.images?.[0]?.url && (
                  <img src={item.product.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity} x {formatPrice(item.price)}</p>
                <p className="text-sm font-bold mt-1">{formatPrice(item.total)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Status History</h2>
          <div className="space-y-0">
            {order.statusHistory.map((entry: any, idx: number) => {
              const isLast = idx === order.statusHistory.length - 1;
              const statusIcons: Record<string, any> = {
                PENDING: <Clock size={16} className="text-yellow-500" />,
                CONFIRMED: <CheckCircle size={16} className="text-blue-500" />,
                PROCESSING: <Package size={16} className="text-purple-500" />,
                SHIPPED: <Truck size={16} className="text-indigo-500" />,
                DELIVERED: <CheckCircle size={16} className="text-green-500" />,
                CANCELLED: <XCircle size={16} className="text-red-500" />,
                RETURNED: <XCircle size={16} className="text-orange-500" />,
                REFUNDED: <CheckCircle size={16} className="text-teal-500" />,
              };
              return (
                <div key={entry.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {statusIcons[entry.status] || <Clock size={16} className="text-gray-400" />}
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className={`pb-6 ${isLast ? '' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-medium ${getStatusColor(entry.status)}`}>{entry.status}</span>
                      <span className="text-xs text-gray-400">{formatDate(entry.createdAt)}</span>
                    </div>
                    {entry.note && <p className="text-sm text-gray-500 mt-1">{entry.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border p-6">
        <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
        <div className="text-sm space-y-1">
          <p className="font-medium">{order.address.fullName}</p>
          <p>{order.address.phone}</p>
          <p>{order.address.line1}</p>
          {order.address.line2 && <p>{order.address.line2}</p>}
          <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
        </div>
      </div>
    </div>
  );
}
