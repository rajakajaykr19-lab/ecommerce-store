'use client';

import Link from 'next/link';

export function SaleBanner() {
  return (
    <section className="py-8 md:py-12">
      <div className="container-custom">
        <div className="relative bg-gradient-to-r from-[#e94560] to-[#c0392b] overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative z-10 px-8 py-12 md:px-16 md:py-20 text-center md:text-left">
            <div className="max-w-2xl mx-auto md:mx-0">
              <p className="text-white/80 text-sm uppercase tracking-widest mb-2">Limited Time Offer</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Mid-Season Sale</h2>
              <p className="text-white/90 text-lg mb-6">Up to 50% off on selected styles. Don&apos;t miss out!</p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                <Link href="/shop?discountPercent=30" className="bg-white text-[#e94560] px-8 py-3 font-medium hover:bg-gray-100 transition-colors">
                  Shop Sale
                </Link>
                <Link href="/shop" className="text-white border-2 border-white px-8 py-3 font-medium hover:bg-white/10 transition-colors">
                  View All
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
