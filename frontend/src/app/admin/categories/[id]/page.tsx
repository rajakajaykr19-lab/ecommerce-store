'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Category } from '@/types';
import toast from 'react-hot-toast';
import {
  ChevronRight, Save, Eye, EyeOff, Image, Globe, Settings,
  BarChart3, Tag, FolderTree, Layout, Type, Link as LinkIcon,
  Monitor, Smartphone, Star, TrendingUp, Search, ShoppingCart,
  Package, DollarSign, ChevronDown, ArrowLeft, Loader2,
} from 'lucide-react';

type FormData = {
  name: string;
  slug: string;
  description: string;
  image: string;
  gender: string;
  parentId: string;
  displayOrder: number;
  metaTitle: string;
  metaDescription: string;
  status: 'draft' | 'published' | 'hidden' | 'archived';
  desktopBanner: string;
  mobileBanner: string;
  iconUrl: string;
};

export default function AdminCategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = !params.id || params.id === 'new';
  const categoryId = params.id as string;

  const [form, setForm] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    image: '',
    gender: '',
    parentId: '',
    displayOrder: 0,
    metaTitle: '',
    metaDescription: '',
    status: 'published',
    desktopBanner: '',
    mobileBanner: '',
    iconUrl: '',
  });

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'status' | 'visibility' | 'preview'>('status');

  useEffect(() => {
    loadCategories();
    if (!isNew && categoryId) loadCategory();
  }, [categoryId]);

  const loadCategories = async () => {
    try {
      const res = await api.getAllCategoriesFlat();
      setAllCategories(res.data || []);
    } catch { /* ignore */ }
  };

  const loadCategory = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminCategory(categoryId);
      setCategoryData(data);
      setForm({
        name: data.name || '',
        slug: data.slug || '',
        description: data.description || '',
        image: data.image || '',
        gender: data.gender || '',
        parentId: data.parentId || '',
        displayOrder: data.displayOrder || 0,
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || '',
        status: data.isActive ? 'published' : 'hidden',
        desktopBanner: '',
        mobileBanner: '',
        iconUrl: '',
      });
    } catch {
      toast.error('Category not found');
      router.push('/admin/categories');
    }
    setLoading(false);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const updateField = (field: keyof FormData, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !slugEdited) {
        next.slug = generateSlug(value);
      }
      return next;
    });
  };

  const handleSlugChange = (val: string) => {
    setSlugEdited(true);
    setForm(prev => ({ ...prev, slug: val }));
  };

  const save = async (statusOverride?: string) => {
    if (!form.name.trim()) { toast.error('Category name is required'); return; }

    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        image: form.image || undefined,
        gender: form.gender || undefined,
        parentId: form.parentId || null,
        displayOrder: form.displayOrder,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        status: statusOverride || form.status,
      };

      if (isNew) {
        const res = await api.createCategory(payload);
        toast.success('Category created');
        router.push('/admin/categories');
      } else {
        await api.updateCategory(categoryId, payload);
        toast.success('Category updated');
      }
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    }
    setSaving(false);
  };

  const parentOptions = allCategories
    .filter(c => !c.parentId && c.id !== categoryId)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    published: 'bg-green-100 text-green-700 border-green-200',
    hidden: 'bg-gray-100 text-gray-600 border-gray-200',
    archived: 'bg-red-100 text-red-700 border-red-200',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/admin" className="hover:text-gray-700">Dashboard</Link>
          <ChevronRight size={14} />
          <Link href="/admin/categories" className="hover:text-gray-700">Categories</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">{isNew ? 'New Category' : 'Edit Category'}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'Create Category' : `Edit: ${form.name}`}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{isNew ? 'Add a new category to your catalog' : `Last updated ${categoryData?.updatedAt ? new Date(categoryData.updatedAt).toLocaleDateString() : 'unknown'}`}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN - Main Content */}
          <div className="flex-1 space-y-6 min-w-0">

            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Type size={16} className="text-gray-400" /> Basic Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => updateField('name', e.target.value)}
                    placeholder="e.g. Men Shirts"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">/</span>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={e => handleSlugChange(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => updateField('description', e.target.value)}
                    rows={3}
                    placeholder="Brief description for this category..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Category</label>
                    <select
                      value={form.parentId}
                      onChange={e => updateField('parentId', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-gray-900/10"
                    >
                      <option value="">None (Top Level)</option>
                      {parentOptions.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                    <select
                      value={form.gender}
                      onChange={e => updateField('gender', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-gray-900/10"
                    >
                      <option value="">All</option>
                      <option value="MEN">Men</option>
                      <option value="WOMEN">Women</option>
                      <option value="KIDS">Kids</option>
                      <option value="ACCESSORIES">Accessories</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Order</label>
                    <input
                      type="number"
                      value={form.displayOrder}
                      onChange={e => updateField('displayOrder', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Image size={16} className="text-gray-400" /> Images
                </h2>
                <p className="text-xs text-gray-400 mt-1">Enter image URLs for category visuals</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Thumbnail URL</label>
                  <input
                    type="url"
                    value={form.image}
                    onChange={e => updateField('image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900/10"
                  />
                  {form.image && (
                    <div className="mt-2 w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                      <img src={form.image} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Icon URL</label>
                  <input
                    type="url"
                    value={form.iconUrl}
                    onChange={e => updateField('iconUrl', e.target.value)}
                    placeholder="https://example.com/icon.png"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Desktop Banner URL</label>
                    <input
                      type="url"
                      value={form.desktopBanner}
                      onChange={e => updateField('desktopBanner', e.target.value)}
                      placeholder="https://example.com/banner-desktop.jpg"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900/10"
                    />
                    {form.desktopBanner && (
                      <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 aspect-video">
                        <img src={form.desktopBanner} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Banner URL</label>
                    <input
                      type="url"
                      value={form.mobileBanner}
                      onChange={e => updateField('mobileBanner', e.target.value)}
                      placeholder="https://example.com/banner-mobile.jpg"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900/10"
                    />
                    {form.mobileBanner && (
                      <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 aspect-[9/16] max-h-32">
                        <img src={form.mobileBanner} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Globe size={16} className="text-gray-400" /> SEO Settings
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO Title</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.metaTitle}
                      onChange={e => updateField('metaTitle', e.target.value)}
                      placeholder="Title for search engines"
                      maxLength={70}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900/10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{form.metaTitle.length}/70</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description</label>
                  <div className="relative">
                    <textarea
                      value={form.metaDescription}
                      onChange={e => updateField('metaDescription', e.target.value)}
                      rows={2}
                      maxLength={160}
                      placeholder="Description for search engines"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900/10 resize-none"
                    />
                    <span className="absolute right-3 bottom-3 text-xs text-gray-400">{form.metaDescription.length}/160</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics (Edit Only) */}
            {!isNew && categoryData?.analytics && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 size={16} className="text-gray-400" /> Analytics
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Package size={18} className="mx-auto text-gray-400 mb-1" />
                    <p className="text-xl font-bold">{categoryData.analytics.totalProducts}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <ShoppingCart size={18} className="mx-auto text-gray-400 mb-1" />
                    <p className="text-xl font-bold">{categoryData.analytics.totalOrders}</p>
                    <p className="text-xs text-gray-500">Orders</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <DollarSign size={18} className="mx-auto text-gray-400 mb-1" />
                    <p className="text-xl font-bold">₹{(categoryData.analytics.totalRevenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-80 space-y-6 flex-shrink-0">
            {/* Status */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Settings size={14} className="text-gray-400" /> Status
                </h3>
              </div>
              <div className="p-5 space-y-2">
                {(['draft', 'published', 'hidden', 'archived'] as const).map(s => (
                  <label key={s} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.status === s ? statusColors[s] + ' border-2' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={() => updateField('status', s)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.status === s ? 'border-current' : 'border-gray-300'}`}>
                      {form.status === s && <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <span className="text-sm font-medium capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Eye size={14} className="text-gray-400" /> Preview
                </h3>
              </div>
              <div className="p-5">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {form.image ? (
                      <img src={form.image} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <FolderTree size={24} className="text-gray-300" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{form.name || 'Category Name'}</p>
                    <p className="text-xs text-gray-400 truncate">/{form.slug || 'category-slug'}</p>
                    {form.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{form.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Children (Edit Only) */}
            {!isNew && categoryData?.children && categoryData.children.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FolderTree size={14} className="text-gray-400" /> Subcategories ({categoryData.children.length})
                  </h3>
                </div>
                <div className="p-5 space-y-1">
                  {categoryData.children.map(child => (
                    <Link
                      key={child.id}
                      href={`/admin/categories/${child.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {child.image ? (
                          <img src={child.image} alt="" className="w-full h-full rounded object-cover" />
                        ) : (
                          <FolderTree size={10} className="text-gray-400" />
                        )}
                      </div>
                      <span className="truncate flex-1">{child.name}</span>
                      <span className="text-xs text-gray-400">{child._count?.products || 0}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3 sticky top-8">
              <button
                onClick={() => save()}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isNew ? 'Create Category' : 'Save Changes'}
              </button>

              {!isNew && (
                <div className="flex gap-2">
                  <button
                    onClick={() => save('draft')}
                    disabled={saving}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => save('published')}
                    disabled={saving}
                    className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                  >
                    Publish
                  </button>
                </div>
              )}

              <Link href="/admin/categories" className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-2">
                Back to Categories
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
