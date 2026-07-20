'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate, getImageUrl } from '@/lib/utils';
import type { BlogPost } from '@/types';
import { Calendar, User, ArrowRight, Loader2 } from 'lucide-react';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBlogPosts().then((res) => setPosts(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="bg-[#1a1a2e] text-white py-16 md:py-24">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Blog</h1>
          <p className="text-lg text-gray-300">Style tips, trends, and stories from our fashion experts</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          {loading ? (
            <div className="flex justify-center"><Loader2 className="animate-spin" size={32} /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No blog posts yet. Stay tuned!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group card rounded-none overflow-hidden">
                  <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                    {post.coverImage ? (
                      <img src={getImageUrl(post.coverImage)} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      {post.author && <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>}
                      <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(post.publishedAt || post.createdAt)}</span>
                    </div>
                    <h2 className="text-lg font-bold mb-2 group-hover:text-gray-600 transition-colors line-clamp-2">{post.title}</h2>
                    {post.excerpt && <p className="text-sm text-gray-500 line-clamp-3 mb-4">{post.excerpt}</p>}
                    <span className="text-sm font-medium text-[#1a1a2e] group-hover:underline flex items-center gap-1">
                      Read More <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
