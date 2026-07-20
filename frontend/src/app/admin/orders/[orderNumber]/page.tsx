'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  Download,
  Printer,
  FileText,
  Send,
  RotateCcw,
  CreditCard,
  MapPin,
  User,
  Hash,
  Calendar,
  StickyNote,
  Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order, OrderStatus, Return, Refund, Shipment } from '@/types';

type TabKey = 'overview' | 'items' | 'timeline' | 'actions' | 'returns' | 'refunds';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'items', label: 'Items' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'actions', label: 'Actions' },
  { key: 'returns', label: 'Returns' },
  { key: 'refunds', label: 'Refunds' },
];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURNED', 'REFUNDED'],
  CANCELLED: [],
  RETURNED: ['REFUNDED'],
  REFUNDED: [],
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock size={16} className="text-yellow-500" />,
  CONFIRMED: <CheckCircle size={16} className="text-blue-500" />,
  PROCESSING: <Package size={16} className="text-purple-500" />,
  SHIPPED: <Truck size={16} className="text-indigo-500" />,
  OUT_FOR_DELIVERY: <Truck size={16} className="text-orange-500" />,
  DELIVERED: <CheckCircle size={16} className="text-green-500" />,
  CANCELLED: <XCircle size={16} className="text-red-500" />,
  RETURNED: <RotateCcw size={16} className="text-orange-500" />,
  REFUNDED: <CheckCircle size={16} className="text-teal-500" />,
};

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierPartner, setCourierPartner] = useState('');
  const [courierPartners, setCourierPartners] = useState<any[]>([]);

  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('ORIGINAL');
  const [refundReason, setRefundReason] = useState('');
  const [showRefundForm, setShowRefundForm] = useState(false);

  const [shipmentCourier, setShipmentCourier] = useState('');
  const [shipmentTracking, setShipmentTracking] = useState('');
  const [shipmentWeight, setShipmentWeight] = useState('');
  const [showShipmentForm, setShowShipmentForm] = useState(false);

  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.getOrderByNumber(orderNumber);
      setOrder(res.data);
      setStatus(res.data.status);
      setTrackingNumber(res.data.trackingNumber || '');
      setCourierPartner(res.data.courierPartner || '');
      if (res.data.subtotal) {
        setRefundAmount(String(res.data.total));
      }
    } catch {
      setOrder(null);
    }
    setLoading(false);
  }, [orderNumber]);

  useEffect(() => {
    if (!user) return;
    fetchOrder();
  }, [user, fetchOrder]);

  useEffect(() => {
    api
      .getCourierPartners()
      .then((res) => setCourierPartners(res.data || []))
      .catch(() => {});
  }, []);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await api.updateOrderStatus(order!.id, {
        status,
        note: note || undefined,
        trackingNumber: trackingNumber || undefined,
        courierPartner: courierPartner || undefined,
      });
      toast.success('Order updated successfully');
      setNote('');
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    }
    setUpdating(false);
  };

  const handleVerifyPayment = async () => {
    setUpdating(true);
    try {
      await api.adminVerifyPayment(order!.id);
      toast.success('Payment verified successfully');
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    }
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
    } catch (err: any) {
      toast.error(err.message);
    }
    setUpdating(false);
  };

  const handleDownloadInvoice = async () => {
    setUpdating(true);
    try {
      if (order?.invoice?.invoiceNumber) {
        const res = await api.getInvoicePDF(order.invoice.invoiceNumber);
        if (res.data?.pdfUrl) {
          window.open(res.data.pdfUrl, '_blank');
        } else {
          window.open(`/api/v1/invoices/pdf/${order.invoice.invoiceNumber}`, '_blank');
        }
        toast.success('Invoice PDF opened');
      } else {
        toast.error('No invoice found. Generate one first.');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setUpdating(false);
  };

  const handleCreateShipment = async () => {
    if (!shipmentCourier || !shipmentTracking) {
      toast.error('Courier partner and tracking number are required');
      return;
    }
    setUpdating(true);
    try {
      await api.createShipment({
        orderId: order!.id,
        courierPartner: shipmentCourier,
        trackingNumber: shipmentTracking,
        weight: shipmentWeight ? parseFloat(shipmentWeight) : undefined,
      });
      toast.success('Shipment created');
      setShowShipmentForm(false);
      setShipmentCourier('');
      setShipmentTracking('');
      setShipmentWeight('');
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    }
    setUpdating(false);
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    setUpdating(true);
    try {
      await api.updateOrderStatus(order!.id, {
        status: 'CANCELLED',
        note: cancelReason,
      });
      toast.success('Order cancelled');
      setShowCancel(false);
      setCancelReason('');
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    }
    setUpdating(false);
  };

  const handleCreateRefund = async () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }
    setUpdating(true);
    try {
      await api.createRefund({
        orderId: order!.id,
        amount: parseFloat(refundAmount),
        method: refundMethod,
        reason: refundReason || undefined,
      });
      toast.success('Refund created');
      setShowRefundForm(false);
      setRefundReason('');
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message);
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="container-custom py-20 text-center">
        <Loader2 className="animate-spin mx-auto text-[#d4a853]" size={40} />
        <p className="mt-4 text-sm text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-custom py-20 text-center">
        <XCircle className="mx-auto text-red-400 mb-4" size={48} />
        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
        <p className="text-gray-500 mb-6">The order &quot;{orderNumber}&quot; does not exist or has been removed.</p>
        <Link href="/admin/orders">
          <Button variant="outline">
            <ArrowLeft size={16} className="mr-2" /> Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const validTransitions = STATUS_TRANSITIONS[order.status] || [];
  const canShip = !order.shipment && ['PROCESSING', 'SHIPPED'].includes(order.status);

  return (
    <div className="container-custom py-8 max-w-7xl mx-auto">
      {/* Header */}
      <Link
        href="/admin/orders"
        className="text-sm text-gray-500 hover:text-[#d4a853] flex items-center gap-1 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.paymentStatus)}`}>
              Payment: {order.paymentStatus}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {formatDate(order.createdAt)}
            </span>
            {order.user && (
              <span className="flex items-center gap-1">
                <User size={13} /> {order.user.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer size={14} className="mr-1" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadInvoice} loading={updating}>
            <Download size={14} className="mr-1" /> Invoice PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex overflow-x-auto gap-0 -mb-px">
          {TABS.map((tab) => {
            const count =
              tab.key === 'returns'
                ? order.returns?.length || 0
                : tab.key === 'refunds'
                ? order.refunds?.length || 0
                : tab.key === 'items'
                ? order.items.length
                : null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#d4a853] text-[#d4a853]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {count !== null && count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Hash size={14} /> Order Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Number</span>
                <span className="font-semibold">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              {order.deliveredAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivered</span>
                  <span>{formatDate(order.deliveredAt)}</span>
                </div>
              )}
              {order.cancelledAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cancelled</span>
                  <span>{formatDate(order.cancelledAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <User size={14} /> Customer
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{order.user?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="truncate max-w-[180px]">{order.user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span>{order.user?.phone || order.address?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <CreditCard size={14} /> Payment
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.upiTxId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">UPI Tx ID</span>
                  <span className="font-mono text-xs truncate max-w-[140px]">{order.upiTxId}</span>
                </div>
              )}
              {order.paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment ID</span>
                  <span className="font-mono text-xs truncate max-w-[140px]">{order.paymentId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Totals */}
          <div className="border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <FileText size={14} /> Order Totals
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-[#d4a853]">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <MapPin size={14} /> Delivery Address
            </h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.address.fullName}</p>
              <p className="text-gray-500">{order.address.phone}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>
                {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
              {order.address.country && <p className="text-gray-500">{order.address.country}</p>}
            </div>
          </div>

          {/* Shipment Info */}
          {order.shipment ? (
            <div className="border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Truck size={14} /> Shipment
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Courier</span>
                  <span className="font-medium">{order.shipment.courierPartner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tracking #</span>
                  <span className="font-mono text-xs">{order.shipment.trackingNumber}</span>
                </div>
                {order.shipment.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Est. Delivery</span>
                    <span>{formatDate(order.shipment.estimatedDelivery)}</span>
                  </div>
                )}
                {order.shipment.actualDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Actual Delivery</span>
                    <span>{formatDate(order.shipment.actualDelivery)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(order.shipment.status)}`}>
                    {order.shipment.status}
                  </span>
                </div>
                {order.shipment.weight && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Weight</span>
                    <span>{order.shipment.weight} kg</span>
                  </div>
                )}
                {order.shipment.trackingUrl && (
                  <a
                    href={order.shipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#d4a853] hover:underline mt-2"
                  >
                    <Truck size={12} /> Track Shipment
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 border-dashed p-6 flex flex-col items-center justify-center text-center">
              <Truck size={32} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No shipment created yet</p>
              {canShip && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setActiveTab('actions'); setShowShipmentForm(true); }}>
                  Create Shipment
                </Button>
              )}
            </div>
          )}

          {/* Admin Notes */}
          {order.adminNotes && (
            <div className="border border-gray-200 p-6 md:col-span-2 lg:col-span-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <StickyNote size={14} /> Admin Notes
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.adminNotes}</p>
            </div>
          )}

          {/* Customer Notes */}
          {order.customerNotes && (
            <div className="border border-gray-200 p-6 md:col-span-2 lg:col-span-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Edit2 size={14} /> Customer Notes
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.customerNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Items */}
      {activeTab === 'items' && (
        <div className="border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold">Order Items ({order.items.length})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-5 p-6">
                <div className="w-20 h-24 bg-gray-50 flex-shrink-0 rounded overflow-hidden border border-gray-100">
                  {item.product?.images?.[0]?.url ? (
                    <img src={item.product.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                  ) : item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                    <span>SKU: {item.sku}</span>
                    {item.size && <span>Size: {item.size}</span>}
                    {item.color && <span>Color: {item.color}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {item.quantity} x {formatPrice(item.price)}
                    </span>
                    <span className="font-bold text-sm">{formatPrice(item.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="space-y-1 text-sm max-w-xs ml-auto">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-300 pt-1 font-bold">
                <span>Total</span>
                <span className="text-[#d4a853]">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Timeline */}
      {activeTab === 'timeline' && (
        <div className="max-w-3xl">
          <div className="border border-gray-200 p-6">
            <h3 className="font-semibold mb-6">Status History</h3>
            {order.statusHistory && order.statusHistory.length > 0 ? (
              <div className="relative">
                {order.statusHistory.map((entry, idx) => {
                  const isLast = idx === order.statusHistory.length - 1;
                  return (
                    <div key={entry.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center z-10">
                          {STATUS_ICONS[entry.status] || <Clock size={16} className="text-gray-400" />}
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-gray-200 min-h-[40px]" />}
                      </div>
                      <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(entry.createdAt)}</span>
                        </div>
                        {entry.changedBy && (
                          <p className="text-xs text-gray-400 mt-1">
                            by {entry.changedBy}
                          </p>
                        )}
                        {entry.note && (
                          <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded px-3 py-2">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                <Clock size={32} className="mx-auto mb-2" />
                <p className="text-sm">No status history available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Actions */}
      {activeTab === 'actions' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Status Update */}
          <div className="border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Edit2 size={16} /> Update Status
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">New Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 text-sm rounded focus:outline-none focus:border-[#d4a853]"
                >
                  {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].map(
                    (s) => (
                      <option key={s} value={s} disabled={!validTransitions.includes(s) && s !== order.status}>
                        {s} {s === order.status ? '(current)' : !validTransitions.includes(s) ? '(unavailable)' : ''}
                      </option>
                    )
                  )}
                </select>
                {validTransitions.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Valid transitions: {validTransitions.join(', ')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Courier Partner</label>
                <select
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 text-sm rounded focus:outline-none focus:border-[#d4a853]"
                >
                  <option value="">Select courier</option>
                  {courierPartners.map((cp: any) => (
                    <option key={cp.id || cp.name} value={cp.name || cp.id}>
                      {cp.name || cp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full border border-gray-300 p-2.5 text-sm rounded focus:outline-none focus:border-[#d4a853]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Admin Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note about this update..."
                  rows={3}
                  className="w-full border border-gray-300 p-2.5 text-sm rounded resize-none focus:outline-none focus:border-[#d4a853]"
                />
              </div>

              <Button onClick={handleUpdateStatus} loading={updating} className="w-full">
                Update Order
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Send size={16} /> Quick Actions
            </h3>
            <div className="space-y-3">
              {['UPI', 'BANK_TRANSFER'].includes(order.paymentMethod) && order.paymentStatus !== 'SUCCESS' && (
                <Button onClick={handleVerifyPayment} loading={updating} variant="gold" className="w-full">
                  <CheckCircle size={14} className="mr-2" /> Verify Payment
                </Button>
              )}

              <Button onClick={handleGenerateInvoice} loading={updating} variant="outline" className="w-full">
                <FileText size={14} className="mr-2" /> Generate Invoice
              </Button>

              <Button onClick={handleDownloadInvoice} loading={updating} variant="outline" className="w-full">
                <Download size={14} className="mr-2" /> Download Invoice PDF
              </Button>

              {order.invoice?.pdfUrl && (
                <a href={order.invoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full">
                    <Download size={14} className="mr-2" /> View Existing Invoice
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Create Shipment */}
          {canShip && (
            <div className="border border-gray-200 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Truck size={16} /> Create Shipment
              </h3>
              {showShipmentForm ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Courier Partner</label>
                    <select
                      value={shipmentCourier}
                      onChange={(e) => setShipmentCourier(e.target.value)}
                      className="w-full border border-gray-300 p-2.5 text-sm rounded focus:outline-none focus:border-[#d4a853]"
                    >
                      <option value="">Select courier</option>
                      {courierPartners.map((cp: any) => (
                        <option key={cp.id || cp.name} value={cp.name || cp.id}>
                          {cp.name || cp}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={shipmentTracking}
                      onChange={(e) => setShipmentTracking(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full border border-gray-300 p-2.5 text-sm rounded focus:outline-none focus:border-[#d4a853]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={shipmentWeight}
                      onChange={(e) => setShipmentWeight(e.target.value)}
                      placeholder="Optional weight in kg"
                      step="0.1"
                      className="w-full border border-gray-300 p-2.5 text-sm rounded focus:outline-none focus:border-[#d4a853]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateShipment} loading={updating} className="flex-1">
                      Create Shipment
                    </Button>
                    <Button variant="ghost" onClick={() => setShowShipmentForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowShipmentForm(true)} className="w-full">
                  <Truck size={14} className="mr-2" /> Create Shipment
                </Button>
              )}
            </div>
          )}

          {/* Cancel Order */}
          {!['CANCELLED', 'DELIVERED', 'REFUNDED'].includes(order.status) && (
            <div className="border border-red-200 p-6 bg-red-50/30">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-600">
                <XCircle size={16} /> Cancel Order
              </h3>
              {showCancel ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Cancellation Reason</label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Provide a reason for cancellation..."
                      rows={3}
                      className="w-full border border-gray-300 p-2.5 text-sm rounded resize-none focus:outline-none focus:border-red-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCancelOrder} loading={updating} variant="danger" className="flex-1">
                      Confirm Cancel
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowCancel(false); setCancelReason(''); }}>
                      Back
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="danger" onClick={() => setShowCancel(true)} className="w-full">
                  <XCircle size={14} className="mr-2" /> Cancel Order
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Returns */}
      {activeTab === 'returns' && (
        <div className="max-w-4xl">
          {order.returns && order.returns.length > 0 ? (
            <div className="border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold">Return Requests ({order.returns.length})</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {order.returns.map((ret) => (
                  <div
                    key={ret.id}
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedReturn(selectedReturn?.id === ret.id ? null : ret)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">#{ret.returnNumber}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(ret.status)}`}>
                            {ret.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{ret.reason}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(ret.createdAt)}</p>
                      </div>
                      <RotateCcw size={16} className="text-gray-400 mt-1" />
                    </div>

                    {selectedReturn?.id === ret.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
                        {ret.description && (
                          <div>
                            <span className="text-gray-500">Description: </span>
                            <span>{ret.description}</span>
                          </div>
                        )}
                        {ret.refundAmount && (
                          <div>
                            <span className="text-gray-500">Refund Amount: </span>
                            <span className="font-semibold">{formatPrice(ret.refundAmount)}</span>
                          </div>
                        )}
                        {ret.adminNotes && (
                          <div>
                            <span className="text-gray-500">Admin Notes: </span>
                            <span>{ret.adminNotes}</span>
                          </div>
                        )}
                        {ret.inspectionNotes && (
                          <div>
                            <span className="text-gray-500">Inspection Notes: </span>
                            <span>{ret.inspectionNotes}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-2">
                          {ret.pickupDate && <span>Pickup: {formatDate(ret.pickupDate)}</span>}
                          {ret.deliveredBackAt && <span>Returned: {formatDate(ret.deliveredBackAt)}</span>}
                          {ret.inspectedAt && <span>Inspected: {formatDate(ret.inspectedAt)}</span>}
                          {ret.resolvedAt && <span>Resolved: {formatDate(ret.resolvedAt)}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 border-dashed p-12 text-center">
              <RotateCcw size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">No return requests for this order</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Refunds */}
      {activeTab === 'refunds' && (
        <div className="max-w-4xl">
          <div className="mb-6">
            <Button variant="gold" onClick={() => setShowRefundForm(!showRefundForm)}>
              <CreditCard size={14} className="mr-2" /> Create Refund
            </Button>
          </div>

          {showRefundForm && (
            <div className="border border-gray-200 p-6 mb-6 bg-gray-50">
              <h3 className="font-semibold mb-4">New Refund</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount (max {formatPrice(order.total)})</label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    max={order.total}
                    step="1"
                    className="w-full border border-gray-300 p-2.5 text-sm rounded focus:outline-none focus:border-[#d4a853]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Method</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="w-full border border-gray-300 p-2.5 text-sm rounded focus:outline-none focus:border-[#d4a853]"
                  >
                    <option value="ORIGINAL">Original Payment Method</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="WALLET">Wallet Credit</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Reason for refund..."
                    rows={2}
                    className="w-full border border-gray-300 p-2.5 text-sm rounded resize-none focus:outline-none focus:border-[#d4a853]"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleCreateRefund} loading={updating}>
                  Create Refund
                </Button>
                <Button variant="ghost" onClick={() => setShowRefundForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {order.refunds && order.refunds.length > 0 ? (
            <div className="border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold">Refunds ({order.refunds.length})</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {order.refunds.map((refund) => (
                  <div key={refund.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">#{refund.refundNumber}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(refund.status)}`}>
                            {refund.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="font-semibold text-gray-800">{formatPrice(refund.amount)}</span>
                          <span>via {refund.method}</span>
                          <span>{formatDate(refund.createdAt)}</span>
                        </div>
                        {refund.reason && <p className="text-sm text-gray-500 mt-1">{refund.reason}</p>}
                        {refund.transactionId && (
                          <p className="text-xs text-gray-400 mt-1 font-mono">Tx: {refund.transactionId}</p>
                        )}
                        {refund.failureReason && (
                          <p className="text-sm text-red-500 mt-1">Failed: {refund.failureReason}</p>
                        )}
                      </div>
                      <CreditCard size={16} className="text-gray-400 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !showRefundForm && (
              <div className="border border-gray-200 border-dashed p-12 text-center">
                <CreditCard size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400">No refunds for this order</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
