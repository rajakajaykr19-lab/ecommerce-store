'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Loader2, Search, Eye, Download, ChevronDown, Filter, X,
  CheckCircle, Package, Truck, XCircle, Clock, ArrowUpDown,
  FileText, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Order, OrderStatus } from '@/types';

const ORDER_STATUSES = [
  'ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED',
] as const;

const PAYMENT_STATUSES = ['ALL', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] as const;

const PAYMENT_METHODS = ['ALL', 'RAZORPAY', 'STRIPE', 'COD', 'UPI'] as const;

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Latest' },
  { value: 'createdAt:asc', label: 'Oldest' },
  { value: 'total:desc', label: 'Highest Amount' },
  { value: 'total:asc', label: 'Lowest Amount' },
];

const QUICK_STATUSES: OrderStatus[] = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<any>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkCancelDialog, setShowBulkCancelDialog] = useState(false);
  const [bulkCancelReason, setBulkCancelReason] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.getOrderDashboardStats();
      setStats(res.data || res);
    } catch {
      setStats(null);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (paymentStatusFilter && paymentStatusFilter !== 'ALL') params.paymentStatus = paymentStatusFilter;
      if (paymentMethodFilter && paymentMethodFilter !== 'ALL') params.paymentMethod = paymentMethodFilter;
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (sort) {
        const [field, dir] = sort.split(':');
        params.sortBy = field;
        params.sortOrder = dir;
      }
      const res = await api.getAdminOrders(params);
      setOrders(res.data || []);
      setPagination(res.pagination);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  }, [page, limit, statusFilter, paymentStatusFilter, paymentMethodFilter, search, dateFrom, dateTo, sort]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    setSelectedOrders([]);
  }, [statusFilter, paymentStatusFilter, paymentMethodFilter, search, dateFrom, dateTo, sort, page, limit]);

  const activeFilterCount = [
    statusFilter !== 'ALL',
    paymentStatusFilter !== 'ALL',
    paymentMethodFilter !== 'ALL',
    dateFrom !== '',
    dateTo !== '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPaymentStatusFilter('ALL');
    setPaymentMethodFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setSort('createdAt:desc');
    setPage(1);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateOrderStatus(id, { status });
      toast.success(`Order updated to ${status}`);
      fetchOrders();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const bulkConfirm = async () => {
    if (selectedOrders.length === 0) return;
    setBulkLoading(true);
    try {
      await api.bulkConfirmOrders(selectedOrders);
      toast.success(`${selectedOrders.length} orders confirmed`);
      setSelectedOrders([]);
      fetchOrders();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm orders');
    }
    setBulkLoading(false);
  };

  const bulkShip = async () => {
    if (selectedOrders.length === 0) return;
    setBulkLoading(true);
    try {
      const trackingNumbers: Record<string, string> = {};
      selectedOrders.forEach((id) => { trackingNumbers[id] = ''; });
      await api.bulkShipOrders(selectedOrders, 'Default', trackingNumbers);
      toast.success(`${selectedOrders.length} orders shipped`);
      setSelectedOrders([]);
      fetchOrders();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to ship orders');
    }
    setBulkLoading(false);
  };

  const bulkCancel = async () => {
    if (selectedOrders.length === 0) return;
    setBulkLoading(true);
    try {
      await api.bulkCancelOrders(selectedOrders, bulkCancelReason || undefined);
      toast.success(`${selectedOrders.length} orders cancelled`);
      setSelectedOrders([]);
      setShowBulkCancelDialog(false);
      setBulkCancelReason('');
      fetchOrders();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel orders');
    }
    setBulkLoading(false);
  };

  const exportOrders = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.exportOrders(params);
      if (res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      }
      toast.success('Export started');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    }
  };

  const statCards = stats
    ? [
        { label: 'Total Orders', value: stats.totalOrders ?? 0, icon: Package, color: 'bg-gray-100 text-gray-700', filterStatus: 'ALL' },
        { label: 'Pending', value: stats.pendingOrders ?? 0, icon: Clock, color: 'bg-yellow-100 text-yellow-700', filterStatus: 'PENDING' },
        { label: 'Confirmed', value: stats.confirmedOrders ?? 0, icon: CheckCircle, color: 'bg-blue-100 text-blue-700', filterStatus: 'CONFIRMED' },
        { label: 'Shipped', value: stats.shippedOrders ?? 0, icon: Truck, color: 'bg-indigo-100 text-indigo-700', filterStatus: 'SHIPPED' },
        { label: 'Delivered', value: stats.deliveredOrders ?? 0, icon: CheckCircle, color: 'bg-green-100 text-green-700', filterStatus: 'DELIVERED' },
        { label: 'Cancelled', value: stats.cancelledOrders ?? 0, icon: XCircle, color: 'bg-red-100 text-red-700', filterStatus: 'CANCELLED' },
        { label: 'Total Revenue', value: formatPrice(stats.totalRevenue ?? 0), icon: FileText, color: 'bg-emerald-100 text-emerald-700', filterStatus: '' },
        { label: "Today's Orders", value: stats.todayOrders ?? 0, icon: RefreshCw, color: 'bg-purple-100 text-purple-700', filterStatus: '' },
      ]
    : [];

  const SkeletonRow = () => (
    <tr className="border-t border-gray-100">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: i === 0 ? '24px' : i === 1 ? '80px' : '60%' }} />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <Button variant="outline" size="sm" onClick={exportOrders}>
          <Download size={14} className="mr-1" /> Export All
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {statCards.map((card) => {
            const Icon = card.icon;
            const isActive = card.filterStatus && statusFilter === card.filterStatus;
            return (
              <button
                key={card.label}
                onClick={() => {
                  if (card.filterStatus) {
                    setStatusFilter(card.filterStatus);
                    setPage(1);
                  }
                }}
                className={`${card.color} rounded-lg p-4 text-left transition-all hover:shadow-md ${isActive ? 'ring-2 ring-[#d4a853] shadow-md' : ''} ${!card.filterStatus ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon size={18} />
                  {card.filterStatus && (
                    <ChevronDown size={12} className={`transition-transform ${isActive ? 'rotate-180' : ''}`} />
                  )}
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs opacity-70 mt-1">{card.label}</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by order #, customer, email, phone, tracking..."
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-[#d4a853] transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#d4a853]"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#d4a853]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${showFilters || activeFilterCount > 0 ? 'border-[#d4a853] text-[#d4a853] bg-[#d4a853]/5' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-[#d4a853] text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-gray-100">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#d4a853]"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s === 'ALL' ? 'All' : s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Payment Method</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => { setPaymentMethodFilter(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#d4a853]"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m === 'ALL' ? 'All' : m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#d4a853]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#d4a853]"
              />
            </div>
          </div>
        )}
      </div>

      {selectedOrders.length > 0 && (
        <div className="bg-[#d4a853]/10 border border-[#d4a853]/30 rounded-lg p-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">{selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" variant="primary" onClick={bulkConfirm} loading={bulkLoading}>
              <CheckCircle size={14} className="mr-1" /> Confirm
            </Button>
            <Button size="sm" variant="secondary" onClick={bulkShip} loading={bulkLoading}>
              <Truck size={14} className="mr-1" /> Ship
            </Button>
            <Button size="sm" variant="danger" onClick={() => setShowBulkCancelDialog(true)} disabled={bulkLoading}>
              <XCircle size={14} className="mr-1" /> Cancel
            </Button>
            <button
              onClick={() => setSelectedOrders([])}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {showBulkCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-2">Cancel {selectedOrders.length} Orders</h3>
            <p className="text-sm text-gray-500 mb-4">This action cannot be undone. Provide a reason (optional).</p>
            <textarea
              value={bulkCancelReason}
              onChange={(e) => setBulkCancelReason(e.target.value)}
              placeholder="Cancellation reason..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#d4a853] resize-none h-20 mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowBulkCancelDialog(false); setBulkCancelReason(''); }}>
                Close
              </Button>
              <Button variant="danger" size="sm" onClick={bulkCancel} loading={bulkLoading}>
                Cancel Orders
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={orders.length > 0 && selectedOrders.length === orders.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 accent-[#d4a853]"
                />
              </th>
              <th className="p-4 text-left font-medium text-gray-600">Order</th>
              <th className="p-4 text-left font-medium text-gray-600">Customer</th>
              <th className="p-4 text-left font-medium text-gray-600">Items</th>
              <th className="p-4 text-left font-medium text-gray-600">Total</th>
              <th className="p-4 text-left font-medium text-gray-600">Payment</th>
              <th className="p-4 text-left font-medium text-gray-600">Status</th>
              <th className="p-4 text-left font-medium text-gray-600">Date</th>
              <th className="p-4 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center">
                  <Package size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No orders found</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search query</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                      className="rounded border-gray-300 accent-[#d4a853]"
                    />
                  </td>
                  <td className="p-4 font-medium whitespace-nowrap">#{order.orderNumber}</td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-sm">{order.user?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-400">{order.user?.email || ''}</p>
                    </div>
                  </td>
                  <td className="p-4">{order.items?.length ?? 0}</td>
                  <td className="p-4 font-medium whitespace-nowrap">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(order.status)}`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <Eye size={12} /> View
                      </Link>
                      <div className="relative group">
                        <button className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-300 transition-colors">
                          Update <ChevronDown size={10} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 hidden group-hover:block min-w-[140px]">
                          {QUICK_STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(order.id, s)}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${order.status === s ? 'font-bold text-[#d4a853]' : ''}`}
                            >
                              {s.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Show</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-[#d4a853]"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500">per page</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
