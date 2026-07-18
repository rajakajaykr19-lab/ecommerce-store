'use client';

import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const fallbackBanners = [
  {
    title: 'Summer Collection 2026',
    subtitle: 'New Arrivals',
    description: 'Discover the latest trends for the season',
    buttonText: 'Shop Now',
    link: '/shop?sort=newest',
    bg: 'bg-gradient-to-r from-[#1a1a2e] to-[#16213e]',
  },
  {
    title: 'Up to 50% Off',
    subtitle: 'Mid-Season Sale',
    description: 'Limited time offer on selected styles',
    buttonText: 'Shop Sale',
    link: '/shop?discountPercent=30',
    bg: 'bg-gradient-to-r from-[#e94560] to-[#c0392b]',
  },
  {
    title: 'Premium Fashion',
    subtitle: 'Curated Collection',
    description: 'Elevate your style with our premium picks',
    buttonText: 'Explore',
    link: '/shop',
    bg: 'bg-gradient-to-r from-[#0f3460] to-[#1a1a2e]',
  },
];

export function HeroBanner({ banners }: { banners?: typeof fallbackBanners }) {
  const items = banners || fallbackBanners;

  return (
    <section className="relative">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        className="w-full"
      >
        {items.map((banner, index) => (
          <SwiperSlide key={index}>
            <div className={`${banner.bg} relative overflow-hidden`}>
              <div className="container-custom">
                <div className="min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center py-16 md:py-20">
                  <div className="max-w-lg text-white">
                    <p className="text-sm md:text-base uppercase tracking-[0.2em] mb-3 opacity-80">{banner.subtitle}</p>
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4 leading-tight">{banner.title}</h1>
                    <p className="text-base md:text-lg mb-8 opacity-90">{banner.description}</p>
                    <Link
                      href={banner.link}
                      className="inline-block bg-white text-[#1a1a2e] px-8 py-4 font-medium hover:bg-gray-100 transition-colors"
                    >
                      {banner.buttonText}
                    </Link>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
              <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/5" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
