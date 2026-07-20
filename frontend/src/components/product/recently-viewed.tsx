'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from './product-card';
import type { Product } from '@/types';

interface RecentlyViewedProps {
  currentSlug: string;
}

const STORAGE_KEY = 'recentlyViewed';
const MAX_ITEMS = 10;

export function RecentlyViewed({ currentSlug }: RecentlyViewedProps) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items: Product[] = stored ? JSON.parse(stored) : [];
      setProducts(items.filter((p) => p.slug !== currentSlug).slice(0, MAX_ITEMS));
    } catch { /* empty */ }
  }, [currentSlug]);

  if (products.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

export function trackRecentlyViewed(product: Product) {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let items: Product[] = stored ? JSON.parse(stored) : [];
    items = items.filter((p) => p.slug !== product.slug);
    const slim = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice: product.basePrice,
      salePrice: product.salePrice,
      discountPercent: product.discountPercent,
      primaryImage: product.primaryImage,
      images: product.images?.slice(0, 1),
      category: product.category,
      avgRating: product.avgRating,
      reviewCount: product.reviewCount,
      currency: product.currency,
      gender: product.gender,
      brand: product.brand,
      isNewArrival: product.isNewArrival,
      isBestSeller: product.isBestSeller,
    } as Product;
    items.unshift(slim);
    items = items.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* empty */ }
}
