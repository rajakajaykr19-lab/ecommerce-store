'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor, getImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types';
import { ArrowLeft, Package, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchOrder();
  }, [user, orderNumber]);

  const fetchOrder = async () => {
    try {
      const res = await api.getOrderByNumber(orderNumber);
      setOrder(res.data);
    } catch { setOrder(null); }
    setLoading(false);
  };

  const handleDownloadInvoice = async () => {
    try {
      const res = await api.getInvoice(orderNumber);
      if (res.data?.invoiceNumber) {
        window.open(`/api/v1/invoices/html/${res.data.invoiceNumber}`, '_blank');
      } else {
        toast.error('No invoice found. Please contact support.');
      }
    } catch {
      toast.error('Invoice not available yet');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await api.cancelOrder(orderNumber);
      toast.success('Order cancelled');
      fetchOrder();
    } catch (err: any) { toast.error(err.message); }
    setCancelling(false);
  };

  if (loading) return <div className="container-custom py-20 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>;
  if (!order) return <div className="container-custom py-20 text-center"><h1 className="text-2xl font-bold">Order not found</h1><Link href="/orders"><Button variant="outline" className="mt-4">Back to Orders</Button></Link></div>;

  return (
    <div className="container-custom py-8">
      <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-6">
        <ArrowLeft size={14} /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-4 py-1 text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
          <span className={`px-4 py-1 text-sm font-medium ${getStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
        </div>
      </div>

      {/* Timeline */}
      {order.statusHistory && (
        <div className="border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Order Timeline</h2>
          <div className="space-y-4">
            {order.statusHistory.map((h) => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-[#1a1a2e] flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{h.status}</p>
                  {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                  <p className="text-xs text-gray-400">{formatDate(h.createdAt, { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Items ({order.items.length})</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
              <div className="w-20 h-24 bg-gray-50 flex-shrink-0">
                {item.product?.images?.[0]?.url && (
                  <img src={getImageUrl(item.product.images[0].url)} alt={item.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <Link href={`/product/${item.product?.slug}`} className="text-sm font-medium hover:text-gray-600">
                  {item.name}
                </Link>
                <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                <p className="text-sm font-bold mt-1">{formatPrice(item.total)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary & Address */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="border p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span>{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Payment: {order.paymentMethod}</p>
          {order.trackingNumber && <p className="text-sm mt-2">Tracking: {order.trackingNumber}</p>}
        </div>

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

      <div className="mt-8 flex gap-3">
        <Button variant="outline" onClick={handleDownloadInvoice}>
          <FileText size={16} className="mr-2" /> Download Invoice
        </Button>
        {['PENDING', 'CONFIRMED'].includes(order.status) && (
          <Button variant="danger" onClick={handleCancel} loading={cancelling}>Cancel Order</Button>
        )}
      </div>
    </div>
  );
}
