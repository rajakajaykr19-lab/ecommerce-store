'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditCouponPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    maxUsageCount: '',
    usageCount: 0,
    validFrom: '',
    validUntil: '',
    isActive: true,
  });

  useEffect(() => { fetchCoupon(); }, [id]);

  const fetchCoupon = async () => {
    try {
      const res = await api.getAdminCoupon(id);
      const c = res.data || res;
      setForm({
        code: c.code || '',
        description: c.description || '',
        discountType: c.discountType || 'PERCENTAGE',
        discountValue: String(c.discountValue || ''),
        minOrderAmount: String(c.minOrderAmount || ''),
        maxDiscountAmount: String(c.maxDiscountAmount || ''),
        maxUsageCount: String(c.maxUsageCount || ''),
        usageCount: c.usageCount || 0,
        validFrom: c.validFrom ? c.validFrom.split('T')[0] : '',
        validUntil: c.validUntil ? c.validUntil.split('T')[0] : '',
        isActive: c.isActive ?? true,
      });
    } catch { toast.error('Failed to load coupon'); }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        code: form.code.toUpperCase().trim(),
        description: form.description,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0,
        maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : undefined,
        maxUsageCount: form.maxUsageCount ? parseInt(form.maxUsageCount) : undefined,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
        isActive: form.isActive,
      };
      await api.updateCoupon(id, payload);
      toast.success('Coupon updated');
      router.push('/admin/coupons');
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={24} /></div>;

  return (
    <div>
      <Link href="/admin/coupons" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-6">
        <ArrowLeft size={14} /> Back to Coupons
      </Link>
      <h1 className="text-2xl font-bold mb-6">Edit Coupon</h1>

      <form onSubmit={handleSubmit} className="bg-white border p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Coupon Code *</label>
            <input type="text" name="code" value={form.code} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none font-mono" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Discount Type *</label>
            <select name="discountType" value={form.discountType} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none">
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (₹)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full border px-3 py-2 text-sm outline-none resize-none" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Discount Value *</label>
            <input type="number" name="discountValue" value={form.discountValue} onChange={handleChange} step="0.01" min="0" className="w-full border px-3 py-2 text-sm outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Min Order Amount</label>
            <input type="number" name="minOrderAmount" value={form.minOrderAmount} onChange={handleChange} step="0.01" min="0" className="w-full border px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Discount Amount</label>
            <input type="number" name="maxDiscountAmount" value={form.maxDiscountAmount} onChange={handleChange} step="0.01" min="0" className="w-full border px-3 py-2 text-sm outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Max Usage Count</label>
            <input type="number" name="maxUsageCount" value={form.maxUsageCount} onChange={handleChange} min="1" className="w-full border px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Times Used</label>
            <input type="number" value={form.usageCount} disabled className="w-full border px-3 py-2 text-sm outline-none bg-gray-50 text-gray-500" />
          </div>
          <div />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Valid From</label>
            <input type="date" name="validFrom" value={form.validFrom} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valid Until</label>
            <input type="date" name="validUntil" value={form.validUntil} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="h-4 w-4" id="isActive" />
          <label htmlFor="isActive" className="text-sm font-medium">Active</label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" loading={saving}>{saving ? 'Saving...' : 'Update Coupon'}</Button>
          <Link href="/admin/coupons"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
