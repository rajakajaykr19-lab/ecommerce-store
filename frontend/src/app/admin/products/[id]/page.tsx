'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminEditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '', description: '', slug: '', sku: '', hsnCode: '',
    basePrice: '', salePrice: '', costPrice: '',
    stock: '', lowStockThreshold: '10', lockedStock: '0', lockExpiry: '',
    gstRate: '18', categoryId: '', brandId: '',
    fabric: '', material: '', washCare: '',
    isActive: true, isFeatured: false, isNewArrival: false, isBestSeller: false, isTrending: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productRes, catRes, brandRes] = await Promise.all([
          api.getAdminProducts({ search: id }).catch(() => null),
          api.getAdminCategories().catch(() => ({ data: [] })),
          api.getAdminBrands().catch(() => ({ data: [] })),
        ]);
        setCategories((catRes as any)?.data || []);
        setBrands((brandRes as any)?.data || []);

        let product = null;
        if (productRes?.data) {
          product = productRes.data.find((p: any) => p.id === id) || productRes.data[0];
        }
        if (!product) {
          const allRes = await api.getAdminProducts({ limit: '200' }).catch(() => ({ data: [] }));
          product = allRes.data?.find((p: any) => p.id === id);
        }

        if (product) {
          setForm({
            name: product.name || '',
            description: product.description || '',
            slug: product.slug || '',
            sku: product.sku || '',
            hsnCode: product.hsnCode || '',
            basePrice: String(product.basePrice || ''),
            salePrice: product.salePrice ? String(product.salePrice) : '',
            costPrice: product.costPrice ? String(product.costPrice) : '',
            stock: String(product.variants?.reduce((s: number, v: any) => s + v.stock, 0) || product.stock || ''),
            lowStockThreshold: String(product.lowStockThreshold || '10'),
            lockedStock: String(product.lockedStock || '0'),
            lockExpiry: product.lockExpiry ? new Date(product.lockExpiry).toISOString().slice(0, 16) : '',
            gstRate: String(product.gstRate ?? '18'),
            categoryId: product.categoryId || product.category?.id || '',
            brandId: product.brandId || product.brand?.id || '',
            fabric: product.fabric || '',
            material: product.material || '',
            washCare: product.washCare || '',
            isActive: product.isActive ?? true,
            isFeatured: product.isFeatured ?? false,
            isNewArrival: product.isNewArrival ?? false,
            isBestSeller: product.isBestSeller ?? false,
            isTrending: product.isTrending ?? false,
          });
          if (product.images?.length) {
            setImages(product.images.map((img: any) => img.url));
          }
        } else {
          toast.error('Product not found');
          router.push('/admin/products');
        }
      } catch {
        toast.error('Failed to load product');
        router.push('/admin/products');
      }
      setLoading(false);
    };
    loadData();
  }, [id, router]);

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleNameChange = (name: string) => {
    set('name', name);
    if (!form.slug || form.slug === slugify(form.name)) {
      set('slug', slugify(name));
    }
  };

  const addImage = () => {
    if (imageUrl.trim() && !images.includes(imageUrl.trim())) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const removeImage = (idx: number) => setImages(images.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.basePrice || !form.categoryId) {
      toast.error('Name, SKU, Price and Category are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        basePrice: parseFloat(form.basePrice),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        stock: form.stock ? parseInt(form.stock) : 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
        lockedStock: parseInt(form.lockedStock) || 0,
        gstRate: parseFloat(form.gstRate),
        lockExpiry: form.lockExpiry || undefined,
        images: images.map((url, i) => ({ url, isPrimary: i === 0, displayOrder: i })),
      };
      await api.updateProduct(id, payload);
      toast.success('Product updated');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const inputClass = 'w-full border px-3 py-2 text-sm outline-none focus:border-[#1a1a2e]';
  const labelClass = 'block text-sm font-medium mb-1';

  if (loading) return (
    <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
  );

  return (
    <div className="max-w-4xl">
      <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Products
      </Link>
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Product Name *</label>
              <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Slug</label>
              <input type="text" value={form.slug} onChange={(e) => set('slug', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>SKU *</label>
              <input type="text" value={form.sku} onChange={(e) => set('sku', e.target.value)} className={inputClass} required />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={inputClass} rows={4} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Base Price (INR) *</label>
              <input type="number" step="0.01" min="0" value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Sale Price (INR)</label>
              <input type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cost Price (INR)</label>
              <input type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold mb-4">Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Stock</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Low Stock Threshold</label>
              <input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Locked Stock</label>
              <input type="number" min="0" value={form.lockedStock} onChange={(e) => set('lockedStock', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Lock Expiry</label>
              <input type="datetime-local" value={form.lockExpiry} onChange={(e) => set('lockExpiry', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Tax & Category */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold mb-4">Tax & Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>HSN Code</label>
              <input type="text" value={form.hsnCode} onChange={(e) => set('hsnCode', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>GST Rate (%)</label>
              <select value={form.gstRate} onChange={(e) => set('gstRate', e.target.value)} className={inputClass}>
                {[0, 5, 12, 18, 28].map((r) => (
                  <option key={r} value={r}>{r}%</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Category *</label>
              <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={inputClass} required>
                <option value="">Select Category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <select value={form.brandId} onChange={(e) => set('brandId', e.target.value)} className={inputClass}>
                <option value="">Select Brand</option>
                {brands.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fabric & Material */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold mb-4">Fabric & Material</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Fabric</label>
              <input type="text" value={form.fabric} onChange={(e) => set('fabric', e.target.value)} placeholder="e.g. Cotton, Silk" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Material</label>
              <input type="text" value={form.material} onChange={(e) => set('material', e.target.value)} placeholder="e.g. Pure Cotton" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Wash Care</label>
              <input type="text" value={form.washCare} onChange={(e) => set('washCare', e.target.value)} placeholder="e.g. Hand wash cold" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold mb-4">Images</h2>
          <div className="flex gap-2 mb-4">
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className={inputClass} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())} />
            <Button type="button" variant="outline" size="sm" onClick={addImage}><Plus size={14} /> Add</Button>
          </div>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative group w-24 h-28 border overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                  {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">Primary</span>}
                </div>
              ))}
            </div>
          )}
          {images.length === 0 && <p className="text-sm text-gray-400">No images added yet.</p>}
        </div>

        {/* Status Toggles */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold mb-4">Status</h2>
          <div className="flex flex-wrap gap-6">
            {([
              ['isActive', 'Active'],
              ['isFeatured', 'Featured'],
              ['isNewArrival', 'New Arrival'],
              ['isBestSeller', 'Best Seller'],
              ['isTrending', 'Trending'],
            ] as const).map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form[field]} onChange={(e) => set(field, e.target.checked)} className="w-4 h-4" />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>Update Product</Button>
          <Link href="/admin/products"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
