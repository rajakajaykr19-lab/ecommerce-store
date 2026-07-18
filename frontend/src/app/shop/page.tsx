'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import type { Product, Pagination, Category, Brand } from '@/types';
import { SlidersHorizontal, X, ChevronDown, Loader2 } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A-Z' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'bestseller', label: 'Best Selling' },
];

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" /></div>}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [filters, setFilters] = useState({
    sort: searchParams.get('sort') || 'newest',
    page: '1',
    gender: searchParams.get('gender') || '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    discountPercent: searchParams.get('discountPercent') || '',
  });

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.data || [])).catch(() => {});
    api.getBrands().then((res) => setBrands(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters, searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sort: filters.sort, page: filters.page, limit: '12' };
      if (filters.gender) params.gender = filters.gender;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.rating) params.rating = filters.rating;
      if (filters.discountPercent) params.discountPercent = filters.discountPercent;
      const categoryParam = searchParams.get('category');
      if (categoryParam) {
        const cat = categories.find(c => c.slug === categoryParam);
        if (cat) params.categoryId = cat.id;
      }
      const res = await api.getProducts(params);
      setProducts(res.data || []);
      setPagination(res.pagination);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  };

  const clearFilters = () => {
    setFilters({ sort: 'newest', page: '1', gender: '', minPrice: '', maxPrice: '', rating: '', discountPercent: '' });
  };

  const hasActiveFilters = filters.gender || filters.minPrice || filters.maxPrice || filters.rating || filters.discountPercent;

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold capitalize">
            {filters.gender ? `${filters.gender.toLowerCase()} Clothing` : 'All Products'}
          </h1>
          {pagination && <p className="text-sm text-gray-500 mt-1">{pagination.total} Products</p>}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: '1' })}
            className="border px-4 py-2 text-sm outline-none bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
            <SlidersHorizontal size={16} /> Filters
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
          <div className="bg-white border p-4 space-y-6 sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filters</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-[#e94560] hover:underline">Clear All</button>
              )}
            </div>

            {/* Gender */}
            <div>
              <h4 className="text-sm font-medium mb-3">Gender</h4>
              <div className="space-y-2">
                {['', 'MEN', 'WOMEN', 'KIDS', 'ACCESSORIES'].map((g) => (
                  <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={filters.gender === g}
                      onChange={() => setFilters({ ...filters, gender: g, page: '1' })}
                      className="accent-[#1a1a2e]"
                    />
                    {g || 'All'}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-sm font-medium mb-3">Price Range</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value, page: '1' })}
                  className="w-full border px-3 py-2 text-sm outline-none"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value, page: '1' })}
                  className="w-full border px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <h4 className="text-sm font-medium mb-3">Minimum Rating</h4>
              <select
                value={filters.rating}
                onChange={(e) => setFilters({ ...filters, rating: e.target.value, page: '1' })}
                className="w-full border px-3 py-2 text-sm outline-none"
              >
                <option value="">Any Rating</option>
                <option value="4">4★ & above</option>
                <option value="3">3★ & above</option>
                <option value="2">2★ & above</option>
              </select>
            </div>

            {/* Discount */}
            <div>
              <h4 className="text-sm font-medium mb-3">Discount</h4>
              <select
                value={filters.discountPercent}
                onChange={(e) => setFilters({ ...filters, discountPercent: e.target.value, page: '1' })}
                className="w-full border px-3 py-2 text-sm outline-none"
              >
                <option value="">Any Discount</option>
                <option value="10">10% & above</option>
                <option value="20">20% & above</option>
                <option value="30">30% & above</option>
                <option value="50">50% & above</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-gray-500">No products found</p>
              <button onClick={clearFilters} className="text-sm text-[#1a1a2e] underline mt-2">Clear filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    onClick={() => setFilters({ ...filters, page: String(pagination.page - 1) })}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setFilters({ ...filters, page: String(pageNum) })}
                        className={`w-10 h-10 text-sm font-medium border ${pagination.page === pageNum ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setFilters({ ...filters, page: String(pagination.page + 1) })}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
