'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { Eye, ChevronLeft, ChevronRight, X, Play } from 'lucide-react';
import type { ProductImage } from '@/types';

interface ProductGalleryProps {
  images: ProductImage[];
  videos?: string[];
  productName: string;
  badges?: { label: string; color: string }[];
}

export function ProductGallery({ images, videos = [], productName, badges = [] }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const allMedia = [
    ...images.map((img) => ({ type: 'image' as const, url: img.url, alt: img.alt || productName })),
    ...videos.map((v) => ({ type: 'video' as const, url: v, alt: 'Product Video' })),
  ];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  const handleCarouselScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    setSelected(Math.round(scrollLeft / clientWidth));
  }, []);

  const prev = () => setSelected((p) => (p > 0 ? p - 1 : allMedia.length - 1));
  const next = () => setSelected((p) => (p < allMedia.length - 1 ? p + 1 : 0));

  const current = allMedia[selected];

  return (
    <>
      {/* Mobile: Scroll-snap Carousel */}
      <div className="md:hidden relative">
        <div
          ref={carouselRef}
          className="w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          onScroll={handleCarouselScroll}
        >
          {allMedia.map((item, i) => (
            <div
              key={i}
              className="relative w-full flex-shrink-0 aspect-[4/5] snap-center bg-gray-50 overflow-hidden"
              onClick={() => setLightbox(true)}
            >
              {item.type === 'image' ? (
                <Image src={getImageUrl(item.url)} alt={item.alt} fill sizes="100vw" className="object-cover" priority={i === 0} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <Play size={28} className="text-white ml-1" fill="white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Dots */}
        {allMedia.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {allMedia.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  carouselRef.current?.scrollTo({ left: carouselRef.current.clientWidth * i, behavior: 'smooth' });
                  setSelected(i);
                }}
                className={`h-1.5 rounded-full transition-all ${selected === i ? 'w-5 bg-black' : 'w-1.5 bg-gray-300'}`}
              />
            ))}
          </div>
        )}
        {/* Mobile badges */}
        {badges.length > 0 && (
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
            {badges.map((b) => (
              <span key={b.label} className="text-white text-xs font-bold px-3 py-1.5" style={{ backgroundColor: b.color }}>{b.label}</span>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Main Image + Thumbnails */}
      <div className="hidden md:block space-y-3">
        <div
          ref={imageContainerRef}
          className="relative aspect-[4/5] bg-gray-50 overflow-hidden cursor-zoom-in group"
          onMouseEnter={() => setZooming(true)}
          onMouseLeave={() => { setZooming(false); setZoomPos({ x: 50, y: 50 }); }}
          onMouseMove={handleMouseMove}
          onClick={() => setLightbox(true)}
        >
          {current?.type === 'image' ? (
            <Image
              src={getImageUrl(current.url)}
              alt={current.alt}
              fill
              sizes="50vw"
              className={`object-cover transition-transform duration-300 ease-out ${zooming ? 'scale-[2.5]' : 'scale-100'}`}
              style={zooming ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
              priority
            />
          ) : current?.type === 'video' ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <Play size={32} className="text-white ml-1" fill="white" />
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
              <Eye size={48} />
              <span className="text-sm">No Image Available</span>
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              {badges.map((b) => (
                <span key={b.label} className="text-white text-xs font-bold px-3 py-1.5" style={{ backgroundColor: b.color }}>{b.label}</span>
              ))}
            </div>
          )}

          {/* Counter */}
          {allMedia.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 backdrop-blur-sm">
              {selected + 1} / {allMedia.length}
            </div>
          )}

          {/* Zoom hint */}
          {current?.type === 'image' && (
            <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity gap-1.5 items-center flex">
              <Eye size={14} /> Hover to zoom
            </div>
          )}

          {/* Nav arrows */}
          {allMedia.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100">
                <ChevronLeft size={20} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100">
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {allMedia.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {allMedia.map((item, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`relative flex-shrink-0 w-20 h-24 overflow-hidden transition-all duration-200 ${
                  selected === i ? 'ring-2 ring-black ring-offset-2' : 'opacity-60 hover:opacity-100'
                }`}
              >
                {item.type === 'image' ? (
                  <Image src={getImageUrl(item.url)} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <Play size={16} className="text-white" fill="white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col" onClick={() => setLightbox(false)}>
          <div className="flex items-center justify-between p-4">
            <span className="text-white/70 text-sm">{selected + 1} / {allMedia.length}</span>
            <button onClick={() => setLightbox(false)} className="text-white/70 hover:text-white"><X size={28} /></button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            {current?.type === 'image' ? (
              <Image src={getImageUrl(current.url)} alt={current.alt} fill sizes="100vw" className="object-contain p-8" priority />
            ) : (
              <div className="w-full max-w-2xl aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
                <Play size={48} className="text-white" fill="white" />
              </div>
            )}
          </div>
          {allMedia.length > 1 && (
            <div className="flex items-center justify-center gap-3 pb-6">
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
                <ChevronLeft size={24} />
              </button>
              <div className="flex gap-1.5">
                {allMedia.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setSelected(i); }} className={`w-2 h-2 rounded-full transition-all ${selected === i ? 'bg-white w-6' : 'bg-white/40'}`} />
                ))}
              </div>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
