'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import type { Product, Pagination, Category } from '@/types';
import { ChevronDown, Loader2 } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    setPage(1);
    fetchProducts();
  }, [category, sort]);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        sort,
        page: String(page),
        limit: '12',
        category,
      };
      const res = await api.getProducts(params);
      setProducts(res.data || []);
      setPagination(res.pagination);
      if (res.data?.length > 0 && res.data[0].category) {
        setCategoryName(res.data[0].category.name);
      }
    } catch {
      setProducts([]);
    }
    setLoading(false);
  };

  const displayName = categoryName || category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="container-custom py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-gray-700">Shop</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{displayName}</span>
      </nav>

      {/* Banner */}
      <div className="bg-black text-white p-8 md:p-10 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
        {pagination && <p className="text-sm text-gray-400 mt-2">{pagination.total} products</p>}
      </div>

      {/* Sort & Content */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
        </p>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border px-4 py-2 text-sm outline-none bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-gray-500 mb-4">No products found in this category</p>
          <Link href="/shop">
            <Button variant="outline">Browse All Products</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrev}
                onClick={() => setPage(pagination.page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 text-sm font-medium border ${pagination.page === pageNum ? 'bg-black text-white border-black' : 'hover:bg-gray-50'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => setPage(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
