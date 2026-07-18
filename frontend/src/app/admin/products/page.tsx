'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';
import { Plus, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => { fetchProducts(); }, [page, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      const res = await api.getAdminProducts(params);
      setProducts(res.data || []);
      setPagination(res.pagination);
    } catch { setProducts([]); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await api.deleteProduct(id);
      toast.success('Product deactivated');
      fetchProducts();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search products..."
              className="w-full border pl-10 pr-4 py-2 text-sm outline-none"
            />
          </div>
          <Link href="/admin/products/new" className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-6 py-2 text-sm font-medium hover:bg-[#16213e] transition-all"><Plus size={16} /> Add Product</Link>
        </div>
      </div>

      <div className="bg-white border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium">Product</th>
              <th className="text-left p-4 font-medium">Category</th>
              <th className="text-left p-4 font-medium">Price</th>
              <th className="text-left p-4 font-medium">Stock</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-gray-400">No products found</td></tr>
            ) : (
              products.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-gray-100 flex-shrink-0">
                        {p.primaryImage && <img src={p.primaryImage} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">{p.category?.name || '-'}</td>
                  <td className="p-4">
                    <p className="font-medium">{formatPrice(p.salePrice || p.basePrice)}</p>
                    {p.salePrice && <p className="text-xs text-gray-400 line-through">{formatPrice(p.basePrice)}</p>}
                  </td>
                  <td className="p-4">
                    <span className={p.variants?.reduce((s: number, v: any) => s + v.stock, 0) > 10 ? 'text-green-600' : 'text-red-600'}>
                      {p.variants?.reduce((s: number, v: any) => s + v.stock, 0) || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs ${p.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">{formatDate(p.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link href={`/admin/products/${p.id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-red-600 hover:underline">Delete</button>
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
