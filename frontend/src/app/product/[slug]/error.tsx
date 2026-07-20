'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ProductError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Product page error:', error);
  }, [error]);

  return (
    <div className="container-custom py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="text-gray-500 mb-6">We couldn&apos;t load this product. Please try again.</p>
      <div className="flex gap-4 justify-center">
        <button onClick={reset} className="px-6 py-3 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors">
          Try Again
        </button>
        <Link href="/shop" className="px-6 py-3 border border-gray-300 text-sm font-medium hover:border-black transition-colors">
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
