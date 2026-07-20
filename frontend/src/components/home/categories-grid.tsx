'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/types';
import { getImageUrl } from '@/lib/utils';

const fallbackCategories = [
  { name: 'Men', slug: 'men', image: '', href: '/shop?gender=MEN', count: '2,500+' },
  { name: 'Women', slug: 'women', image: '', href: '/shop?gender=WOMEN', count: '3,000+' },
  { name: 'Kids', slug: 'kids', image: '', href: '/shop?gender=KIDS', count: '1,500+' },
  { name: 'Accessories', slug: 'accessories', image: '', href: '/shop?gender=ACCESSORIES', count: '800+' },
];

export function CategoriesGrid({ categories }: { categories?: Category[] }) {
  const items = categories?.length ? categories.map(c => ({
    name: c.name, slug: c.slug, image: c.image,
    href: `/shop?categoryId=${c.id}`,
    count: `${c._count?.products || 0}+`,
  })) : fallbackCategories;

  return (
    <section className="py-12 md:py-16">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
          <Link href="/shop" className="text-sm font-medium text-[#1a1a2e] hover:underline">View All →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group relative h-48 md:h-64 bg-gray-100 overflow-hidden"
            >
              {cat.image ? (
                <Image src={getImageUrl(cat.image)} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl font-bold">
                  {cat.name[0]}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white text-lg font-bold">{cat.name}</h3>
                <p className="text-white/70 text-xs">{cat.count} Products</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
