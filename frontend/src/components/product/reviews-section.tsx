'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Star, BadgeCheck, ThumbsUp, Send, ChevronDown, Filter, ArrowUpDown, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Review } from '@/types';

interface ReviewsSectionProps {
  productId: string;
  avgRating: number;
  reviewCount: number;
  initialReviews?: Review[];
}

export function ReviewsSection({ productId, avgRating, reviewCount, initialReviews = [] }: ReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showSort, setShowSort] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('helpfulVotes');
    if (saved) setHelpful(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('helpfulVotes', JSON.stringify(helpful));
  }, [helpful]);

  useEffect(() => {
    fetchReviews(1);
  }, [productId]);

  const fetchReviews = async (page: number) => {
    setLoading(true);
    try {
      const res = await api.getProductReviews(productId, { page: String(page), limit: '10' });
      if (page === 1) setReviews(res.data || []);
      else setReviews((prev) => [...prev, ...(res.data || [])]);
      setPagination(res.pagination || { page: 1, totalPages: 1 });
    } catch { /* empty */ }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Please login first'); return; }
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      await api.createReview({ productId, rating, title: title.trim() || undefined, comment: comment.trim() || undefined });
      toast.success('Review submitted!');
      setShowForm(false); setRating(0); setTitle(''); setComment('');
      fetchReviews(1);
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    setSubmitting(false);
  };

  const toggleHelpful = (id: string) => {
    if (!user) { toast.error('Login to mark helpful'); return; }
    setHelpful((prev) => {
      const n = { ...prev };
      if (n[id]) delete n[id]; else n[id] = true;
      return n;
    });
  };

  const breakdown = [0, 0, 0, 0, 0];
  const src = reviews.length > 0 ? reviews : initialReviews;
  src.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating - 1]++; });
  const maxCount = Math.max(...breakdown, 1);

  const filtered = filterRating ? reviews.filter((r) => r.rating === filterRating) : reviews;
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Customer Reviews</h2>
        {user && (
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
            <Send size={14} /> Write a Review
          </Button>
        )}
      </div>

      {/* Write Review Form */}
      {showForm && (
        <div className="border border-gray-200 bg-gray-50 rounded-xl p-6 mb-8 animate-fadeIn max-w-2xl">
          <h3 className="text-sm font-semibold mb-4">Your Review</h3>
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="p-0.5 transition-transform hover:scale-110">
                  <Star size={28} className={s <= rating ? 'fill-[#d4a853] text-[#d4a853]' : 'text-gray-300 hover:text-gray-400'} />
                </button>
              ))}
              {rating > 0 && <span className="ml-2 text-sm text-gray-500 self-center">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</span>}
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 mb-2 block">Title (optional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 200))} placeholder="Summarize your experience" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-colors bg-white" />
          </div>
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 mb-2 block">Review (optional)</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, 2000))} rows={4} placeholder="Tell others about your experience..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-colors bg-white resize-none" />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{comment.length}/2000</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSubmit} loading={submitting} className="flex items-center gap-2 !py-2.5 !text-sm"><Send size={14} /> Submit</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setRating(0); setTitle(''); setComment(''); }} className="!py-2.5 !text-sm">Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[220px_1fr] gap-8 max-w-5xl">
        {/* Rating Summary + Breakdown */}
        <div>
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-gray-900 mb-2">{avgRating || '0.0'}</div>
            <div className="flex items-center justify-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={18} className={s <= Math.round(avgRating || 0) ? 'fill-[#d4a853] text-[#d4a853]' : 'text-gray-200'} />
              ))}
            </div>
            <p className="text-sm text-gray-500">{reviewCount || 0} ratings</p>
          </div>

          {/* Bar chart */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = breakdown[star - 1];
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <button
                  key={star}
                  onClick={() => setFilterRating(filterRating === star ? null : star)}
                  className={`flex items-center gap-2 w-full group transition-opacity ${filterRating && filterRating !== star ? 'opacity-40' : ''}`}
                >
                  <span className="text-xs text-gray-500 w-3 text-right">{star}</span>
                  <Star size={12} className="fill-[#d4a853] text-[#d4a853] flex-shrink-0" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#d4a853] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
                </button>
              );
            })}
          </div>
          {filterRating && (
            <button onClick={() => setFilterRating(null)} className="mt-2 text-xs text-[#d4a853] underline flex items-center gap-1">
              <X size={12} /> Clear filter
            </button>
          )}
        </div>

        {/* Review List */}
        <div>
          {/* Sort + Filter bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <span className="text-sm text-gray-500">{filtered.length} review{filtered.length !== 1 ? 's' : ''}</span>
            <div className="relative">
              <button onClick={() => setShowSort(!showSort)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-black transition-colors">
                <ArrowUpDown size={14} /> Sort: <span className="font-medium">{sortBy === 'newest' ? 'Newest' : sortBy === 'highest' ? 'Highest' : 'Lowest'}</span>
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-xl z-20 py-1 rounded-lg min-w-[120px] animate-fadeIn">
                  {[
                    { key: 'newest', label: 'Newest' },
                    { key: 'highest', label: 'Highest Rated' },
                    { key: 'lowest', label: 'Lowest Rated' },
                  ].map((opt) => (
                    <button key={opt.key} onClick={() => { setSortBy(opt.key); setShowSort(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${sortBy === opt.key ? 'font-medium text-black' : 'text-gray-600'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {sorted.map((review) => {
              const imgs = review.images
                ? (typeof review.images === 'string' ? (review.images as string).split(',').filter(Boolean) : review.images)
                : [];
              return (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">{review.user.name[0].toUpperCase()}</div>
                    <div>
                      <p className="text-sm font-medium">{review.user.name}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} className={s <= review.rating ? 'fill-[#d4a853] text-[#d4a853]' : 'text-gray-200'} />
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
                  {imgs.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {imgs.map((url: string, idx: number) => (
                        <button key={idx} onClick={() => setExpandedImage(url.trim())} className="relative w-16 h-16 overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors rounded-lg">
                          <Image src={getImageUrl(url.trim())} alt="" fill sizes="64px" className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <button onClick={() => toggleHelpful(review.id)} className={`flex items-center gap-1.5 text-xs transition-colors ${helpful[review.id] ? 'text-[#d4a853] font-medium' : 'text-gray-400 hover:text-gray-600'}`}>
                      <ThumbsUp size={14} fill={helpful[review.id] ? '#d4a853' : 'none'} />
                      Helpful {helpful[review.id] ? '· Thanks!' : ''}
                    </button>
                    <span className="text-[10px] text-gray-300">{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {loading && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-400" /></div>}
          {!loading && pagination.page < pagination.totalPages && (
            <button onClick={() => fetchReviews(pagination.page + 1)} className="mt-4 text-sm text-gray-600 underline underline-offset-2 hover:text-black">Load More Reviews</button>
          )}
        </div>
      </div>

      {/* Expanded Review Image */}
      {expandedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setExpandedImage(null)}>
          <button onClick={() => setExpandedImage(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={28} /></button>
          <div className="relative w-full max-w-2xl aspect-square" onClick={(e) => e.stopPropagation()}>
            <Image src={getImageUrl(expandedImage)} alt="Review" fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
