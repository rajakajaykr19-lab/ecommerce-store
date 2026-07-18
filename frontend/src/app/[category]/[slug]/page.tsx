'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice, validatePincode } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import type { Product } from '@/types';
import { Star, Heart, Share2, ShoppingBag, Truck, ShieldCheck, RotateCcw, Minus, Plus, ChevronDown, ChevronRight, MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoryProductPage() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const router = useRouter();
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
  const [activeTab, setActiveTab] = useState('description');
  const [buying, setBuying] = useState(false);

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

  const handleBuyNow = async () => {
    if (!user) { toast.error('Please login first'); return; }
    if (!product) return;
    setBuying(true);
    try {
      await addItem(product.id, quantity);
      router.push('/cart');
    } catch (err: any) {
      toast.error(err.message);
    }
    setBuying(false);
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

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'sizeguide', label: 'Size Guide' },
    { id: 'fabric', label: 'Fabric & Care' },
    { id: 'shipping', label: 'Shipping & Returns' },
  ];

  if (loading) {
    return <div className="container-custom py-20 flex justify-center"><Loader2 className="animate-spin" size={32} /></div>;
  }

  if (!product) {
    return (
      <div className="container-custom py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Product not found</h1>
        <Link href="/shop" className="text-sm underline text-gray-500">Back to shop</Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [{ id: '0', url: product.primaryImage || '', isPrimary: true, displayOrder: 0 }];
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const displayName = category.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="container-custom py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <ChevronRight size={12} />
        <Link href="/shop" className="hover:text-gray-700">Shop</Link>
        <ChevronRight size={12} />
        <Link href={`/${category}`} className="hover:text-gray-700">{displayName}</Link>
        <ChevronRight size={12} />
        <span className="text-gray-900 truncate">{product.name}</span>
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
                {product.discountPercent || Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100)}% OFF
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-24 flex-shrink-0 border-2 ${selectedImage === i ? 'border-black' : 'border-transparent'}`}
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
                <span className="text-sm text-[#e94560] font-medium">
                  {product.discountPercent || Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100)}% off
                </span>
              </>
            )}
          </div>
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
                    className={`w-8 h-8 rounded-full border-2 ${selectedColor === c.color ? 'border-black' : 'border-gray-200'}`}
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
                <Link href="/size-guide" className="text-xs text-gray-500 underline">Size Guide</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const variant = product.variants?.find(v => v.size === size);
                  const isOutOfStock = variant && variant.stock === 0;
                  return (
                    <button
                      key={size}
                      onClick={() => !isOutOfStock && setSelectedSize(size)}
                      disabled={isOutOfStock}
                      className={`min-w-[48px] px-4 py-3 text-sm font-medium border transition-colors ${
                        selectedSize === size
                          ? 'bg-black text-white border-black'
                          : isOutOfStock
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                          : 'border-gray-300 hover:border-black'
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
            <Button onClick={handleBuyNow} loading={buying} variant="gold" className="flex-1">
              Buy Now
            </Button>
            <Button onClick={handleAddToCart} loading={adding} className="flex-1 flex items-center justify-center gap-2">
              <ShoppingBag size={18} /> Add to Cart
            </Button>
            <Button variant="outline" onClick={handleWishlist} className="flex items-center justify-center gap-2">
              <Heart size={18} fill={wishlisted ? '#e94560' : 'none'} />
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
            <div className="flex items-center gap-3 text-sm"><Truck size={16} className="text-gray-400" /> Free shipping on orders above ₹999</div>
            <div className="flex items-center gap-3 text-sm"><ShieldCheck size={16} className="text-gray-400" /> Secure payment via Razorpay, Stripe & UPI</div>
            <div className="flex items-center gap-3 text-sm"><RotateCcw size={16} className="text-gray-400" /> 7-day easy return policy</div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="mt-12 border-t">
        <div className="flex gap-0 border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="py-6">
          {activeTab === 'description' && (
            <div className="max-w-3xl">
              {product.description ? (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
              ) : (
                <p className="text-sm text-gray-400">No description available for this product.</p>
              )}
            </div>
          )}
          {activeTab === 'sizeguide' && (
            <div className="max-w-3xl">
              <p className="text-sm text-gray-600 mb-4">
                Our sizes run true to fit. If you are between sizes, we recommend sizing up for a comfortable fit.
              </p>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium border">Size</th>
                    <th className="px-4 py-2 text-center font-medium border">Chest (in)</th>
                    <th className="px-4 py-2 text-center font-medium border">Waist (in)</th>
                    <th className="px-4 py-2 text-center font-medium border">Length (in)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { size: 'S', chest: '36-38', waist: '30-32', length: '26' },
                    { size: 'M', chest: '38-40', waist: '32-34', length: '27' },
                    { size: 'L', chest: '40-42', waist: '34-36', length: '28' },
                    { size: 'XL', chest: '42-44', waist: '36-38', length: '29' },
                    { size: 'XXL', chest: '44-46', waist: '38-40', length: '30' },
                  ].map((row) => (
                    <tr key={row.size}>
                      <td className="px-4 py-2 border font-medium">{row.size}</td>
                      <td className="px-4 py-2 text-center border">{row.chest}</td>
                      <td className="px-4 py-2 text-center border">{row.waist}</td>
                      <td className="px-4 py-2 text-center border">{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Link href="/size-guide" className="text-xs text-gray-500 underline mt-4 inline-block">View Full Size Guide</Link>
            </div>
          )}
          {activeTab === 'fabric' && (
            <div className="max-w-3xl space-y-3 text-sm text-gray-600">
              <p className="font-medium text-gray-900">Fabric & Care Instructions</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Machine wash cold with similar colors</li>
                <li>Do not bleach or tumble dry</li>
                <li>Iron on low heat if needed</li>
                <li>Do not dry clean</li>
                <li>Wash inside out to preserve color and print</li>
              </ul>
            </div>
          )}
          {activeTab === 'shipping' && (
            <div className="max-w-3xl space-y-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900 mb-1">Shipping</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Free shipping on orders above ₹999</li>
                  <li>Standard delivery: 3-7 business days</li>
                  <li>Express delivery available (₹199)</li>
                  <li>Delivery timeline may vary by location</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Returns & Exchanges</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>7-day return policy from date of delivery</li>
                  <li>Items must be unworn with original tags</li>
                  <li>Free pickup for returns and exchanges</li>
                  <li>Refund processed within 5-7 business days</li>
                </ul>
              </div>
              <Link href="/returns" className="text-xs text-gray-500 underline inline-block">View Full Return Policy</Link>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="mt-12">
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
