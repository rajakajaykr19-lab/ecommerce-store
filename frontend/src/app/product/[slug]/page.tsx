'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice, validatePincode } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import type { Product } from '@/types';
import { Star, Heart, Share2, ShoppingBag, Truck, ShieldCheck, RotateCcw, Minus, Plus, ChevronDown, MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<{ deliverable: boolean; message: string; estimatedDays?: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.getProductBySlug(slug);
      setProduct(res.data);
    } catch {
      setProduct(null);
    }
    setLoading(false);
  };

  const checkPincode = async () => {
    if (!validatePincode(pincode)) { toast.error('Enter a valid 6-digit pincode'); return; }
    try {
      const res = await api.checkPincode(pincode);
      setPincodeStatus(res.data);
    } catch {
      setPincodeStatus({ deliverable: false, message: 'Unable to check delivery' });
    }
  };

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please login first'); return; }
    setAdding(true);
    try {
      await addItem(product!.id, quantity);
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(err.message);
    }
    setAdding(false);
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please login first'); return; }
    try {
      const res = await api.toggleWishlist(product!.id);
      setWishlisted(res.data.inWishlist);
      toast.success(res.data.inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <div className="container-custom py-20 flex justify-center"><Loader2 className="animate-spin" size={32} /></div>;
  }

  if (!product) {
    return <div className="container-custom py-20 text-center"><h1 className="text-2xl font-bold">Product not found</h1><Link href="/shop" className="text-sm underline mt-2 inline-block">Back to shop</Link></div>;
  }

  const images = product.images?.length ? product.images : [{ id: '0', url: product.primaryImage || '', isPrimary: true, displayOrder: 0 }];
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;

  return (
    <div className="container-custom py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/shop${product.gender ? `?gender=${product.gender}` : ''}`}>{product.gender || 'Shop'}</Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
            {images[selectedImage]?.url ? (
              <Image
                src={images[selectedImage].url}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
            )}
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-[#e94560] text-white text-sm font-bold px-3 py-1">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-24 flex-shrink-0 border-2 ${selectedImage === i ? 'border-[#1a1a2e]' : 'border-transparent'}`}
                >
                  <Image src={img.url} alt="" width={80} height={96} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {product.category && (
            <p className="text-xs uppercase tracking-widest text-gray-400">{product.category.name}</p>
          )}
          <h1 className="text-2xl lg:text-3xl font-bold">{product.name}</h1>

          {/* Rating */}
          {product.avgRating !== undefined && product.avgRating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} className={star <= Math.round(product.avgRating!) ? 'fill-[#d4a853] text-[#d4a853]' : 'text-gray-300'} />
                ))}
              </div>
              <span className="text-sm text-gray-500">{product.avgRating} ({product.reviewCount} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.salePrice || product.basePrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.basePrice)}</span>
                <span className="text-sm text-[#e94560] font-medium">{product.discountPercent}% off</span>
              </>
            )}
          </div>

          {/* Tax */}
          <p className="text-xs text-gray-500">inclusive of all taxes</p>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Color: <span className="text-gray-500">{selectedColor || 'Select'}</span></h3>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setSelectedColor(c.color)}
                    className={`w-8 h-8 rounded-full border-2 ${selectedColor === c.color ? 'border-[#1a1a2e]' : 'border-gray-200'}`}
                    style={{ backgroundColor: c.colorHex || c.color }}
                    title={c.color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Size: <span className="text-gray-500">{selectedSize || 'Select'}</span></h3>
                <button onClick={() => setShowSizeGuide(!showSizeGuide)} className="text-xs text-[#1a1a2e] underline flex items-center gap-1">
                  Size Guide <ChevronDown size={12} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const variant = product.availableVariants?.find(v => v.size === size);
                  const isOutOfStock = variant && variant.stock === 0;
                  return (
                    <button
                      key={size}
                      onClick={() => !isOutOfStock && setSelectedSize(size)}
                      disabled={isOutOfStock}
                      className={`min-w-[48px] px-4 py-3 text-sm font-medium border transition-colors ${
                        selectedSize === size
                          ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                          : isOutOfStock
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                          : 'border-gray-300 hover:border-[#1a1a2e]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 className="text-sm font-medium mb-2">Quantity</h3>
            <div className="flex items-center border w-fit">
              <button onClick={() => quantity > 1 && setQuantity(quantity - 1)} className="p-3 hover:bg-gray-50"><Minus size={16} /></button>
              <span className="px-6 text-sm font-medium">{quantity}</span>
              <button onClick={() => quantity < 10 && setQuantity(quantity + 1)} className="p-3 hover:bg-gray-50"><Plus size={16} /></button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleAddToCart} loading={adding} className="flex-1 flex items-center justify-center gap-2">
              <ShoppingBag size={18} /> Add to Cart
            </Button>
            <Button variant="secondary" onClick={handleWishlist} className="flex items-center justify-center gap-2">
              <Heart size={18} fill={wishlisted ? '#e94560' : 'none'} /> {wishlisted ? 'Wishlisted' : 'Wishlist'}
            </Button>
            <Button variant="outline" className="flex items-center justify-center" onClick={() => toast.success('Link copied!')}>
              <Share2 size={18} />
            </Button>
          </div>

          {/* Pincode Check */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2"><MapPin size={16} /> Check Delivery</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter pincode"
                className="border px-4 py-3 text-sm outline-none w-40"
                maxLength={6}
              />
              <Button variant="primary" size="sm" onClick={checkPincode}>Check</Button>
            </div>
            {pincodeStatus && (
              <p className={`text-sm mt-2 ${pincodeStatus.deliverable ? 'text-green-600' : 'text-red-500'}`}>
                {pincodeStatus.message}
                {pincodeStatus.deliverable && pincodeStatus.estimatedDays && ` (${pincodeStatus.estimatedDays})`}
              </p>
            )}
          </div>

          {/* Highlights */}
          <div className="border-t pt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm"><Truck size={16} className="text-gray-400" /> Free shipping on orders above ₹499</div>
            <div className="flex items-center gap-3 text-sm"><ShieldCheck size={16} className="text-gray-400" /> Secure payment via Razorpay, Stripe & UPI</div>
            <div className="flex items-center gap-3 text-sm"><RotateCcw size={16} className="text-gray-400" /> 30-day easy return policy</div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-6 max-w-2xl">
            {product.reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-b pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {review.user.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.user.name}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={12} className={star <= review.rating ? 'fill-[#d4a853] text-[#d4a853]' : 'text-gray-300'} />
                      ))}
                    </div>
                  </div>
                  {review.isVerified && <span className="text-[10px] text-green-600 ml-auto">Verified Purchase</span>}
                </div>
                {review.title && <p className="text-sm font-medium mb-1">{review.title}</p>}
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
