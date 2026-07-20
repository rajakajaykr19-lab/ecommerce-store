'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Eye, Plus, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const REFUND_METHODS = ['RAZORPAY', 'STRIPE', 'BANK_TRANSFER', 'UPI', 'CASH'];
const REFUND_STATUSES = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalAmount: 0,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    orderId: '',
    amount: '',
    method: 'RAZORPAY',
    reason: '',
    adminNotes: '',
  });
  const [orderSearch, setOrderSearch] = useState('');
  const [orderResults, setOrderResults] = useState<any[]>([]);
  const [searchingOrder, setSearchingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRefunds();
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.getAdminRefunds(params);
      setRefunds(res.data || []);
      setPagination(res.pagination);
    } catch {
      setRefunds([]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await api.getAdminRefunds({ page: '1', limit: '1' });
      setStats({
        total: res.data?.total || 0,
        pending: res.data?.pending || 0,
        processing: res.data?.processing || 0,
        completed: res.data?.completed || 0,
        failed: res.data?.failed || 0,
        totalAmount: res.data?.totalAmount || 0,
      });
    } catch {
      // Stats endpoint may not exist yet
    }
  };

  const searchOrders = useCallback(async (query: string) => {
    if (query.length < 2) {
      setOrderResults([]);
      return;
    }
    setSearchingOrder(true);
    try {
      const res = await api.getAdminOrders({ search: query, limit: '10' });
      setOrderResults(res.data || []);
    } catch {
      setOrderResults([]);
    }
    setSearchingOrder(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (orderSearch) searchOrders(orderSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [orderSearch, searchOrders]);

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    setCreateForm((prev) => ({ ...prev, orderId: order.id, amount: String(order.total || '') }));
    setOrderResults([]);
    setOrderSearch('');
  };

  const handleCreateRefund = async () => {
    if (!createForm.orderId || !createForm.amount || !createForm.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    setCreateLoading(true);
    try {
      await api.createRefund({
        orderId: createForm.orderId,
        amount: parseFloat(createForm.amount),
        method: createForm.method,
        reason: createForm.reason,
        adminNotes: createForm.adminNotes,
      });
      toast.success('Refund created successfully');
      setShowCreateModal(false);
      setCreateForm({ orderId: '', amount: '', method: 'RAZORPAY', reason: '', adminNotes: '' });
      setSelectedOrder(null);
      fetchRefunds();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create refund');
    }
    setCreateLoading(false);
  };

  const processRefund = async (id: string) => {
    setActionLoading(id);
    try {
      await api.updateRefundStatus(id, { status: 'PROCESSING' });
      toast.success('Refund is now processing');
      fetchRefunds();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process refund');
    }
    setActionLoading(null);
  };

  const completeRefund = async (id: string) => {
    setActionLoading(id);
    try {
      await api.updateRefundStatus(id, { status: 'COMPLETED' });
      toast.success('Refund marked as completed');
      fetchRefunds();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete refund');
    }
    setActionLoading(null);
  };

  const failRefund = async (id: string) => {
    const reason = prompt('Enter failure reason:');
    if (reason === null) return;
    setActionLoading(id);
    try {
      await api.updateRefundStatus(id, { status: 'FAILED', failureReason: reason });
      toast.success('Refund marked as failed');
      fetchRefunds();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update refund');
    }
    setActionLoading(null);
  };

  const viewRefundDetail = async (id: string) => {
    try {
      const res = await api.getRefundById(id);
      setSelectedRefund(res.data || res);
      setShowDetailModal(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load refund details');
    }
  };

  const getStatsIcon = (type: string) => {
    switch (type) {
      case 'pending': return <Clock size={20} className="text-yellow-500" />;
      case 'processing': return <Loader2 size={20} className="text-purple-500" />;
      case 'completed': return <CheckCircle size={20} className="text-green-500" />;
      case 'failed': return <XCircle size={20} className="text-red-500" />;
      case 'total': return <CreditCard size={20} className="text-blue-500" />;
      default: return <CreditCard size={20} className="text-gray-500" />;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Refunds</h1>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#1a1a2e] text-white hover:bg-[#16213e] inline-flex items-center gap-2"
        >
          <Plus size={16} /> Create Refund
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total Refunds', value: stats.total, type: 'total' },
          { label: 'Pending', value: stats.pending, type: 'pending' },
          { label: 'Processing', value: stats.processing, type: 'processing' },
          { label: 'Completed', value: stats.completed, type: 'completed' },
          { label: 'Failed', value: stats.failed, type: 'failed' },
          { label: 'Total Amount', value: formatPrice(stats.totalAmount), type: 'amount' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border p-4">
            <div className="flex items-center gap-2 mb-2">
              {getStatsIcon(stat.type)}
              <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search refund or order number..."
            className="w-full border pl-10 pr-4 py-2 text-sm outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border px-3 py-2 text-sm outline-none"
        >
          {REFUND_STATUSES.map((s) => (
            <option key={s} value={s === 'ALL' ? '' : s}>{s}</option>
          ))}
        </select>
        {(search || statusFilter) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Refunds Table */}
      <div className="bg-white border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium">Refund#</th>
              <th className="text-left p-4 font-medium">Order#</th>
              <th className="text-left p-4 font-medium">Amount</th>
              <th className="text-left p-4 font-medium">Method</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Reason</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <Loader2 className="animate-spin mx-auto" size={24} />
                </td>
              </tr>
            ) : refunds.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">
                  No refunds found
                </td>
              </tr>
            ) : (
              refunds.map((refund: any) => (
                <tr key={refund.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">#{refund.refundNumber || refund.id?.slice(0, 8)}</td>
                  <td className="p-4">
                    <Link href={`/admin/orders/${refund.order?.orderNumber || refund.orderNumber}`} className="text-blue-600 hover:underline">
                      #{refund.order?.orderNumber || refund.orderNumber}
                    </Link>
                  </td>
                  <td className="p-4 font-medium">{formatPrice(refund.amount)}</td>
                  <td className="p-4">{refund.method}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs ${getStatusColor(refund.status)}`}>
                      {refund.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500 max-w-[200px] truncate">
                    {refund.reason || '-'}
                  </td>
                  <td className="p-4 text-xs text-gray-500">{formatDate(refund.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {refund.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === refund.id}
                          onClick={() => processRefund(refund.id)}
                          className="text-xs"
                        >
                          {actionLoading === refund.id ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            'Process'
                          )}
                        </Button>
                      )}
                      {refund.status === 'PROCESSING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === refund.id}
                            onClick={() => completeRefund(refund.id)}
                            className="text-xs text-green-600 border-green-200 hover:bg-green-50"
                          >
                            {actionLoading === refund.id ? (
                              <Loader2 className="animate-spin" size={12} />
                            ) : (
                              'Complete'
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading === refund.id}
                            onClick={() => failRefund(refund.id)}
                            className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {actionLoading === refund.id ? (
                              <Loader2 className="animate-spin" size={12} />
                            ) : (
                              'Fail'
                            )}
                          </Button>
                        </>
                      )}
                      <button
                        onClick={() => viewRefundDetail(refund.id)}
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <Eye size={12} /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Refund Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">Create Refund</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Search Order *</label>
                  {!selectedOrder ? (
                    <>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          placeholder="Search by order number or customer name..."
                          className="w-full border pl-10 pr-4 py-2 text-sm outline-none"
                        />
                      </div>
                      {searchingOrder && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <Loader2 className="animate-spin" size={14} /> Searching...
                        </div>
                      )}
                      {orderResults.length > 0 && (
                        <div className="border mt-1 max-h-40 overflow-y-auto">
                          {orderResults.map((order: any) => (
                            <button
                              key={order.id}
                              onClick={() => handleSelectOrder(order)}
                              className="w-full text-left p-3 text-sm hover:bg-gray-50 border-b last:border-b-0"
                            >
                              <div className="flex justify-between">
                                <span className="font-medium">#{order.orderNumber}</span>
                                <span>{formatPrice(order.total)}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {order.user?.name || 'N/A'} — {formatDate(order.createdAt)}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="border p-3 bg-gray-50 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">#{selectedOrder.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {selectedOrder.user?.name || 'N/A'} — {formatPrice(selectedOrder.total)}
                        </p>
                      </div>
                      <button
                        onClick={() => { setSelectedOrder(null); setCreateForm((prev) => ({ ...prev, orderId: '', amount: '' })); }}
                        className="text-red-600 text-xs hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter refund amount"
                    className="w-full border px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Refund Method *</label>
                  <select
                    value={createForm.method}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, method: e.target.value }))}
                    className="w-full border px-3 py-2 text-sm outline-none"
                  >
                    {REFUND_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Reason *</label>
                  <textarea
                    value={createForm.reason}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason for refund"
                    rows={3}
                    className="w-full border px-3 py-2 text-sm outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Admin Notes</label>
                  <textarea
                    value={createForm.adminNotes}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, adminNotes: e.target.value }))}
                    placeholder="Internal notes (optional)"
                    rows={2}
                    className="w-full border px-3 py-2 text-sm outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ orderId: '', amount: '', method: 'RAZORPAY', reason: '', adminNotes: '' });
                    setSelectedOrder(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRefund}
                  disabled={createLoading}
                  className="bg-[#1a1a2e] text-white hover:bg-[#16213e]"
                >
                  {createLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Create Refund
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Detail Modal */}
      {showDetailModal && selectedRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Refund Details</h2>
                <button onClick={() => { setShowDetailModal(false); setSelectedRefund(null); }} className="text-gray-400 hover:text-gray-600 text-xl">
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Refund Number</span>
                  <span className="text-sm font-medium">#{selectedRefund.refundNumber || selectedRefund.id?.slice(0, 8)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-2 py-1 text-xs ${getStatusColor(selectedRefund.status)}`}>
                    {selectedRefund.status}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-sm font-bold">{formatPrice(selectedRefund.amount)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Method</span>
                  <span className="text-sm font-medium">{selectedRefund.method?.replace('_', ' ')}</span>
                </div>

                {selectedRefund.order && (
                  <div className="py-2 border-b">
                    <span className="text-sm text-gray-500 block mb-1">Order Summary</span>
                    <div className="bg-gray-50 p-3 text-sm">
                      <p>Order #{selectedRefund.order.orderNumber || selectedRefund.orderNumber}</p>
                      {selectedRefund.order.total && (
                        <p className="text-gray-500 mt-1">Total: {formatPrice(selectedRefund.order.total)}</p>
                      )}
                      {selectedRefund.order.user?.name && (
                        <p className="text-gray-500">Customer: {selectedRefund.order.user.name}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedRefund.transactionId && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-gray-500">Transaction ID</span>
                    <span className="text-sm font-mono">{selectedRefund.transactionId}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Reason</span>
                  <span className="text-sm text-right max-w-[250px]">{selectedRefund.reason || '-'}</span>
                </div>

                {selectedRefund.failureReason && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-gray-500">Failure Reason</span>
                    <span className="text-sm text-red-600 text-right max-w-[250px]">{selectedRefund.failureReason}</span>
                  </div>
                )}

                {selectedRefund.adminNotes && (
                  <div className="py-2 border-b">
                    <span className="text-sm text-gray-500 block mb-1">Admin Notes</span>
                    <p className="text-sm bg-gray-50 p-3 whitespace-pre-wrap">{selectedRefund.adminNotes}</p>
                  </div>
                )}

                <div className="py-2 border-b">
                  <span className="text-sm text-gray-500 block mb-1">Timestamps</span>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span>{formatDate(selectedRefund.createdAt)}</span>
                    </div>
                    {selectedRefund.processedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Processed</span>
                        <span>{formatDate(selectedRefund.processedAt)}</span>
                      </div>
                    )}
                    {selectedRefund.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Completed</span>
                        <span>{formatDate(selectedRefund.completedAt)}</span>
                      </div>
                    )}
                    {selectedRefund.failedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Failed</span>
                        <span>{formatDate(selectedRefund.failedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => { setShowDetailModal(false); setSelectedRefund(null); }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
