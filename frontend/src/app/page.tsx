import { HeroBanner } from '@/components/home/hero-banner';
import { CategoriesGrid } from '@/components/home/categories-grid';
import { ProductSection } from '@/components/home/product-section';
import { SaleBanner } from '@/components/home/sale-banner';
import { StoreHighlights } from '@/components/home/store-highlights';
import { api } from '@/lib/api';
import type { Product, Category, Banner } from '@/types';

async function getData() {
  try {
    const [featured, newArrivals, bestSellers, trending, categories, banners] = await Promise.all([
      api.getFeaturedProducts().catch(() => ({ data: [] as Product[] })),
      api.getNewArrivals().catch(() => ({ data: [] as Product[] })),
      api.getBestSellers().catch(() => ({ data: [] as Product[] })),
      api.getTrendingProducts().catch(() => ({ data: [] as Product[] })),
      api.getCategories().catch(() => ({ data: [] as Category[] })),
      api.getBanners().catch(() => ({ data: [] as Banner[] })),
    ]);
    return { featured: featured.data, newArrivals: newArrivals.data, bestSellers: bestSellers.data, trending: trending.data, categories: categories.data, banners: banners.data };
  } catch {
    return { featured: [], newArrivals: [], bestSellers: [], trending: [], categories: [], banners: [] };
  }
}

export default async function HomePage() {
  const { featured, newArrivals, bestSellers, trending, categories, banners } = await getData();

  return (
    <div>
      <HeroBanner />
      <StoreHighlights />
      <CategoriesGrid categories={categories} />
      <ProductSection title="Featured Products" link="/shop?sort=newest" products={featured} />
      <ProductSection title="New Arrivals" link="/shop?sort=newest" products={newArrivals} />
      <SaleBanner />
      <ProductSection title="Best Sellers" link="/shop?sort=bestseller" products={bestSellers} />
      <ProductSection title="Trending Now" link="/shop" products={trending} />
    </div>
  );
}
