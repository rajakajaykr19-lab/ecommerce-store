'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice, validatePincode, getImageUrl } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import type { Product } from '@/types';
import {
  Star, Heart, Share2, ShoppingBag, Truck, ShieldCheck, RotateCcw,
  Minus, Plus, ChevronDown, ChevronRight, MapPin, Loader2, Check,
  Copy, MessageCircle, X, ChevronLeft, Eye, Zap, BadgeCheck, Package,
  ThumbsUp, Camera, Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const sizeData = [
  { size: 'S', chest: '36-38', chestCm: '91-97', waist: '30-32', waistCm: '76-81', length: '26', lengthCm: '66' },
  { size: 'M', chest: '38-40', chestCm: '97-102', waist: '32-34', waistCm: '81-86', length: '27', lengthCm: '69' },
  { size: 'L', chest: '40-42', chestCm: '102-107', waist: '34-36', waistCm: '86-91', length: '28', lengthCm: '71' },
  { size: 'XL', chest: '42-44', chestCm: '107-112', waist: '36-38', waistCm: '91-97', length: '29', lengthCm: '74' },
  { size: 'XXL', chest: '44-46', chestCm: '112-117', waist: '38-40', waistCm: '97-102', length: '30', lengthCm: '76' },
];

function ProductSkeleton() {
  return (
    <div className="container-custom py-8">
      <div className="h-4 w-64 bg-gray-100 rounded mb-6 animate-pulse" />
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-gray-100 rounded animate-pulse" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-20 h-24 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-8 w-3/4 bg-gray-100 rounded animate-pulse" />
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 w-48 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          <div className="flex gap-2">{[...Array(3)].map((_, i) => <div key={i} className="w-12 h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="w-14 h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          <div className="h-14 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-12 w-full bg-gray-100 rounded animate-pulse" />
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
  const [selectedImage, setSelectedImage] = useState(0);
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
  const [showLightbox, setShowLightbox] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Phase 2 states
  const [showCartPanel, setShowCartPanel] = useState(false);
  const [cartPanelItem, setCartPanelItem] = useState<{ name: string; price: number; image: string; quantity: number } | null>(null);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewPagination, setReviewPagination] = useState({ page: 1, totalPages: 1 });
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
  const [expandedReviewImage, setExpandedReviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    setPincodeStatus(null);
    setShowCartPanel(false);
    setShowWriteReview(false);
    setReviewRating(0);
    setReviewTitle('');
    setReviewComment('');
  }, [slug]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShareMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('helpfulVotes');
      if (saved) setHelpfulVotes(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('helpfulVotes', JSON.stringify(helpfulVotes));
    }
  }, [helpfulVotes]);

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

  const fetchAllReviews = async (productId: string, page = 1) => {
    setReviewsLoading(true);
    try {
      const res = await api.getProductReviews(productId, { page: String(page), limit: '10' });
      if (page === 1) {
        setAllReviews(res.data || []);
      } else {
        setAllReviews((prev) => [...prev, ...(res.data || [])]);
      }
      setReviewPagination(res.pagination || { page: 1, totalPages: 1 });
    } catch {
      setAllReviews([]);
    }
    setReviewsLoading(false);
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
      setCartPanelItem({
        name: product!.name,
        price: product!.salePrice || product!.basePrice,
        image: images[0]?.url || '',
        quantity,
      });
      setShowCartPanel(true);
    } catch (err: any) {
      toast.error(err.message);
    }
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!user) { toast.error('Please login first'); return; }
    setBuying(true);
    try {
      await addItem(product!.id, quantity);
      router.push('/checkout');
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

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try { await navigator.share({ title: product?.name, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); toast.success('Link copied to clipboard!'); } catch { toast.error('Failed to copy'); }
    }
    setShowShareMenu(false);
  }, [product?.name]);

  const handleCopyLink = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try { await navigator.clipboard.writeText(url); toast.success('Link copied!'); } catch { toast.error('Failed to copy'); }
    setShowShareMenu(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  const handleSubmitReview = async () => {
    if (!user) { toast.error('Please login first'); return; }
    if (reviewRating === 0) { toast.error('Please select a rating'); return; }
    setReviewSubmitting(true);
    try {
      await api.createReview({
        productId: product!.id,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim() || undefined,
      });
      toast.success('Review submitted successfully!');
      setShowWriteReview(false);
      setReviewRating(0);
      setReviewTitle('');
      setReviewComment('');
      await fetchProduct();
      if (product) fetchAllReviews(product.id, 1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    }
    setReviewSubmitting(false);
  };

  const handleHelpful = (reviewId: string) => {
    if (!user) { toast.error('Please login to mark helpful'); return; }
    setHelpfulVotes((prev) => {
      const newState = { ...prev };
      if (newState[reviewId]) {
        delete newState[reviewId];
      } else {
        newState[reviewId] = true;
      }
      return newState;
    });
  };

  const ratingBreakdown = useMemo(() => {
    const reviews = allReviews.length > 0 ? allReviews : (product?.reviews || []);
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach((r: any) => {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
    });
    return counts;
  }, [allReviews, product?.reviews]);

  const maxRatingCount = Math.max(...ratingBreakdown, 1);

  const attributeValues: { id: string; attributeId: string; value: string; attribute: { id: string; name: string; slug: string; fieldType: string; group?: { id: string; name: string; slug: string } } }[] = (product as any)?.attributeValues || [];
  const specGroups = useMemo(() => {
    const groups: Record<string, typeof attributeValues> = {};
    attributeValues.filter((av) => av.value && av.value.trim() !== '').forEach((av) => {
      const name = av.attribute?.group?.name || 'Details';
      if (!groups[name]) groups[name] = [];
      groups[name].push(av);
    });
    return groups;
  }, [attributeValues]);

  if (loading) return <ProductSkeleton />;

  if (!product) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <Package size={40} className="text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">This product may have been removed or is no longer available.</p>
        <Link href="/shop" className="inline-block bg-black text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [{ id: '0', url: product.primaryImage || '', isPrimary: true, displayOrder: 0 }];
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const discountPercent = product.discountPercent || (hasDiscount ? Math.round(((product.basePrice - product.salePrice!) / product.basePrice) * 100) : 0);

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'sizeguide', label: 'Size Guide' },
    { id: 'fabric', label: 'Fabric & Care' },
    { id: 'shipping', label: 'Shipping & Returns' },
  ];

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: images.map((img) => getImageUrl(img.url)),
            brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
            sku: product.sku,
            offers: {
              '@type': 'Offer',
              priceCurrency: product.currency || 'INR',
              price: product.salePrice || product.basePrice,
              availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
            aggregateRating: product.avgRating ? {
              '@type': 'AggregateRating',
              ratingValue: product.avgRating,
              reviewCount: product.reviewCount || 0,
            } : undefined,
          }),
        }}
      />

      <div className="container-custom py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 overflow-x-auto scrollbar-hide">
          <Link href="/" className="hover:text-gray-700 transition-colors whitespace-nowrap">Home</Link>
          <ChevronRight size={12} className="flex-shrink-0" />
          <Link href={`/shop${product.gender ? `?gender=${product.gender}` : ''}`} className="hover:text-gray-700 transition-colors whitespace-nowrap">{product.gender || 'Shop'}</Link>
          {product.category && (
            <>
              <ChevronRight size={12} className="flex-shrink-0" />
              <Link href={`/shop?categoryId=${product.categoryId}`} className="hover:text-gray-700 transition-colors whitespace-nowrap">{product.category.name}</Link>
            </>
          )}
          <ChevronRight size={12} className="flex-shrink-0" />
          <span className="text-gray-700 font-medium truncate">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* ========== IMAGE GALLERY ========== */}
          <div className="space-y-3">
            {/* Main Image */}
            <div
              ref={imageContainerRef}
              className="relative aspect-[4/5] bg-gray-50 overflow-hidden cursor-zoom-in group"
              onMouseEnter={() => setZooming(true)}
              onMouseLeave={() => { setZooming(false); setZoomPos({ x: 50, y: 50 }); }}
              onMouseMove={handleMouseMove}
              onClick={() => setShowLightbox(true)}
            >
              {images[selectedImage]?.url ? (
                <Image
                  src={getImageUrl(images[selectedImage].url)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={`object-cover transition-transform duration-300 ease-out ${zooming ? 'scale-[2.5]' : 'scale-100'}`}
                  style={zooming ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
                  priority
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                  <Eye size={48} />
                  <span className="text-sm">No Image Available</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <span className="bg-[#e94560] text-white text-xs font-bold px-3 py-1.5">
                    {discountPercent}% OFF
                  </span>
                )}
                {product.isNewArrival && (
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5">
                    NEW
                  </span>
                )}
                {product.isBestSeller && (
                  <span className="bg-[#d4a853] text-black text-xs font-bold px-3 py-1.5">
                    BESTSELLER
                  </span>
                )}
              </div>

              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 backdrop-blur-sm">
                  {selectedImage + 1} / {images.length}
                </div>
              )}

              {/* Zoom hint on desktop */}
              <div className="hidden md:flex absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity gap-1.5 items-center">
                <Eye size={14} /> Hover to zoom
              </div>

              {/* Nav arrows for multiple images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage((prev) => prev > 0 ? prev - 1 : images.length - 1); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage((prev) => prev < images.length - 1 ? prev + 1 : 0); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`relative flex-shrink-0 w-16 h-20 md:w-20 md:h-24 overflow-hidden transition-all duration-200 ${
                      selectedImage === i
                        ? 'ring-2 ring-black ring-offset-2'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={getImageUrl(img.url)} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========== PRODUCT DETAILS ========== */}
          <div className="flex flex-col">
            {/* Category + Badges */}
            <div className="flex items-center gap-2 mb-2">
              {product.category && (
                <span className="text-xs uppercase tracking-widest text-gray-400">{product.category.name}</span>
              )}
              {product.isNewArrival && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 uppercase">New</span>
              )}
              {product.isBestSeller && (
                <span className="text-[10px] font-bold text-[#d4a853] bg-[#d4a853]/10 px-2 py-0.5 uppercase">Bestseller</span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight">{product.name}</h1>

            {/* Brand */}
            {product.brand && (
              <p className="text-sm text-gray-500 mb-3">by <span className="font-medium text-gray-700">{product.brand.name}</span></p>
            )}

            {/* Rating */}
            {product.avgRating !== undefined && product.avgRating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5 bg-green-50 px-2 py-1">
                  <span className="text-sm font-bold text-green-700">{product.avgRating}</span>
                  <Star size={14} className="fill-green-700 text-green-700" />
                </div>
                <span className="text-sm text-gray-500">{product.reviewCount || 0} ratings</span>
              </div>
            )}

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
            <p className="text-xs text-gray-400 mb-5">Inclusive of all taxes. Free shipping above ₹499.</p>

            {/* Divider */}
            <div className="border-t border-gray-100 mb-5" />

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-medium mb-3">Color: <span className="text-gray-500">{selectedColor || 'Select'}</span></h3>
                <div className="flex gap-2.5">
                  {product.colors.map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setSelectedColor(c.color)}
                      className={`w-9 h-9 rounded-full transition-all ${
                        selectedColor === c.color
                          ? 'ring-2 ring-black ring-offset-2 scale-110'
                          : 'ring-1 ring-gray-200 hover:ring-gray-400'
                      }`}
                      style={{ backgroundColor: c.colorHex || c.color }}
                      title={c.color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Size: <span className="text-gray-500">{selectedSize || 'Select'}</span></h3>
                  <button onClick={() => setShowSizeGuide(!showSizeGuide)} className="text-xs text-gray-600 underline underline-offset-2 hover:text-black transition-colors">
                    Size Guide
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
                        className={`min-w-[52px] px-4 py-3 text-sm font-medium border transition-all ${
                          selectedSize === size
                            ? 'bg-black text-white border-black'
                            : isOutOfStock
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through border-gray-200'
                            : 'border-gray-300 hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {/* Size Guide Inline Panel */}
                {showSizeGuide && (
                  <div className="mt-4 border border-gray-200 bg-gray-50 p-4 animate-fadeIn">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold">Size Chart</h4>
                      <button onClick={() => setShowSizeGuide(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="py-2 pr-3 text-left font-semibold">Size</th>
                            <th className="py-2 px-2 text-center font-semibold">Chest (in)</th>
                            <th className="py-2 px-2 text-center font-semibold">Waist (in)</th>
                            <th className="py-2 px-2 text-center font-semibold">Length (in)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sizeData.map((row) => (
                            <tr key={row.size} className="border-b border-gray-100 last:border-0">
                              <td className="py-2 pr-3 font-medium">{row.size}</td>
                              <td className="py-2 px-2 text-center">{row.chest}</td>
                              <td className="py-2 px-2 text-center">{row.waist}</td>
                              <td className="py-2 px-2 text-center">{row.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">Our sizes run true to fit. If between sizes, we recommend sizing up.</p>
                    <Link href="/size-guide" className="text-xs text-black underline mt-1 inline-block">View full size guide</Link>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <h3 className="text-sm font-medium mb-3">Quantity</h3>
              <div className="flex items-center border w-fit">
                <button onClick={() => quantity > 1 && setQuantity(quantity - 1)} className="p-3 hover:bg-gray-50 transition-colors" disabled={quantity <= 1}><Minus size={16} /></button>
                <span className="px-6 text-sm font-medium tabular-nums">{quantity}</span>
                <button onClick={() => quantity < 10 && setQuantity(quantity + 1)} className="p-3 hover:bg-gray-50 transition-colors" disabled={quantity >= 10}><Plus size={16} /></button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex gap-3">
                <Button onClick={handleAddToCart} loading={adding} className="flex-1 flex items-center justify-center gap-2 !py-4 !text-sm font-semibold">
                  <ShoppingBag size={18} /> Add to Cart
                </Button>
                <div className="relative" ref={shareRef}>
                  <Button
                    variant="outline"
                    className="!px-4 flex items-center justify-center"
                    onClick={() => setShowShareMenu(!showShareMenu)}
                  >
                    <Share2 size={18} />
                  </Button>
                  {showShareMenu && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 shadow-xl z-20 py-1 animate-fadeIn">
                      <button onClick={handleShare} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                        <MessageCircle size={16} className="text-green-600" /> Share
                      </button>
                      <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                        <Copy size={16} className="text-gray-500" /> Copy Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="gold" onClick={handleBuyNow} loading={buying} className="w-full flex items-center justify-center gap-2 !py-4 !text-sm font-semibold">
                <Zap size={18} /> Buy Now
              </Button>
              <button
                onClick={handleWishlist}
                className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-medium border transition-all ${
                  wishlisted ? 'border-[#e94560] text-[#e94560] bg-[#e94560]/5' : 'border-gray-300 hover:border-gray-500'
                }`}
              >
                <Heart size={18} fill={wishlisted ? '#e94560' : 'none'} className={wishlisted ? 'scale-110' : ''} />
                {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
              </button>
            </div>

            {/* Delivery Check */}
            <div className="border border-gray-200 p-4 mb-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><MapPin size={16} /> Check Delivery</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter pincode"
                  className="border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black transition-colors flex-1 max-w-[180px]"
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && checkPincode()}
                />
                <Button variant="primary" size="sm" onClick={checkPincode}>Check</Button>
              </div>
              {pincodeStatus && (
                <div className={`mt-3 flex items-start gap-2 text-sm ${pincodeStatus.deliverable ? 'text-green-600' : 'text-red-500'}`}>
                  {pincodeStatus.deliverable ? <Check size={16} className="mt-0.5 flex-shrink-0" /> : <X size={16} className="mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="font-medium">{pincodeStatus.message}</p>
                    {pincodeStatus.deliverable && pincodeStatus.estimatedDays && (
                      <p className="text-xs text-gray-500 mt-0.5">Estimated delivery: {pincodeStatus.estimatedDays}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon: <Check size={16} />, text: '100% Original', sub: 'guarantee' },
                { icon: <Truck size={16} />, text: 'Free Shipping', sub: 'above ₹499' },
                { icon: <RotateCcw size={16} />, text: 'Easy Returns', sub: '7-day policy' },
                { icon: <ShieldCheck size={16} />, text: 'Secure Payment', sub: 'Razorpay + UPI' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 p-3 bg-gray-50">
                  <span className="text-gray-400">{item.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{item.text}</p>
                    <p className="text-[10px] text-gray-400">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Highlights */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5 mb-5">
              <h3 className="text-sm font-semibold mb-2">Highlights</h3>
              {product.fabric && <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1 h-1 rounded-full bg-gray-400" /> Fabric: {product.fabric}</div>}
              {product.material && <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1 h-1 rounded-full bg-gray-400" /> Material: {product.material}</div>}
              {product.washCare && <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1 h-1 rounded-full bg-gray-400" /> Care: {product.washCare}</div>}
              {product.sku && <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1 h-1 rounded-full bg-gray-400" /> SKU: {product.sku}</div>}
            </div>
          </div>
        </div>

        {/* ========== TABS SECTION ========== */}
        <div className="mt-12 border-t border-gray-200">
          <div className="flex gap-0 border-b border-gray-200 overflow-x-auto scrollbar-hide">
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
          <div className="py-8 max-w-3xl">
            {activeTab === 'description' && (
              product.description ? (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No description available for this product.</p>
              )
            )}
            {activeTab === 'sizeguide' && (
              <div>
                <div className="bg-[#d4a853]/5 border border-[#d4a853]/20 p-4 mb-6 flex items-start gap-3">
                  <span className="text-[#d4a853] mt-0.5"><BadgeCheck size={18} /></span>
                  <p className="text-sm text-gray-600"><span className="font-semibold">Our sizes run true to fit.</span> If you are between sizes, we recommend sizing up.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-black text-white">
                        <th className="px-4 py-3 text-left font-semibold">Size</th>
                        <th className="px-4 py-3 text-center font-semibold">Chest (in)<br /><span className="font-normal text-gray-400">cm</span></th>
                        <th className="px-4 py-3 text-center font-semibold">Waist (in)<br /><span className="font-normal text-gray-400">cm</span></th>
                        <th className="px-4 py-3 text-center font-semibold">Length (in)<br /><span className="font-normal text-gray-400">cm</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeData.map((row, i) => (
                        <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-black text-white font-bold text-xs">{row.size}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium">{row.chest}</span>
                            <span className="block text-xs text-gray-400 mt-0.5">{row.chestCm}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium">{row.waist}</span>
                            <span className="block text-xs text-gray-400 mt-0.5">{row.waistCm}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-medium">{row.length}</span>
                            <span className="block text-xs text-gray-400 mt-0.5">{row.lengthCm}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Link href="/size-guide" className="text-xs text-black underline mt-4 inline-block">View full size guide</Link>
              </div>
            )}
            {activeTab === 'fabric' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Fabric & Care Instructions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Fabric', value: product.fabric || 'Cotton Blend' },
                    { label: 'Material', value: product.material || 'Premium Quality' },
                    { label: 'Wash Care', value: product.washCare || 'Machine wash cold, Do not bleach, Iron on low heat' },
                    { label: 'Origin', value: 'Made in India' },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-3">
                      <span className="text-xs font-medium text-gray-400 w-20 flex-shrink-0 uppercase tracking-wider">{item.label}</span>
                      <span className="text-sm text-gray-700">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Care Instructions</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Machine wash cold with similar colors</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Do not bleach or tumble dry</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Iron on low heat if needed</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Wash inside out to preserve color and print</li>
                  </ul>
                </div>
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="space-y-6 text-sm text-gray-600">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Shipping</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Free shipping on orders above ₹499</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Standard delivery: 3-7 business days</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Express delivery available (₹199)</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Delivery timeline may vary by location</li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-2">Returns & Exchanges</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> 7-day return policy from date of delivery</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Items must be unworn with original tags</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Free pickup for returns and exchanges</li>
                    <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-400" /> Refund processed within 5-7 business days</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========== SPECIFICATIONS ========== */}
        {Object.keys(specGroups).length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-bold mb-6">Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              {Object.entries(specGroups).map(([groupName, attrs]) => (
                <div key={groupName} className="border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 px-4 py-3 bg-gray-50 border-b border-gray-200">{groupName}</h3>
                  <div>
                    {attrs.map((av, i) => (
                      <div key={av.id} className={`flex justify-between text-sm px-4 py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${i < attrs.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <span className="text-gray-500">{av.attribute.name}</span>
                        <span className="text-gray-900 font-medium">{av.attribute.fieldType === 'boolean' ? (av.value === 'true' ? 'Yes' : 'No') : av.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== REVIEWS SECTION (Phase 2 Enhanced) ========== */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Customer Reviews</h2>
            {user && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setShowWriteReview(!showWriteReview)}
              >
                <Send size={14} />
                Write a Review
              </Button>
            )}
          </div>

          {/* Write Review Form (Phase 2) */}
          {showWriteReview && (
            <div className="border border-gray-200 bg-gray-50 p-6 mb-8 animate-fadeIn max-w-2xl">
              <h3 className="text-sm font-semibold mb-4">Write Your Review</h3>

              {/* Star Rating Selector */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 mb-2 block">Your Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={`transition-colors ${
                          star <= reviewRating
                            ? 'fill-[#d4a853] text-[#d4a853]'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className="ml-2 text-sm text-gray-500 self-center">
                      {reviewRating === 1 ? 'Poor' : reviewRating === 2 ? 'Fair' : reviewRating === 3 ? 'Good' : reviewRating === 4 ? 'Very Good' : 'Excellent'}
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 mb-2 block">Review Title <span className="text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value.slice(0, 200))}
                  placeholder="Summarize your experience"
                  className="w-full border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black transition-colors bg-white"
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">{reviewTitle.length}/200</p>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 mb-2 block">Your Review <span className="text-gray-400">(optional)</span></label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value.slice(0, 2000))}
                  placeholder="Tell others about your experience with this product..."
                  rows={4}
                  className="w-full border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black transition-colors bg-white resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">{reviewComment.length}/2000</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitReview}
                  loading={reviewSubmitting}
                  className="flex items-center gap-2 !py-2.5 !text-sm"
                >
                  <Send size={14} /> Submit Review
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowWriteReview(false); setReviewRating(0); setReviewTitle(''); setReviewComment(''); }}
                  className="!py-2.5 !text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Reviews Content */}
          <div className="grid md:grid-cols-[220px_1fr] gap-8 max-w-4xl">
            {/* Rating Summary + Breakdown */}
            <div>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-900 mb-2">{product.avgRating || '0.0'}</div>
                <div className="flex items-center justify-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={18} className={star <= Math.round(product.avgRating || 0) ? 'fill-[#d4a853] text-[#d4a853]' : 'text-gray-200'} />
                  ))}
                </div>
                <p className="text-sm text-gray-500">{product.reviewCount || 0} ratings</p>
              </div>

              {/* Rating Breakdown Bar Chart (Phase 2) */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingBreakdown[star - 1];
                  const pct = maxRatingCount > 0 ? (count / maxRatingCount) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-3 text-right">{star}</span>
                      <Star size={12} className="fill-[#d4a853] text-[#d4a853] flex-shrink-0" />
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#d4a853] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review List */}
            <div className="space-y-6">
              {(allReviews.length > 0 ? allReviews : (product.reviews || [])).slice(0, allReviews.length > 0 ? undefined : 5).map((review) => {
                const reviewImages = review.images
                  ? (typeof review.images === 'string' ? (review.images as string).split(',').filter(Boolean) : review.images)
                  : [];
                return (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {review.user.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{review.user.name}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={12} className={star <= review.rating ? 'fill-[#d4a853] text-[#d4a853]' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      {review.isVerified && (
                        <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 ml-auto flex items-center gap-1">
                          <BadgeCheck size={12} /> Verified
                        </span>
                      )}
                    </div>

                    {review.title && <p className="text-sm font-semibold mb-1">{review.title}</p>}
                    {review.comment && <p className="text-sm text-gray-600 leading-relaxed mb-2">{review.comment}</p>}

                    {/* Review Images (Phase 2) */}
                    {reviewImages.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {reviewImages.map((imgUrl: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setExpandedReviewImage(imgUrl.trim())}
                            className="relative w-16 h-16 overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors"
                          >
                            <Image src={getImageUrl(imgUrl.trim())} alt="" fill sizes="64px" className="object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Helpful Button (Phase 2) */}
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => handleHelpful(review.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          helpfulVotes[review.id]
                            ? 'text-[#d4a853] font-medium'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <ThumbsUp size={14} fill={helpfulVotes[review.id] ? '#d4a853' : 'none'} />
                        Helpful {helpfulVotes[review.id] ? '· Thanks!' : ''}
                      </button>
                      <span className="text-[10px] text-gray-300">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Load More Reviews */}
              {allReviews.length > 0 && reviewPagination.page < reviewPagination.totalPages && (
                <button
                  onClick={() => fetchAllReviews(product.id, reviewPagination.page + 1)}
                  disabled={reviewsLoading}
                  className="text-sm text-gray-600 underline underline-offset-2 hover:text-black transition-colors flex items-center gap-2"
                >
                  {reviewsLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Load More Reviews
                </button>
              )}

              {/* Fetch All Reviews on First Render */}
              {!reviewsLoading && allReviews.length === 0 && (product.reviewCount || 0) > 0 && (
                <button
                  onClick={() => fetchAllReviews(product.id, 1)}
                  className="text-sm text-gray-600 underline underline-offset-2 hover:text-black transition-colors flex items-center gap-2"
                >
                  View All {product.reviewCount} Reviews
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========== RELATED PRODUCTS ========== */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-16 border-t border-gray-200 pt-12">
            <h2 className="text-lg font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {product.relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========== MOBILE STICKY BUY BAR ========== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center gap-3 z-40 md:hidden safe-bottom">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-gray-900">{formatPrice(product.salePrice || product.basePrice || 0)}</p>
          {hasDiscount && <p className="text-xs text-[#e94560] font-medium">{discountPercent}% off</p>}
        </div>
        <button onClick={handleAddToCart} disabled={adding} className="flex-1 bg-black text-white py-3 text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
          <ShoppingBag size={16} /> Add to Cart
        </button>
        <button onClick={handleBuyNow} disabled={buying} className="flex-1 bg-[#d4a853] text-black py-3 text-sm font-semibold hover:bg-[#c49a3f] transition-colors flex items-center justify-center gap-2">
          <Zap size={16} /> Buy Now
        </button>
      </div>

      {/* Bottom spacer for mobile sticky bar */}
      <div className="h-20 md:hidden" />

      {/* ========== CART SLIDE-IN PANEL (Phase 2) ========== */}
      {showCartPanel && cartPanelItem && (
        <div className="fixed inset-0 z-50" onClick={() => setShowCartPanel(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Check size={14} className="text-green-600" />
                </div>
                <span className="text-sm font-semibold">Added to Cart</span>
              </div>
              <button onClick={() => setShowCartPanel(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Item */}
            <div className="flex gap-4 px-6 py-5 border-b border-gray-100">
              <div className="relative w-20 h-24 flex-shrink-0 bg-gray-50 overflow-hidden">
                {cartPanelItem.image ? (
                  <Image src={getImageUrl(cartPanelItem.image)} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{cartPanelItem.name}</p>
                <p className="text-sm text-gray-500 mt-1">Qty: {cartPanelItem.quantity}</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(cartPanelItem.price * cartPanelItem.quantity)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-1 flex flex-col justify-end px-6 py-6 gap-3">
              <button
                onClick={() => { setShowCartPanel(false); router.push('/cart'); }}
                className="w-full bg-black text-white py-3.5 text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} /> View Cart
              </button>
              <button
                onClick={() => { setShowCartPanel(false); router.push('/checkout'); }}
                className="w-full bg-[#d4a853] text-black py-3.5 text-sm font-semibold hover:bg-[#c49a3f] transition-colors flex items-center justify-center gap-2"
              >
                <Zap size={16} /> Checkout
              </button>
              <button
                onClick={() => setShowCartPanel(false)}
                className="w-full text-gray-500 py-2.5 text-sm font-medium hover:text-gray-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== LIGHTBOX ========== */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col" onClick={() => setShowLightbox(false)}>
          <div className="flex items-center justify-between p-4">
            <span className="text-white/70 text-sm">{selectedImage + 1} / {images.length}</span>
            <button onClick={() => setShowLightbox(false)} className="text-white/70 hover:text-white transition-colors">
              <X size={28} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            {images[selectedImage]?.url && (
              <Image
                src={getImageUrl(images[selectedImage].url)}
                alt={product.name}
                fill
                sizes="100vw"
                className="object-contain p-8"
                priority
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-3 pb-6">
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage((prev) => prev > 0 ? prev - 1 : images.length - 1); }}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }}
                    className={`w-2 h-2 rounded-full transition-all ${selectedImage === i ? 'bg-white w-6' : 'bg-white/40'}`}
                  />
                ))}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage((prev) => prev < images.length - 1 ? prev + 1 : 0); }}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== EXPANDED REVIEW IMAGE LIGHTBOX (Phase 2) ========== */}
      {expandedReviewImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedReviewImage(null)}
        >
          <button
            onClick={() => setExpandedReviewImage(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X size={28} />
          </button>
          <div className="relative w-full max-w-2xl aspect-square" onClick={(e) => e.stopPropagation()}>
            <Image
              src={getImageUrl(expandedReviewImage)}
              alt="Review image"
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
