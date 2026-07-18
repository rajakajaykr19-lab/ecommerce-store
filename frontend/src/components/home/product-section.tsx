'use client';

import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { ProductCard } from '@/components/product/product-card';
import type { Product } from '@/types';
import 'swiper/css';

interface ProductSectionProps {
  title: string;
  link?: string;
  products: Product[];
}

export function ProductSection({ title, link, products }: ProductSectionProps) {
  if (!products.length) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
          {link && (
            <Link href={link} className="text-sm font-medium text-[#1a1a2e] hover:underline">View All →</Link>
          )}
        </div>
        <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="md:hidden">
          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 4000 }}
            spaceBetween={12}
            slidesPerView={2.2}
            className="px-1"
          >
            {products.slice(0, 8).map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
