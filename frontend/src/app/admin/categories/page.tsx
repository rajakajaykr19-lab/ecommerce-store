'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { Category } from '@/types';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.getAdminCategories();
      setCategories(res.data || []);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={24} /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div />
        <Link href="/admin/categories/new" className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-6 py-2 text-sm font-medium hover:bg-[#16213e] transition-all"><Plus size={16} /> Add Category</Link>
      </div>
      <div className="bg-white border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="text-left p-4 font-medium">Name</th><th className="text-left p-4 font-medium">Products</th><th className="text-left p-4 font-medium">Status</th><th className="text-left p-4 font-medium">Actions</th></tr></thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-t">
                <td className="p-4 font-medium">{cat.name}</td>
                <td className="p-4">{cat._count?.products || 0}</td>
                <td className="p-4"><span className={`px-2 py-1 text-xs ${cat.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Link href={`/admin/categories/${cat.id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(cat.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No categories</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
