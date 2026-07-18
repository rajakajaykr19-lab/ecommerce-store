'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import type { WishlistItem } from '@/types';
import { Heart, Loader2 } from 'lucide-react';

export default function WishlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.getWishlist().then((res) => setItems(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="container-custom py-20 text-center">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>
        <p className="text-gray-500 mb-6">Sign in to view your wishlist</p>
        <Link href="/auth/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold mb-6">My Wishlist ({items.length})</h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Heart size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 mb-4">Your wishlist is empty</p>
          <Link href="/shop"><Button>Explore Products</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
