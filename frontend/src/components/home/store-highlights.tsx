'use client';

import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';

const highlights = [
  { icon: <Truck size={24} />, title: 'Free Shipping', desc: 'On orders above ₹499' },
  { icon: <ShieldCheck size={24} />, title: 'Secure Payment', desc: '100% secure transactions' },
  { icon: <RotateCcw size={24} />, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: <Headphones size={24} />, title: '24/7 Support', desc: 'Dedicated customer support' },
];

export function StoreHighlights() {
  return (
    <section className="py-8 md:py-12 bg-gray-50">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {highlights.map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 bg-[#1a1a2e] text-white rounded-full flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
