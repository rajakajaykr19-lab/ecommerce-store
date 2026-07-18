'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Search, Trash2, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => { fetchCoupons(); }, [page, search]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      const res = await api.getAdminCoupons(params);
      setCoupons(res.data || []);
      setPagination(res.pagination);
    } catch { setCoupons([]); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.deleteCoupon(id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleToggleActive = async (coupon: any) => {
    try {
      await api.updateCoupon(coupon.id, { isActive: !coupon.isActive });
      toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`);
      fetchCoupons();
    } catch (err: any) { toast.error(err.message); }
  };

  const formatDateStr = (d: string) => d ? formatDate(d) : '-';

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search coupons..."
              className="w-full border pl-10 pr-4 py-2 text-sm outline-none"
            />
          </div>
          <Link href="/admin/coupons/new" className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-6 py-2 text-sm font-medium hover:bg-[#16213e] transition-all">
            <Plus size={16} /> Add Coupon
          </Link>
        </div>
      </div>

      <div className="bg-white border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium">Code</th>
              <th className="text-left p-4 font-medium">Discount</th>
              <th className="text-left p-4 font-medium">Min Order</th>
              <th className="text-left p-4 font-medium">Usage</th>
              <th className="text-left p-4 font-medium">Valid From</th>
              <th className="text-left p-4 font-medium">Valid Until</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-12 text-center"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={8} className="p-12 text-center text-gray-400">No coupons found</td></tr>
            ) : (
              coupons.map((c: any) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-mono font-bold text-sm">{c.code}</p>
                    {c.description && <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{c.description}</p>}
                  </td>
                  <td className="p-4">
                    {c.discountType === 'PERCENTAGE' ? (
                      <span className="font-medium">{c.discountValue}%{c.maxDiscountAmount ? ` (max ₹${c.maxDiscountAmount})` : ''}</span>
                    ) : (
                      <span className="font-medium">₹{c.discountValue}</span>
                    )}
                  </td>
                  <td className="p-4">{c.minOrderAmount ? `₹${c.minOrderAmount}` : '-'}</td>
                  <td className="p-4">
                    <span>{c.usageCount || 0}{c.maxUsageCount ? ` / ${c.maxUsageCount}` : ''}</span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">{formatDateStr(c.validFrom)}</td>
                  <td className="p-4 text-xs text-gray-500">{formatDateStr(c.validUntil)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 items-center">
                      <button onClick={() => handleToggleActive(c)} className="text-gray-500 hover:text-gray-700" title={c.isActive ? 'Deactivate' : 'Activate'}>
                        {c.isActive ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} className="text-red-600" />}
                      </button>
                      <Link href={`/admin/coupons/${c.id}`} className="text-blue-600 hover:underline">
                        <Pencil size={14} />
                      </Link>
                      <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
