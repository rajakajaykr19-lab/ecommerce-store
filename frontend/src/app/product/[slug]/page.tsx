'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { formatPrice, validatePincode, getImageUrl } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { ProductGallery } from '@/components/product/product-gallery';
import { FindMySize } from '@/components/product/find-my-size';
import { ReviewsSection } from '@/components/product/reviews-section';
import { RecentlyViewed, trackRecentlyViewed } from '@/components/product/recently-viewed';
import type { Product } from '@/types';
import {
  Star, Heart, Share2, ShoppingBag, Truck, ShieldCheck, RotateCcw,
  Minus, Plus, ChevronDown, ChevronRight, ChevronLeft, MapPin, Loader2,
  Check, Copy, MessageCircle, X, Eye, Zap, BadgeCheck, Package,
  ThumbsUp, Send, Ruler, Layers, Sparkles, CreditCard, Headphones,
  Clock, Shield, HelpCircle, MessageSquare, ShoppingBasket, Users,
  FileText, Award, TruckIcon, RefreshCcw, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

const sizeChartData: Record<string, { size: string; chest: string; waist: string; length: string }[]> = {
  default: [
    { size: 'S', chest: '36-38', waist: '30-32', length: '26' },
    { size: 'M', chest: '38-40', waist: '32-34', length: '27' },
    { size: 'L', chest: '40-42', waist: '34-36', length: '28' },
    { size: 'XL', chest: '42-44', waist: '36-38', length: '29' },
    { size: 'XXL', chest: '44-46', waist: '38-40', length: '30' },
  ],
};

function ProductSkeleton() {
  return (
    <div className="container-custom py-8">
      <div className="h-4 w-64 bg-gray-100 rounded mb-6 animate-pulse" />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-gray-100 rounded-xl animate-pulse" />
          <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="w-20 h-24 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        </div>
        <div className="space-y-6">
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-8 w-3/4 bg-gray-100 rounded animate-pulse" />
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 w-48 bg-gray-100 rounded animate-pulse" />
          <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="w-14 h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          <div className="h-14 w-full bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<{ deliverable: boolean; message: string; estimatedDays?: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCartPanel, setShowCartPanel] = useState(false);
  const [cartPanelItem, setCartPanelItem] = useState<{ name: string; price: number; image: string; quantity: number } | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [expressDelivery, setExpressDelivery] = useState(false);
  const [qaQuestions, setQaQuestions] = useState<{ id: string; q: string; a: string; askedBy: string; answeredBy: string; date: string }[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchProduct(); }, [slug]);
  useEffect(() => {
    setSelectedSize(null); setSelectedColor(null); setQuantity(1);
    setPincodeStatus(null); setShowCartPanel(false);
  }, [slug]);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShareMenu(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.getProductBySlug(slug);
      setProduct(res.data);
      trackRecentlyViewed(res.data);
    } catch { setProduct(null); }
    setLoading(false);
  };

  const checkPincode = async () => {
    if (!validatePincode(pincode)) { toast.error('Enter a valid 6-digit pincode'); return; }
    try { const res = await api.checkPincode(pincode); setPincodeStatus(res.data); }
    catch { setPincodeStatus({ deliverable: false, message: 'Unable to check delivery' }); }
  };

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please login first'); return; }
    setAdding(true);
    try {
      await addItem(product!.id, quantity);
      setCartPanelItem({ name: product!.name, price: product!.salePrice || product!.basePrice, image: product!.images?.[0]?.url || '', quantity });
      setShowCartPanel(true);
    } catch (err: any) { toast.error(err.message); }
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!user) { toast.error('Please login first'); return; }
    setBuying(true);
    try { await addItem(product!.id, quantity); router.push('/checkout'); }
    catch (err: any) { toast.error(err.message); }
    setBuying(false);
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please login first'); return; }
    try { const res = await api.toggleWishlist(product!.id); setWishlisted(res.data.inWishlist); toast.success(res.data.inWishlist ? 'Added to wishlist' : 'Removed'); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) { try { await navigator.share({ title: product?.name, url }); } catch {} }
    else { try { await navigator.clipboard.writeText(url); toast.success('Link copied!'); } catch {} }
    setShowShareMenu(false);
  }, [product?.name]);

  const handleAskQuestion = () => {
    if (!user) { toast.error('Please login first'); return; }
    if (!newQuestion.trim()) return;
    setQaQuestions((prev) => [...prev, {
      id: Date.now().toString(), q: newQuestion.trim(), a: '',
      askedBy: user.name, answeredBy: '', date: new Date().toISOString()
    }]);
    setNewQuestion('');
    toast.success('Question submitted! Seller will respond shortly.');
  };

  const toggleAccordion = (id: string) => setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }));

  const attributeValues: any[] = (product as any)?.attributeValues || [];
  const specGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    attributeValues.filter((av: any) => av.value?.trim()).forEach((av: any) => {
      const name = av.attribute?.group?.name || 'Details';
      if (!groups[name]) groups[name] = [];
      groups[name].push(av);
    });
    return groups;
  }, [attributeValues]);

  const highlights = useMemo(() => {
    return attributeValues
      .filter((av: any) => av.value?.trim() && ['fabric', 'material', 'fit', 'pattern', 'sleeve', 'neck', 'occasion', 'season', 'stretch', 'breathability'].includes(av.attribute?.slug))
      .map((av: any) => av.attribute.name + ': ' + av.value)
      .slice(0, 8);
  }, [attributeValues]);

  const fabricAttrs = useMemo(() => {
    return attributeValues.filter((av: any) =>
      av.value?.trim() && ['fabric', 'material', 'weight', 'gsm', 'softness', 'stretch', 'breathability', 'thickness', 'washCare', 'ironInstructions'].includes(av.attribute?.slug)
    );
  }, [attributeValues]);

  if (loading) return <ProductSkeleton />;

  if (!product) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center"><Package size={40} className="text-gray-300" /></div>
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">This product may have been removed or is no longer available.</p>
        <Link href="/shop" className="inline-block bg-black text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 transition-colors">Continue Shopping</Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [{ id: '0', url: product.primaryImage || '', isPrimary: true, displayOrder: 0 }];
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const discountPercent = product.discountPercent || (hasDiscount ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100) : 0);
  const activeVariant = product.availableVariants?.find((v) => v.size === selectedSize && (!selectedColor || v.color === selectedColor));
  const variantStock = activeVariant?.stock ?? 0;

  const galleryBadges: { label: string; color: string }[] = [];
  if (hasDiscount) galleryBadges.push({ label: `${discountPercent}% OFF`, color: '#e94560' });
  if (product.isNewArrival) galleryBadges.push({ label: 'NEW', color: '#22c55e' });
  if (product.isBestSeller) galleryBadges.push({ label: 'BESTSELLER', color: '#d4a853' });

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'sizeguide', label: 'Size Guide' },
    { id: 'fabric', label: 'Fabric & Care' },
    { id: 'shipping', label: 'Shipping & Returns' },
  ];

  return (
    <>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.description,
        image: images.map((img) => getImageUrl(img.url)),
        brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
        sku: product.sku,
        offers: { '@type': 'Offer', priceCurrency: product.currency || 'INR', price: product.salePrice || product.basePrice, availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
        aggregateRating: product.avgRating ? { '@type': 'AggregateRating', ratingValue: product.avgRating, reviewCount: product.reviewCount || 0 } : undefined,
      })}} />

      <div className="container-custom py-4 lg:py-6">

        {/* ===== 2. BREADCRUMB ===== */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 overflow-x-auto scrollbar-hide">
          <Link href="/" className="hover:text-gray-700 whitespace-nowrap">Home</Link>
          <ChevronRight size={10} className="flex-shrink-0" />
          {product.gender && (<><Link href={`/shop?gender=${product.gender}`} className="hover:text-gray-700 whitespace-nowrap">{product.gender}</Link><ChevronRight size={10} className="flex-shrink-0" /></>)}
          {product.category && (<><Link href={`/shop?categoryId=${product.categoryId}`} className="hover:text-gray-700 whitespace-nowrap">{product.category.name}</Link><ChevronRight size={10} className="flex-shrink-0" /></>)}
          <span className="text-gray-700 font-medium truncate">{product.name}</span>
        </nav>

        {/* ===== 3. HERO PRODUCT SECTION ===== */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT: Gallery */}
          <ProductGallery images={images} videos={(product as any).videos || []} productName={product.name} badges={galleryBadges} />

          {/* RIGHT: Product Info */}
          <div className="flex flex-col">
            {/* Category */}
            {product.category && <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{product.category.name}</p>}

            {/* Name */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>

            {/* Brand */}
            {product.brand && <p className="text-sm text-gray-500 mb-3">by <span className="font-medium text-gray-700">{product.brand.name}</span></p>}

            {/* Rating + Reviews + Sold */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {product.avgRating !== undefined && product.avgRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 bg-green-50 px-2 py-1 rounded-md">
                    <span className="text-sm font-bold text-green-700">{product.avgRating}</span>
                    <Star size={13} className="fill-green-700 text-green-700" />
                  </div>
                  <span className="text-sm text-gray-500">{product.reviewCount || 0} ratings</span>
                </div>
              )}
              {product._count?.reviews !== undefined && <span className="text-xs text-gray-400 hidden sm:inline">·</span>}
              <span className="text-sm text-gray-500 hidden sm:inline">{product.totalStock || 0} in stock</span>
            </div>

            {/* SKU */}
            {product.sku && <p className="text-xs text-gray-400 mb-3">SKU: {product.sku}</p>}

            {/* Price */}
            <div className="flex items-end gap-3 mb-1">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(product.salePrice || product.basePrice || 0)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through">{formatPrice(product.basePrice || 0)}</span>
                  <span className="text-sm font-bold text-[#e94560]">{discountPercent}% off</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-1">Inclusive of all taxes</p>
            {product.gstRate && <p className="text-[10px] text-gray-400 mb-4">GST: {product.gstRate}%</p>}

            {/* Divider */}
            <div className="border-t border-gray-100 mb-4" />

            {/* Available Offers */}
            {(product.flashSale || product.festivalOffer || product.bogo || product.couponEligible) && (
              <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl">
                <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1"><Sparkles size={12} /> Available Offers</p>
                <div className="space-y-1.5">
                  {product.flashSale && <p className="text-xs text-green-700">⚡ Flash Sale Price Applied</p>}
                  {product.festivalOffer && <p className="text-xs text-green-700">🎉 Festival Offer Active</p>}
                  {product.couponEligible && <p className="text-xs text-green-700">🏷️ Coupon codes accepted at checkout</p>}
                  {product.bogo && <p className="text-xs text-green-700">🎁 Buy One Get One available</p>}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-4 flex items-center gap-2">
              {selectedSize ? (
                variantStock > 0 ? (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1"><Check size={12} /> In Stock{variantStock <= 5 ? ` — Only ${variantStock} left!` : ''}</span>
                ) : (
                  <span className="text-xs font-medium text-red-500 bg-red-50 px-2.5 py-1 rounded-full flex items-center gap-1"><X size={12} /> Out of Stock</span>
                )
              ) : (
                <span className="text-xs text-gray-400">Select a size to check availability</span>
              )}
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Color: <span className="text-gray-500">{selectedColor || 'Select'}</span></h3>
                <div className="flex gap-2.5">
                  {product.colors.map((c) => (
                    <button key={c.color} onClick={() => setSelectedColor(c.color)} className={`w-9 h-9 rounded-full transition-all ${selectedColor === c.color ? 'ring-2 ring-black ring-offset-2 scale-110' : 'ring-1 ring-gray-200 hover:ring-gray-400'}`} style={{ backgroundColor: c.colorHex || c.color }} title={c.color} />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Size: <span className="text-gray-500">{selectedSize || 'Select'}</span></h3>
                  <button onClick={() => setShowSizeGuide(!showSizeGuide)} className="text-xs text-gray-600 underline underline-offset-2 hover:text-black">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const v = product.availableVariants?.find((vv) => vv.size === size);
                    const oos = v && v.stock === 0;
                    return (
                      <button key={size} onClick={() => !oos && setSelectedSize(size)} disabled={!!oos} className={`min-w-[52px] px-4 py-3 text-sm font-medium border rounded-lg transition-all ${selectedSize === size ? 'bg-black text-white border-black' : oos ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through border-gray-200' : 'border-gray-300 hover:border-black'}`}>{size}</button>
                    );
                  })}
                </div>
                {showSizeGuide && (
                  <div className="mt-3 border border-gray-200 bg-gray-50 p-4 rounded-xl animate-fadeIn">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">Size Chart</h4>
                      <button onClick={() => setShowSizeGuide(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-gray-200"><th className="py-2 pr-3 text-left font-semibold">Size</th><th className="py-2 px-2 text-center font-semibold">Chest (in)</th><th className="py-2 px-2 text-center font-semibold">Waist (in)</th><th className="py-2 px-2 text-center font-semibold">Length (in)</th></tr></thead>
                        <tbody>
                          {(sizeChartData.default.filter((r) => product.sizes?.includes(r.size))).map((row) => (
                            <tr key={row.size} className="border-b border-gray-100 last:border-0"><td className="py-2 pr-3 font-medium">{row.size}</td><td className="py-2 px-2 text-center">{row.chest}</td><td className="py-2 px-2 text-center">{row.waist}</td><td className="py-2 px-2 text-center">{row.length}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Link href="/size-guide" className="text-xs text-black underline mt-2 inline-block">View full size guide</Link>
                  </div>
                )}
              </div>
            )}

            {/* Find My Size */}
            <div className="mb-4">
              <FindMySize availableSizes={product.sizes || []} onSelectSize={(s) => setSelectedSize(s)} />
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Quantity</h3>
              <div className="flex items-center border rounded-lg w-fit">
                <button onClick={() => quantity > 1 && setQuantity(quantity - 1)} className="p-3 hover:bg-gray-50 rounded-l-lg transition-colors" disabled={quantity <= 1}><Minus size={16} /></button>
                <span className="px-6 text-sm font-medium tabular-nums">{quantity}</span>
                <button onClick={() => quantity < 10 && setQuantity(quantity + 1)} className="p-3 hover:bg-gray-50 rounded-r-lg transition-colors" disabled={quantity >= 10}><Plus size={16} /></button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex gap-3">
                <Button onClick={handleAddToCart} loading={adding} className="flex-1 flex items-center justify-center gap-2 !py-4 !text-sm font-semibold rounded-xl"><ShoppingBag size={18} /> Add to Cart</Button>
                <div className="relative" ref={shareRef}>
                  <Button variant="outline" className="!px-4 flex items-center justify-center rounded-xl" onClick={() => setShowShareMenu(!showShareMenu)}><Share2 size={18} /></Button>
                  {showShareMenu && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 shadow-xl z-20 py-1 rounded-xl animate-fadeIn">
                      <button onClick={handleShare} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"><MessageCircle size={16} className="text-green-600" /> Share</button>
                      <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); setShowShareMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"><Copy size={16} className="text-gray-500" /> Copy Link</button>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="gold" onClick={handleBuyNow} loading={buying} className="w-full flex items-center justify-center gap-2 !py-4 !text-sm font-semibold rounded-xl"><Zap size={18} /> Buy Now</Button>
              <button onClick={handleWishlist} className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-medium border rounded-xl transition-all ${wishlisted ? 'border-[#e94560] text-[#e94560] bg-[#e94560]/5' : 'border-gray-300 hover:border-gray-500'}`}>
                <Heart size={18} fill={wishlisted ? '#e94560' : 'none'} className={wishlisted ? 'scale-110' : ''} />
                {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
              </button>
            </div>

            {/* Delivery Section */}
            <div className="border border-gray-200 p-4 mb-4 rounded-xl">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><MapPin size={16} /> Delivery Options</h3>
              <div className="flex gap-2">
                <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter pincode" className="border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black rounded-lg flex-1 max-w-[180px]" maxLength={6} onKeyDown={(e) => e.key === 'Enter' && checkPincode()} />
                <Button variant="primary" size="sm" onClick={checkPincode} className="rounded-lg">Check</Button>
              </div>
              {pincodeStatus && (
                <div className={`mt-3 flex items-start gap-2 text-sm ${pincodeStatus.deliverable ? 'text-green-600' : 'text-red-500'}`}>
                  {pincodeStatus.deliverable ? <Check size={16} className="mt-0.5 flex-shrink-0" /> : <X size={16} className="mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="font-medium">{pincodeStatus.message}</p>
                    {pincodeStatus.deliverable && pincodeStatus.estimatedDays && <p className="text-xs text-gray-500 mt-0.5">Est. delivery: {pincodeStatus.estimatedDays}</p>}
                  </div>
                </div>
              )}
              {/* Express Delivery Toggle */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => setExpressDelivery(!expressDelivery)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${expressDelivery ? 'border-[#d4a853] bg-[#d4a853]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2.5">
                    <Zap size={16} className={expressDelivery ? 'text-[#d4a853]' : 'text-gray-400'} />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-800">Express Delivery</p>
                      <p className="text-[10px] text-gray-400">Get it in 1-2 days (₹199 extra)</p>
                    </div>
                  </div>
                  <div className={`w-9 h-5 rounded-full transition-all flex items-center ${expressDelivery ? 'bg-[#d4a853] justify-end' : 'bg-gray-200 justify-start'}`}><div className="w-4 h-4 rounded-full bg-white shadow-sm mx-0.5" /></div>
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { icon: <ShieldCheck size={16} />, text: '100% Original' },
                { icon: <Truck size={16} />, text: 'Free Shipping' },
                { icon: <RotateCcw size={16} />, text: 'Easy Returns' },
                { icon: <CreditCard size={16} />, text: 'Secure Payment' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-gray-400">{item.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Seller Info */}
            {product.brand && (
              <div className="border border-gray-200 p-4 rounded-xl mb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sold by</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">{product.brand.name[0].toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.brand.name}</p>
                    <p className="text-[10px] text-gray-400">Usually responds within 24 hours</p>
                  </div>
                  <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-1 flex items-center gap-1 flex-shrink-0"><BadgeCheck size={12} /> Verified</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== 4. PRODUCT HIGHLIGHTS ===== */}
        {highlights.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-bold mb-4">Product Highlights</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                  <Check size={16} className="text-[#d4a853] flex-shrink-0" />
                  <span className="text-sm text-gray-700">{h}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== 6. FABRIC EXPERIENCE ===== */}
        {fabricAttrs.length > 0 && (
          <section className="mt-10 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-bold mb-4">Fabric Experience</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {fabricAttrs.map((av: any) => (
                <div key={av.id} className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{av.attribute.name}</p>
                  <p className="text-sm font-semibold text-gray-900">{av.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== 8. PRODUCT DESCRIPTION ===== */}
        <section className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-bold mb-4">Product Description</h2>
          {product.description ? (
            <div className="prose prose-sm max-w-3xl text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</div>
          ) : (
            <p className="text-sm text-gray-400 italic">No description available.</p>
          )}
          {product.tags && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {product.tags.split(',').map((tag: string, i: number) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{tag.trim()}</span>
              ))}
            </div>
          )}
        </section>

        {/* ===== 9. PRODUCT SPECIFICATIONS ===== */}
        {Object.keys(specGroups).length > 0 && (
          <section className="mt-10 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-bold mb-6">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              {Object.entries(specGroups).map(([groupName, attrs]) => (
                <div key={groupName} className="border border-gray-200 rounded-xl overflow-hidden">
                  <h3 className="text-sm font-semibold text-gray-900 px-4 py-3 bg-gray-50">{groupName}</h3>
                  <div>
                    {attrs.map((av: any, i: number) => (
                      <div key={av.id} className={`flex justify-between text-sm px-4 py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${i < attrs.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <span className="text-gray-500">{av.attribute.name}</span>
                        <span className="text-gray-900 font-medium">{av.attribute.fieldType === 'boolean' ? (av.value === 'true' ? 'Yes' : 'No') : av.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== TABS (Desktop) + ACCORDIONS (Mobile) ===== */}
        <section className="mt-10 border-t border-gray-200 pt-8">
          {/* Desktop */}
          <div className="hidden md:block">
            <div className="flex gap-0 border-b border-gray-200 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{tab.label}</button>
              ))}
            </div>
            <div className="py-8 max-w-3xl">
              {activeTab === 'description' && (
                product.description ? <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p> : <p className="text-sm text-gray-400 italic">No description.</p>
              )}
              {activeTab === 'sizeguide' && (
                <div>
                  <div className="bg-[#d4a853]/5 border border-[#d4a853]/20 p-4 mb-6 rounded-xl flex items-start gap-3">
                    <BadgeCheck size={18} className="text-[#d4a853] mt-0.5" />
                    <p className="text-sm text-gray-600"><span className="font-semibold">Our sizes run true to fit.</span> If between sizes, we recommend sizing up.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead><tr className="bg-black text-white"><th className="px-4 py-3 text-left font-semibold">Size</th><th className="px-4 py-3 text-center">Chest (in)</th><th className="px-4 py-3 text-center">Waist (in)</th><th className="px-4 py-3 text-center">Length (in)</th></tr></thead>
                      <tbody>{sizeChartData.default.map((row, i) => (<tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}><td className="px-4 py-3"><span className="inline-flex items-center justify-center w-10 h-10 bg-black text-white font-bold text-xs rounded-lg">{row.size}</span></td><td className="px-4 py-3 text-center">{row.chest}</td><td className="px-4 py-3 text-center">{row.waist}</td><td className="px-4 py-3 text-center">{row.length}</td></tr>))}</tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'fabric' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Fabric & Care</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ label: 'Fabric', value: product.fabric }, { label: 'Material', value: product.material }, { label: 'Wash Care', value: product.washCare }].filter((i) => i.value).map((item) => (
                      <div key={item.label} className="flex gap-3"><span className="text-xs font-medium text-gray-400 w-20 uppercase">{item.label}</span><span className="text-sm text-gray-700">{item.value}</span></div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'shipping' && (
                <div className="space-y-6 text-sm text-gray-600">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Free shipping above ₹499</li>
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Standard delivery: 3-7 business days</li>
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Express delivery: 1-2 days (₹199)</li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-900 mb-2">Returns & Exchanges</h3>
                    <ul className="space-y-2">
                      {product.returnAvailable && <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> {product.returnPeriod || 7}-day return policy</li>}
                      {product.exchangeAvailable && <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Free exchange available</li>}
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Items must be unworn with original tags</li>
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Refund in 5-7 business days</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Accordions */}
          <div className="md:hidden space-y-0">
            {tabs.map((tab) => (
              <div key={tab.id} className="border-b border-gray-200">
                <button onClick={() => toggleAccordion(tab.id)} className="w-full flex items-center justify-between py-4 text-left">
                  <span className="text-sm font-semibold">{tab.label}</span>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform ${openAccordions[tab.id] ? 'rotate-180' : ''}`} />
                </button>
                {openAccordions[tab.id] && (
                  <div className="pb-4 animate-fadeIn">
                    {tab.id === 'description' && (product.description ? <p className="text-sm text-gray-600 whitespace-pre-line">{product.description}</p> : <p className="text-sm text-gray-400 italic">No description.</p>)}
                    {tab.id === 'sizeguide' && <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b"><th className="py-2 text-left">Size</th><th className="py-2 text-center">Chest</th><th className="py-2 text-center">Waist</th></tr></thead><tbody>{sizeChartData.default.filter((r) => product.sizes?.includes(r.size)).map((r) => (<tr key={r.size} className="border-b border-gray-100"><td className="py-2 font-medium">{r.size}</td><td className="py-2 text-center">{r.chest}"</td><td className="py-2 text-center">{r.waist}"</td></tr>))}</tbody></table></div>}
                    {tab.id === 'fabric' && <div className="space-y-2 text-sm text-gray-600">{product.fabric && <p>Fabric: {product.fabric}</p>}{product.material && <p>Material: {product.material}</p>}{product.washCare && <p>Care: {product.washCare}</p>}</div>}
                    {tab.id === 'shipping' && <div className="space-y-3 text-sm text-gray-600"><p>Free above ₹499 · 3-7 days</p>{product.returnAvailable && <p>{product.returnPeriod || 7}-day returns · Free exchange</p>}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ===== 11. RETURN & WARRANTY ===== */}
        <section className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-bold mb-4">Return & Warranty</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl flex items-start gap-3">
              <RotateCcw size={20} className="text-[#d4a853] mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{product.returnAvailable ? `${product.returnPeriod || 7}-Day Returns` : 'No Returns'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{product.returnAvailable ? 'Easy return policy' : 'Non-returnable item'}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl flex items-start gap-3">
              <RefreshCcw size={20} className="text-[#d4a853] mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{product.exchangeAvailable ? 'Free Exchange' : 'No Exchange'}</p>
                <p className="text-xs text-gray-500 mt-0.5">Exchange within return period</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl flex items-start gap-3">
              <ShieldAlert size={20} className="text-[#d4a853] mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{product.warrantyPeriod || 'Standard Quality'}</p>
                <p className="text-xs text-gray-500 mt-0.5">Quality assurance</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl flex items-start gap-3">
              <CreditCard size={20} className="text-[#d4a853] mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Secure Refund</p>
                <p className="text-xs text-gray-500 mt-0.5">5-7 business days</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 13. CUSTOMER REVIEWS ===== */}
        <section className="mt-12 border-t border-gray-200 pt-8">
          <ReviewsSection productId={product.id} avgRating={product.avgRating || 0} reviewCount={product.reviewCount || 0} initialReviews={product.reviews || []} />
        </section>

        {/* ===== 14. QUESTIONS & ANSWERS ===== */}
        <section className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageSquare size={20} /> Questions & Answers</h2>
          <div className="max-w-3xl">
            <div className="flex gap-2 mb-6">
              <input type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Ask a question about this product..." className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-black transition-colors" onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()} />
              <Button size="sm" onClick={handleAskQuestion} className="rounded-xl">Ask</Button>
            </div>
            {qaQuestions.length > 0 ? (
              <div className="space-y-4">
                {qaQuestions.map((qa) => (
                  <div key={qa.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <HelpCircle size={16} className="text-[#d4a853] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{qa.q}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Asked by {qa.askedBy}</p>
                      </div>
                    </div>
                    {qa.a && (
                      <div className="flex items-start gap-2 ml-6 mt-3 bg-gray-50 p-3 rounded-lg">
                        <BadgeCheck size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-700">{qa.a}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Answered by {qa.answeredBy}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No questions yet. Be the first to ask!</p>
              </div>
            )}
          </div>
        </section>

        {/* ===== 15. COMPLETE THE LOOK ===== */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-bold mb-2">Complete The Look</h2>
            <p className="text-sm text-gray-500 mb-6">Style this with complementary pieces</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {product.relatedProducts.slice(0, 4).map((p) => (
                <div key={p.id} className="group">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={async () => {
                if (!user) { toast.error('Please login first'); return; }
                try {
                  for (const p of product.relatedProducts!.slice(0, 4)) { await addItem(p.id, 1); }
                  toast.success('All items added to cart!');
                  setShowCartPanel(true);
                  setCartPanelItem({ name: `${product.relatedProducts!.length} items`, price: product.relatedProducts!.reduce((s, p) => s + (p.salePrice || p.basePrice || 0), 0), image: product.images?.[0]?.url || '', quantity: product.relatedProducts!.length });
                } catch { toast.error('Failed to add some items'); }
              }}>
                <ShoppingBasket size={14} className="mr-1" /> Add Entire Outfit to Cart
              </Button>
            </div>
          </section>
        )}

        {/* ===== 16. FREQUENTLY BOUGHT TOGETHER ===== */}
        {product.relatedProducts && product.relatedProducts.length >= 2 && (
          <section className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-bold mb-6">Frequently Bought Together</h2>
            <div className="flex flex-col lg:flex-row items-start gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-20 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={getImageUrl(product.images?.[0]?.url || '')} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <span className="text-gray-300 text-xl">+</span>
                {product.relatedProducts.slice(0, 2).map((p) => (
                  <div key={p.id} className="relative w-20 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={getImageUrl(p.primaryImage || p.images?.[0]?.url || '')} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                ))}
              </div>
              <div className="lg:text-right">
                <p className="text-xs text-gray-500 mb-1">Total price:</p>
                <p className="text-xl font-bold">{formatPrice((product.salePrice || product.basePrice || 0) + product.relatedProducts.slice(0, 2).reduce((s, p) => s + (p.salePrice || p.basePrice || 0), 0))}</p>
                <Button size="sm" className="mt-3 rounded-xl" onClick={async () => {
                  if (!user) { toast.error('Please login first'); return; }
                  await addItem(product.id, 1);
                  for (const p of product.relatedProducts!.slice(0, 2)) { await addItem(p.id, 1); }
                  toast.success('All items added to cart!');
                }}>Add All to Cart</Button>
              </div>
            </div>
          </section>
        )}

        {/* ===== 17. SIMILAR PRODUCTS ===== */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-bold mb-6">Similar Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {product.relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* ===== 18. RECENTLY VIEWED ===== */}
        <section className="mt-12 border-t border-gray-200 pt-8">
          <RecentlyViewed currentSlug={product.slug} />
        </section>

        {/* ===== 19. RECENTLY PURCHASED ===== */}
        <section className="mt-12 border-t border-gray-200 pt-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{Math.floor(Math.random() * 180) + 50} people bought this today</p>
              <p className="text-xs text-gray-500 mt-0.5">Join hundreds of happy customers</p>
            </div>
          </div>
        </section>

        {/* ===== 20. TRUST SECTION ===== */}
        <section className="mt-12 border-t border-gray-200 pt-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: <ShieldCheck size={24} />, text: '100% Genuine', sub: 'Authentic products' },
              { icon: <Truck size={24} />, text: 'Fast Delivery', sub: 'Pan India shipping' },
              { icon: <RotateCcw size={24} />, text: 'Easy Returns', sub: '7-day return policy' },
              { icon: <CreditCard size={24} />, text: 'Secure Payment', sub: 'Razorpay + UPI' },
              { icon: <Headphones size={24} />, text: 'Customer Support', sub: 'We are here to help' },
            ].map((item) => (
              <div key={item.text} className="text-center p-5 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-full flex items-center justify-center text-[#d4a853] shadow-sm">{item.icon}</div>
                <p className="text-sm font-semibold text-gray-900">{item.text}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Spacer for mobile sticky bar */}
        <div className="h-24 md:hidden" />
      </div>

      {/* ===== 21. STICKY MOBILE PURCHASE BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center gap-3 z-40 md:hidden safe-bottom">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-gray-900">{formatPrice(product.salePrice || product.basePrice || 0)}</p>
          {hasDiscount && <p className="text-xs text-[#e94560] font-medium">{discountPercent}% off</p>}
        </div>
        <button onClick={handleWishlist} className="p-3 border border-gray-200 rounded-xl">
          <Heart size={18} fill={wishlisted ? '#e94560' : 'none'} className={wishlisted ? 'text-[#e94560]' : 'text-gray-600'} />
        </button>
        <button onClick={handleAddToCart} disabled={adding} className="flex-1 bg-black text-white py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
          <ShoppingBag size={16} /> Add to Cart
        </button>
        <button onClick={handleBuyNow} disabled={buying} className="flex-1 bg-[#d4a853] text-black py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
          <Zap size={16} /> Buy Now
        </button>
      </div>

      {/* ===== CART SLIDE-IN PANEL ===== */}
      {showCartPanel && cartPanelItem && (
        <div className="fixed inset-0 z-50" onClick={() => setShowCartPanel(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slideInRight" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center"><Check size={14} className="text-green-600" /></div><span className="text-sm font-semibold">Added to Cart</span></div>
              <button onClick={() => setShowCartPanel(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="flex gap-4 px-6 py-5 border-b border-gray-100">
              <div className="relative w-20 h-24 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
                {cartPanelItem.image ? <Image src={getImageUrl(cartPanelItem.image)} alt="" fill sizes="80px" className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={24} /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cartPanelItem.name}</p>
                <p className="text-sm text-gray-500 mt-1">Qty: {cartPanelItem.quantity}</p>
                <p className="text-sm font-bold mt-1">{formatPrice(cartPanelItem.price * cartPanelItem.quantity)}</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-end px-6 py-6 gap-3">
              <button onClick={() => { setShowCartPanel(false); router.push('/cart'); }} className="w-full bg-black text-white py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"><ShoppingBag size={16} /> View Cart</button>
              <button onClick={() => { setShowCartPanel(false); router.push('/checkout'); }} className="w-full bg-[#d4a853] text-black py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"><Zap size={16} /> Checkout</button>
              <button onClick={() => setShowCartPanel(false)} className="w-full text-gray-500 py-2.5 text-sm font-medium">Continue Shopping</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
