'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Eye, X, CheckCircle, Package, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const RETURN_STATUSES = [
  'ALL',
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'PICKUP_SCHEDULED',
  'RETURNED',
  'UNDER_INSPECTION',
  'APPROVED_FOR_REFUND',
] as const;

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: string;
    returnId: string;
  }>({ open: false, type: '', returnId: '' });
  const [actionNotes, setActionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    requested: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchReturns();
  }, [page, statusFilter, search]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.getAdminReturns(params);
      setReturns(res.data || []);
      setPagination(res.pagination);
      if (res.stats) {
        setStats({
          total: res.stats.total || 0,
          requested: res.stats.requested || 0,
          approved: res.stats.approved || 0,
          rejected: res.stats.rejected || 0,
        });
      }
    } catch {
      setReturns([]);
    }
    setLoading(false);
  };

  const fetchReturnDetail = async (id: string) => {
    try {
      const res = await api.getReturnById(id);
      setSelectedReturn(res.data);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAction = async () => {
    if (!actionModal.returnId) return;
    setActionLoading(true);
    try {
      const body: any = { action: actionModal.type };
      if (actionNotes) body.notes = actionNotes;
      if (actionModal.type === 'approveRefund' && refundAmount) {
        body.refundAmount = parseFloat(refundAmount);
      }
      await api.updateReturnStatus(actionModal.returnId, body);
      toast.success(`Return ${getActionLabel(actionModal.type)} successfully`);
      setActionModal({ open: false, type: '', returnId: '' });
      setActionNotes('');
      setRefundAmount('');
      fetchReturns();
      if (selectedReturn?.id === actionModal.returnId) {
        fetchReturnDetail(actionModal.returnId);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setActionLoading(false);
  };

  const openActionModal = (type: string, returnId: string) => {
    setActionModal({ open: true, type, returnId });
    setActionNotes('');
    setRefundAmount('');
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      schedulePickup: 'pickup scheduled',
      markUnderInspection: 'marked under inspection',
      approveRefund: 'approved for refund',
    };
    return labels[type] || type;
  };

  const getAvailableActions = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return [
          { type: 'approve', label: 'Approve', icon: <CheckCircle size={12} />, color: 'text-green-600 hover:text-green-800' },
          { type: 'reject', label: 'Reject', icon: <X size={12} />, color: 'text-red-600 hover:text-red-800' },
        ];
      case 'APPROVED':
        return [
          { type: 'schedulePickup', label: 'Schedule Pickup', icon: <Package size={12} />, color: 'text-blue-600 hover:text-blue-800' },
        ];
      case 'RETURNED':
        return [
          { type: 'markUnderInspection', label: 'Mark Under Inspection', icon: <RotateCcw size={12} />, color: 'text-purple-600 hover:text-purple-800' },
        ];
      case 'UNDER_INSPECTION':
        return [
          { type: 'approveRefund', label: 'Approve for Refund', icon: <CheckCircle size={12} />, color: 'text-green-600 hover:text-green-800' },
        ];
      default:
        return [];
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const hasFilters = search || (statusFilter && statusFilter !== 'ALL');

  const statCards = [
    { label: 'Total Returns', value: stats.total, icon: <RotateCcw size={20} />, bg: 'bg-gray-50 text-gray-600' },
    { label: 'Pending', value: stats.requested, icon: <Package size={20} />, bg: 'bg-yellow-50 text-yellow-600' },
    { label: 'Approved', value: stats.approved, icon: <CheckCircle size={20} />, bg: 'bg-green-50 text-green-600' },
    { label: 'Rejected', value: stats.rejected, icon: <X size={20} />, bg: 'bg-red-50 text-red-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Returns Management</h1>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</span>
              <span className={`p-2 rounded-full ${stat.bg}`}>{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
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
            placeholder="Search returns..."
            className="w-full border pl-10 pr-4 py-2 text-sm outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border px-3 py-2 text-sm outline-none"
        >
          {RETURN_STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* Returns Table */}
      <div className="bg-white border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium">Return#</th>
              <th className="text-left p-4 font-medium">Order#</th>
              <th className="text-left p-4 font-medium">Customer</th>
              <th className="text-left p-4 font-medium">Items</th>
              <th className="text-left p-4 font-medium">Reason</th>
              <th className="text-left p-4 font-medium">Status</th>
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
            ) : returns.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">No returns found</td>
              </tr>
            ) : (
              returns.map((ret: any) => (
                <tr key={ret.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">#{ret.returnNumber}</td>
                  <td className="p-4">
                    <Link href={`/admin/orders/${ret.order?.orderNumber}`} className="text-blue-600 hover:underline">
                      #{ret.order?.orderNumber || 'N/A'}
                    </Link>
                  </td>
                  <td className="p-4">{ret.user?.name || 'N/A'}</td>
                  <td className="p-4">{ret.items?.length || 0}</td>
                  <td className="p-4 text-xs max-w-[200px] truncate">{ret.reason || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs ${getStatusColor(ret.status)}`}>
                      {ret.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">{formatDate(ret.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchReturnDetail(ret.id)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Eye size={12} /> View
                      </button>
                      {getAvailableActions(ret.status).map((action) => (
                        <button
                          key={action.type}
                          onClick={() => openActionModal(action.type, ret.id)}
                          className={`inline-flex items-center gap-1 text-xs ${action.color}`}
                        >
                          {action.icon} {action.label}
                        </button>
                      ))}
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
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !actionLoading && setActionModal({ open: false, type: '', returnId: '' })} />
          <div className="relative bg-white border w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold capitalize">{actionModal.type.replace(/([A-Z])/g, ' $1')}</h3>
              <button
                onClick={() => !actionLoading && setActionModal({ open: false, type: '', returnId: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {(actionModal.type === 'approve' || actionModal.type === 'reject' || actionModal.type === 'schedulePickup' || actionModal.type === 'markUnderInspection') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Admin Notes</label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Enter notes (optional)"
                    rows={3}
                    className="w-full border p-2 text-sm outline-none resize-none"
                  />
                </div>
              )}

              {actionModal.type === 'approveRefund' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Inspection Notes</label>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Enter inspection notes (optional)"
                      rows={3}
                      className="w-full border p-2 text-sm outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Refund Amount</label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="Enter refund amount"
                      className="w-full border p-2 text-sm outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={actionLoading}
                onClick={() => setActionModal({ open: false, type: '', returnId: '' })}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                loading={actionLoading}
                onClick={handleAction}
                className={actionModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : actionModal.type === 'schedulePickup' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#1a1a2e] hover:bg-[#16213e]'}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return Detail Slide-out Panel */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedReturn(null)} />
          <div className="relative bg-white w-full max-w-lg overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Return #{selectedReturn.returnNumber}</h2>
                <span className={`px-2 py-1 text-xs ${getStatusColor(selectedReturn.status)}`}>
                  {selectedReturn.status?.replace(/_/g, ' ')}
                </span>
              </div>
              <button onClick={() => setSelectedReturn(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Information</h3>
                <div className="border p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Number</span>
                    <Link href={`/admin/orders/${selectedReturn.order?.orderNumber}`} className="text-blue-600 hover:underline font-medium">
                      #{selectedReturn.order?.orderNumber}
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Date</span>
                    <span>{formatDate(selectedReturn.order?.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Total</span>
                    <span className="font-medium">{formatPrice(selectedReturn.order?.total)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</h3>
                <div className="border p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span>{selectedReturn.user?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span>{selectedReturn.user?.email || 'N/A'}</span>
                  </div>
                  {selectedReturn.user?.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone</span>
                      <span>{selectedReturn.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Return Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Return Items</h3>
                <div className="space-y-3">
                  {selectedReturn.items?.map((item: any, idx: number) => (
                    <div key={idx} className="border p-4 flex gap-4">
                      <div className="w-16 h-20 bg-gray-50 flex-shrink-0">
                        {item.product?.images?.[0]?.url && (
                          <img src={item.product.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} x {formatPrice(item.price)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Reason:</span> {item.reason || 'N/A'}
                        </p>
                        {item.condition && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Condition:</span> {item.condition}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Admin Notes</h3>
                <textarea
                  value={selectedReturn.adminNotes || ''}
                  readOnly
                  placeholder="No admin notes yet"
                  rows={3}
                  className="w-full border p-2 text-sm bg-gray-50 resize-none"
                />
              </div>

              {/* Inspection Notes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Inspection Notes</h3>
                <textarea
                  value={selectedReturn.inspectionNotes || ''}
                  readOnly
                  placeholder="No inspection notes yet"
                  rows={3}
                  className="w-full border p-2 text-sm bg-gray-50 resize-none"
                />
              </div>

              {/* Refund Info */}
              {selectedReturn.refundAmount && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Refund</h3>
                  <div className="border p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Refund Amount</span>
                      <span className="font-bold">{formatPrice(selectedReturn.refundAmount)}</span>
                    </div>
                    {selectedReturn.refundedAt && (
                      <div className="flex justify-between mt-2">
                        <span className="text-gray-500">Refunded On</span>
                        <span>{formatDate(selectedReturn.refundedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status History */}
              {selectedReturn.statusHistory && selectedReturn.statusHistory.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Status History</h3>
                  <div className="space-y-3">
                    {selectedReturn.statusHistory.map((entry: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs ${getStatusColor(entry.status)}`}>
                              {entry.status?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(entry.createdAt)}</span>
                          </div>
                          {entry.note && <p className="text-xs text-gray-500 mt-1">{entry.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons in Panel */}
              {getAvailableActions(selectedReturn.status).length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableActions(selectedReturn.status).map((action) => (
                      <Button
                        key={action.type}
                        size="sm"
                        variant="outline"
                        onClick={() => openActionModal(action.type, selectedReturn.id)}
                      >
                        {action.icon} {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
