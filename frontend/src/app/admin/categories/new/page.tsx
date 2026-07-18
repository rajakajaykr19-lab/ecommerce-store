'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminCreateCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', image: '', parentId: '', isActive: true,
  });

  useEffect(() => {
    api.getAdminCategories().then((res: any) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleNameChange = (name: string) => {
    set('name', name);
    if (!form.slug || form.slug === slugify(form.name)) {
      set('slug', slugify(name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await api.createCategory({
        ...form,
        parentId: form.parentId || undefined,
      });
      toast.success('Category created');
      router.push('/admin/categories');
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const inputClass = 'w-full border px-3 py-2 text-sm outline-none focus:border-[#1a1a2e]';
  const labelClass = 'block text-sm font-medium mb-1';

  return (
    <div className="max-w-2xl">
      <Link href="/admin/categories" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Categories
      </Link>
      <h1 className="text-2xl font-bold mb-6">Create Category</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border p-6 space-y-4">
          <div>
            <label className={labelClass}>Category Name *</label>
            <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input type="text" value={form.slug} onChange={(e) => set('slug', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={inputClass} rows={3} />
          </div>
          <div>
            <label className={labelClass}>Image URL</label>
            <input type="text" value={form.image} onChange={(e) => set('image', e.target.value)} className={inputClass} placeholder="https://..." />
            {form.image && (
              <div className="mt-2 w-20 h-20 border overflow-hidden">
                <img src={form.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Parent Category (optional)</label>
            <select value={form.parentId} onChange={(e) => set('parentId', e.target.value)} className={inputClass}>
              <option value="">None (top-level)</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-4 h-4" />
            Active
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>Create Category</Button>
          <Link href="/admin/categories"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
