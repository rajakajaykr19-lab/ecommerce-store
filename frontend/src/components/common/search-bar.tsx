'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice, getImageUrl } from '@/lib/utils';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string; name: string; slug: string; price: number;
  salePrice?: number; image: string | null; category: string;
}

export function SearchBar({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchProducts(query);
        setResults(res.data || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="absolute top-0 left-0 w-full bg-white border-b shadow-lg z-50 animate-fadeIn">
      <div className="container-custom py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands, categories..."
            className="w-full pl-12 pr-12 py-4 text-lg border-0 outline-none bg-gray-50 focus:bg-white transition-colors"
          />
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {query.length >= 2 && (
          <div className="mt-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-gray-400" size={24} />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {item.image && <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold">{formatPrice(item.salePrice || item.price)}</span>
                        {item.salePrice && (
                          <span className="text-xs text-gray-400 line-through">{formatPrice(item.price)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">No products found for &ldquo;{query}&rdquo;</p>
            )}
          </div>
        )}

        {query.length < 2 && query.length > 0 && (
          <p className="text-center py-4 text-gray-400 text-sm">Type at least 2 characters to search</p>
        )}
      </div>
    </div>
  );
}
