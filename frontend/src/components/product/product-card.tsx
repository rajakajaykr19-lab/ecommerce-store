'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { api } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to add items to cart'); return; }
    setAdding(true);
    try {
      await api.addToCart(product.id);
      toast.success('Added to cart');
    } catch (err: any) {
      toast.error(err.message);
    }
    setAdding(false);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to use wishlist'); return; }
    try {
      const res = await api.toggleWishlist(product.id);
      setWishlisted(res.data.inWishlist);
      toast.success(res.data.inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const imageUrl = product.primaryImage || product.images?.[0]?.url;
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;

  return (
    <Link href={`/product/${product.slug}`} className={cn('group card rounded-none overflow-hidden', className)}>
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        {imageUrl && !imgError ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No Image</div>
        )}

        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-[#e94560] text-white text-[10px] font-bold px-2 py-1">
            {product.discountPercent || Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100)}% OFF
          </span>
        )}

        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button
            onClick={handleWishlist}
            className={cn(
              'w-9 h-9 bg-white/90 rounded-full flex items-center justify-center transition-all hover:bg-white',
              wishlisted && 'text-[#e94560]'
            )}
            aria-label="Add to wishlist"
          >
            <Heart size={16} fill={wishlisted ? '#e94560' : 'none'} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="w-full bg-white text-gray-900 py-2 text-xs font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} />
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>

      <div className="p-3">
        {product.category && (
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{product.category.name}</p>
        )}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
        {product.avgRating !== undefined && product.avgRating > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={12} className={star <= Math.round(product.avgRating!) ? 'fill-[#d4a853] text-[#d4a853]' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-[10px] text-gray-500">({product.reviewCount})</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{formatPrice(product.salePrice || product.basePrice)}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.basePrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
