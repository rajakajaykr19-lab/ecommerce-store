'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { parseAttributeOptions, type Attribute } from '@/types';
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
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [subcategoryId, setSubcategoryId] = useState('');
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
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
        const allCats = (catRes as any)?.data || [];
        setCategories(allCats);
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
          const catId = product.categoryId || product.category?.id || '';
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
            categoryId: catId,
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

          const children = allCats.filter((c: any) => c.parentId === catId);
          if (children.length > 0) {
            setSubcategories(children);
          } else {
            const selected = allCats.find((c: any) => c.id === catId);
            if (selected?.parentId) {
              const parentChildren = allCats.filter((c: any) => c.parentId === selected.parentId);
              setSubcategories(parentChildren);
              setSubcategoryId(catId);
            }
          }

          api.getProductAttributes(id).then((res: any) => {
            const vals: Record<string, string> = {};
            (res.data || []).forEach((av: any) => { vals[av.attributeId] = av.value; });
            setAttributeValues(vals);
          }).catch(() => {});
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

  useEffect(() => {
    if (!form.categoryId) {
      setSubcategories([]);
      return;
    }
    const children = categories.filter((c: any) => c.parentId === form.categoryId);
    setSubcategories(children);
    if (children.length === 0) {
      const selected = categories.find((c: any) => c.id === form.categoryId);
      if (selected?.parentId) {
        setSubcategoryId(form.categoryId);
      } else {
        setSubcategoryId('');
        setAttributes([]);
      }
    }
  }, [form.categoryId, categories]);

  useEffect(() => {
    if (!subcategoryId) {
      setAttributes([]);
      return;
    }
    setLoadingAttributes(true);
    api.getSubcategoryAttributesPublic(subcategoryId)
      .then((res: any) => {
        const attrs: Attribute[] = res.data || [];
        setAttributes(attrs);
        setAttributeValues((prev) => {
          const next = { ...prev };
          attrs.forEach((a) => { if (!(a.id in next)) next[a.id] = ''; });
          return next;
        });
      })
      .catch(() => setAttributes([]))
      .finally(() => setLoadingAttributes(false));
  }, [subcategoryId]);

  const groupedAttributes = useMemo(() => {
    const groups: Record<string, Attribute[]> = {};
    attributes.forEach((attr) => {
      const name = attr.group?.name || 'Other';
      if (!groups[name]) groups[name] = [];
      groups[name].push(attr);
    });
    return groups;
  }, [attributes]);

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
        categoryId: subcategoryId || form.categoryId,
        basePrice: parseFloat(form.basePrice),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        stock: form.stock ? parseInt(form.stock) : 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
        lockedStock: parseInt(form.lockedStock) || 0,
        gstRate: parseFloat(form.gstRate),
        lockExpiry: form.lockExpiry || undefined,
        images: images.map((url, i) => ({ url, isPrimary: i === 0, displayOrder: i })),
        attributes: Object.entries(attributeValues)
          .filter(([, v]) => v.trim() !== '')
          .map(([attributeId, value]) => ({ attributeId, value })),
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
            {subcategories.length > 0 && (
              <div className="md:col-span-2">
                <label className={labelClass}>Subcategory (for Attributes)</label>
                <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className={inputClass}>
                  <option value="">Select Subcategory</option>
                  {subcategories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
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

        {/* Product Attributes */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold mb-4">Product Attributes</h2>
          {loadingAttributes ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 className="animate-spin" size={16} /> Loading attributes...
            </div>
          ) : !subcategoryId ? (
            <p className="text-sm text-gray-400 py-4">Select a subcategory to see available attributes</p>
          ) : attributes.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No attributes defined for this subcategory</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedAttributes).map(([groupName, attrs]) => (
                <div key={groupName} className="border rounded">
                  <button
                    type="button"
                    onClick={() => setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }))}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span>{groupName}</span>
                    {collapsedGroups[groupName] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {!collapsedGroups[groupName] && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {attrs.sort((a, b) => a.displayOrder - b.displayOrder).map((attr) => (
                        <div key={attr.id}>
                          <label className={labelClass}>
                            {attr.name}
                            {attr.required && <span className="text-red-500 ml-0.5">*</span>}
                          </label>
                          {attr.fieldType === 'text' && (
                            <input
                              type="text"
                              value={attributeValues[attr.id] || ''}
                              onChange={(e) => setAttributeValues((prev) => ({ ...prev, [attr.id]: e.target.value }))}
                              className={inputClass}
                              required={attr.required}
                            />
                          )}
                          {attr.fieldType === 'textarea' && (
                            <textarea
                              value={attributeValues[attr.id] || ''}
                              onChange={(e) => setAttributeValues((prev) => ({ ...prev, [attr.id]: e.target.value }))}
                              className={inputClass}
                              rows={3}
                              required={attr.required}
                            />
                          )}
                          {attr.fieldType === 'number' && (
                            <input
                              type="number"
                              value={attributeValues[attr.id] || ''}
                              onChange={(e) => setAttributeValues((prev) => ({ ...prev, [attr.id]: e.target.value }))}
                              className={inputClass}
                              required={attr.required}
                            />
                          )}
                          {attr.fieldType === 'select' && (
                            <select
                              value={attributeValues[attr.id] || ''}
                              onChange={(e) => setAttributeValues((prev) => ({ ...prev, [attr.id]: e.target.value }))}
                              className={inputClass}
                              required={attr.required}
                            >
                              <option value="">Select {attr.name}</option>
                              {parseAttributeOptions(attr.options).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                          {attr.fieldType === 'multiselect' && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {parseAttributeOptions(attr.options).map((opt) => {
                                const selected = (attributeValues[attr.id] || '').split(',').filter(Boolean).includes(opt);
                                return (
                                  <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => {
                                        const current = (attributeValues[attr.id] || '').split(',').filter(Boolean);
                                        const next = selected ? current.filter((v) => v !== opt) : [...current, opt];
                                        setAttributeValues((prev) => ({ ...prev, [attr.id]: next.join(',') }));
                                      }}
                                      className="w-3.5 h-3.5"
                                    />
                                    {opt}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          {attr.fieldType === 'boolean' && (
                            <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                              <input
                                type="checkbox"
                                checked={attributeValues[attr.id] === 'true'}
                                onChange={(e) => setAttributeValues((prev) => ({ ...prev, [attr.id]: e.target.checked ? 'true' : 'false' }))}
                                className="w-4 h-4"
                              />
                              Yes
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>Update Product</Button>
          <Link href="/admin/products"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
