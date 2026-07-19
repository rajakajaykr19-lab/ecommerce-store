'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { buildCategoryOptions, isClothingCategory, isBabyCategory, type CategoryItem } from '@/lib/utils';
import { parseAttributeOptions, type Attribute } from '@/types';
import { ArrowLeft, ArrowRight, Loader2, X, Check, ChevronDown, ChevronRight, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const STEPS = [
  { id: 1, label: 'Category', icon: '1' },
  { id: 2, label: 'Basic Info', icon: '2' },
  { id: 3, label: 'Pricing', icon: '3' },
  { id: 4, label: 'Variants', icon: '4' },
  { id: 5, label: 'Attributes', icon: '5' },
  { id: 6, label: 'Inventory', icon: '6' },
  { id: 7, label: 'Shipping', icon: '7' },
  { id: 8, label: 'Media', icon: '8' },
  { id: 9, label: 'SEO', icon: '9' },
  { id: 10, label: 'Offers', icon: '10' },
  { id: 11, label: 'Visibility', icon: '11' },
  { id: 12, label: 'Returns', icon: '12' },
  { id: 13, label: 'Review', icon: '13' },
];

interface VariantRow {
  id?: string;
  color: string; colorHex: string; size: string; sku: string; barcode: string; price: string; stock: string; weight: string; isActive: boolean;
}

export default function AdminEditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '', slug: '', tags: '', adminNotes: '',
    status: 'PUBLISHED', categoryId: '', brandId: '', gender: '',
    basePrice: '', salePrice: '', costPrice: '',
    sku: '', barcode: '', stock: '0', lowStockThreshold: '10',
    weight: '', length: '', width: '', height: '', shippingClass: '',
    hsnCode: '6109', gstRate: '18',
    fabric: '', material: '', washCare: '',
    metaTitle: '', metaDescription: '', metaKeywords: '',
    canonicalUrl: '', ogImage: '',
    returnAvailable: true, returnPeriod: '30', exchangeAvailable: true, warrantyPeriod: '',
    couponEligible: true, flashSale: false, bogo: false, festivalOffer: false, specialDiscount: '',
    isActive: true, isFeatured: false, isNewArrival: false, isBestSeller: false, isTrending: false,
  });

  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [subcategoryId, setSubcategoryId] = useState('');
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [descriptionTemplates, setDescriptionTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [bulkUrls, setBulkUrls] = useState('');
  const [primaryImageIdx, setPrimaryImageIdx] = useState(0);

  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [variantColors, setVariantColors] = useState([{ color: '', colorHex: '#000000' }]);
  const [variantSizes, setVariantSizes] = useState(['S', 'M', 'L', 'XL']);

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

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
            shortDescription: product.shortDescription || '',
            slug: product.slug || '',
            tags: product.tags || '',
            adminNotes: product.adminNotes || '',
            status: product.status || 'PUBLISHED',
            categoryId: catId,
            brandId: product.brandId || product.brand?.id || '',
            gender: product.gender || '',
            basePrice: String(product.basePrice || ''),
            salePrice: product.salePrice ? String(product.salePrice) : '',
            costPrice: product.costPrice ? String(product.costPrice) : '',
            sku: product.sku || '',
            barcode: product.barcode || '',
            stock: String(product.variants?.reduce((s: number, v: any) => s + v.stock, 0) || product.stock || ''),
            lowStockThreshold: String(product.lowStockThreshold || '10'),
            weight: product.weight ? String(product.weight) : '',
            length: product.length ? String(product.length) : '',
            width: product.width ? String(product.width) : '',
            height: product.height ? String(product.height) : '',
            shippingClass: product.shippingClass || '',
            hsnCode: product.hsnCode || '6109',
            gstRate: String(product.gstRate ?? '18'),
            fabric: product.fabric || '',
            material: product.material || '',
            washCare: product.washCare || '',
            metaTitle: product.metaTitle || '',
            metaDescription: product.metaDescription || '',
            metaKeywords: product.metaKeywords || '',
            canonicalUrl: product.canonicalUrl || '',
            ogImage: product.ogImage || '',
            returnAvailable: product.returnAvailable ?? true,
            returnPeriod: String(product.returnPeriod ?? 30),
            exchangeAvailable: product.exchangeAvailable ?? true,
            warrantyPeriod: product.warrantyPeriod || '',
            couponEligible: product.couponEligible ?? true,
            flashSale: product.flashSale ?? false,
            bogo: product.bogo ?? false,
            festivalOffer: product.festivalOffer ?? false,
            specialDiscount: product.specialDiscount ? String(product.specialDiscount) : '',
            isActive: product.isActive ?? true,
            isFeatured: product.isFeatured ?? false,
            isNewArrival: product.isNewArrival ?? false,
            isBestSeller: product.isBestSeller ?? false,
            isTrending: product.isTrending ?? false,
          });

          if (product.images?.length) {
            const sorted = [...product.images].sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
            setImages(sorted.map((img: any) => img.url));
            const primaryIdx = sorted.findIndex((img: any) => img.isPrimary);
            if (primaryIdx >= 0) setPrimaryImageIdx(primaryIdx);
          }

          if (product.variants?.length) {
            setVariants(product.variants.map((v: any) => ({
              id: v.id, color: v.color || '', colorHex: v.colorHex || '#000000', size: v.size || '',
              sku: v.sku || '', barcode: v.barcode || '', price: v.price ? String(v.price) : '',
              stock: String(v.stock || 0), weight: v.weight ? String(v.weight) : '',
              isActive: v.isActive ?? true,
            })));
          }

          const children = allCats.filter((c: any) => c.parentId === catId);
          if (children.length > 0) {
            setSubcategories(children);
          } else {
            const selected = allCats.find((c: any) => c.id === catId);
            if (selected?.parentId) {
              setSubcategories(allCats.filter((c: any) => c.parentId === selected.parentId));
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
      setSubcategoryId('');
      setAttributes([]);
      setDescriptionTemplates([]);
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
      }
    }
    setLoadingTemplates(true);
    api.getDescriptionTemplates(form.categoryId)
      .then((res: any) => setDescriptionTemplates(res.data || []))
      .catch(() => setDescriptionTemplates([]))
      .finally(() => setLoadingTemplates(false));
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

  const categoryOptions = useMemo(() => buildCategoryOptions(categories as CategoryItem[]), [categories]);
  const showFabricSection = isClothingCategory(categories as CategoryItem[], form.categoryId);

  const set = useCallback((field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value })), []);

  const handleNameChange = (name: string) => {
    set('name', name);
    if (!slugManuallyEdited || !form.slug || form.slug === slugify(form.name)) {
      set('slug', slugify(name));
    }
  };

  const discountPercent = useMemo(() => {
    const base = parseFloat(form.basePrice);
    const sale = parseFloat(form.salePrice);
    if (!base || !sale || sale >= base) return 0;
    return Math.round(((base - sale) / base) * 100);
  }, [form.basePrice, form.salePrice]);

  const addBulkImages = () => {
    const urls = bulkUrls.split('\n').map((u) => u.trim()).filter((u) => u && u.startsWith('http') && !images.includes(u));
    if (urls.length === 0) { toast.error('No valid URLs found'); return; }
    setImages([...images, ...urls]);
    setBulkUrls('');
    toast.success(`${urls.length} image(s) added`);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (primaryImageIdx >= images.length - 1) setPrimaryImageIdx(Math.max(0, images.length - 2));
  };

  const moveImage = (from: number, to: number) => {
    const newImages = [...images];
    const [item] = newImages.splice(from, 1);
    newImages.splice(to, 0, item);
    setImages(newImages);
    if (primaryImageIdx === from) setPrimaryImageIdx(to);
    else if (from < primaryImageIdx && to >= primaryImageIdx) setPrimaryImageIdx(primaryImageIdx - 1);
    else if (from > primaryImageIdx && to <= primaryImageIdx) setPrimaryImageIdx(primaryImageIdx + 1);
  };

  const generateVariants = () => {
    const rows: VariantRow[] = [];
    for (const c of variantColors) {
      for (const size of variantSizes) {
        if (!c.color && !size) continue;
        const prefix = form.sku || slugify(form.name) || 'SKU';
        const colorPart = c.color ? c.color.substring(0, 3).toUpperCase() : 'XX';
        const sizePart = size ? size.substring(0, 2).toUpperCase() : 'OS';
        rows.push({
          color: c.color, colorHex: c.colorHex, size,
          sku: `${prefix}-${colorPart}-${sizePart}`,
          barcode: '', price: form.salePrice || form.basePrice || '',
          stock: '0', weight: form.weight || '', isActive: true,
        });
      }
    }
    setVariants(rows);
    toast.success(`${rows.length} variants generated`);
  };

  const updateVariant = (idx: number, field: keyof VariantRow, value: any) => {
    setVariants((prev) => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const removeVariant = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!form.name || !form.basePrice || !form.categoryId) {
      toast.error('Name, Price and Category are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name, description: form.description, shortDescription: form.shortDescription,
        slug: form.slug, tags: form.tags, adminNotes: form.adminNotes, status: form.status,
        categoryId: subcategoryId || form.categoryId, brandId: form.brandId || undefined,
        gender: form.gender || undefined,
        basePrice: parseFloat(form.basePrice),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
        sku: form.sku, barcode: form.barcode || undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        length: form.length ? parseFloat(form.length) : undefined,
        width: form.width ? parseFloat(form.width) : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        shippingClass: form.shippingClass || undefined,
        hsnCode: form.hsnCode, gstRate: parseFloat(form.gstRate),
        fabric: form.fabric || undefined, material: form.material || undefined, washCare: form.washCare || undefined,
        metaTitle: form.metaTitle || undefined, metaDescription: form.metaDescription || undefined,
        metaKeywords: form.metaKeywords || undefined, canonicalUrl: form.canonicalUrl || undefined,
        ogImage: form.ogImage || undefined,
        returnAvailable: form.returnAvailable, returnPeriod: parseInt(form.returnPeriod) || 30,
        exchangeAvailable: form.exchangeAvailable, warrantyPeriod: form.warrantyPeriod || undefined,
        couponEligible: form.couponEligible, flashSale: form.flashSale, bogo: form.bogo,
        festivalOffer: form.festivalOffer,
        specialDiscount: form.specialDiscount ? parseFloat(form.specialDiscount) : undefined,
        isActive: form.isActive, isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival, isBestSeller: form.isBestSeller, isTrending: form.isTrending,
        images: images.map((url, i) => ({ url, isPrimary: i === primaryImageIdx, displayOrder: i })),
        variants: variants.map((v) => ({
          id: v.id, size: v.size || undefined, color: v.color || undefined, colorHex: v.colorHex || undefined,
          sku: v.sku, barcode: v.barcode || undefined,
          price: v.price ? parseFloat(v.price) : undefined,
          stock: parseInt(v.stock) || 0, weight: v.weight ? parseFloat(v.weight) : undefined,
          isActive: v.isActive,
        })),
        attributes: Object.entries(attributeValues).filter(([, v]) => v.trim() !== '').map(([attributeId, value]) => ({ attributeId, value })),
      };
      await api.updateProduct(id, payload);
      toast.success('Product updated successfully');
      router.push(`/admin/products/${id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const inputClass = 'w-full border px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] bg-white';
  const labelClass = 'block text-sm font-medium mb-1';
  const requiredMark = <span className="text-red-500 ml-0.5">*</span>;

  const canNext = () => {
    switch (step) {
      case 1: return form.categoryId;
      case 2: return form.name.trim().length > 0;
      case 3: return parseFloat(form.basePrice) > 0 && (!form.salePrice || parseFloat(form.salePrice) <= parseFloat(form.basePrice));
      default: return true;
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
  );

  return (
    <div className="max-w-4xl">
      <Link href={`/admin/products/${id}`} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Product
      </Link>
      <h1 className="text-2xl font-bold mb-2">Edit Product</h1>
      <p className="text-sm text-gray-400 mb-6">Editing: {form.name}</p>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                step === s.id ? 'bg-[#1a1a2e] text-white' :
                step > s.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {step > s.id ? <Check size={12} /> : <span className="w-4">{s.icon}</span>}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#1a1a2e] transition-all duration-300" style={{ width: `${(step / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* STEP 1: Category */}
        {step === 1 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Category & Brand</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category {requiredMark}</label>
                <select value={form.categoryId} onChange={(e) => { set('categoryId', e.target.value); setSubcategoryId(''); }} className={inputClass} required>
                  <option value="">Select Category</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.displayName}</option>
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
            {showFabricSection && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">Fabric & Material (Clothing)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className={labelClass}>Fabric</label><input type="text" value={form.fabric} onChange={(e) => set('fabric', e.target.value)} className={inputClass} placeholder="e.g. Cotton, Silk" /></div>
                  <div><label className={labelClass}>Material</label><input type="text" value={form.material} onChange={(e) => set('material', e.target.value)} className={inputClass} placeholder="e.g. Pure Cotton" /></div>
                  <div><label className={labelClass}>Wash Care</label><input type="text" value={form.washCare} onChange={(e) => set('washCare', e.target.value)} className={inputClass} placeholder="e.g. Machine wash" /></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Basic Info */}
        {step === 2 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Product Name {requiredMark}</label>
                <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Slug</label>
                <input type="text" value={form.slug} onChange={(e) => { set('slug', e.target.value); setSlugManuallyEdited(true); }} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Short Description</label>
                <input type="text" value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} className={inputClass} placeholder="Brief one-liner" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Description Template</label>
                {loadingTemplates ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="animate-spin" size={14} /> Loading templates...
                  </div>
                ) : descriptionTemplates.length > 0 ? (
                  <select
                    value=""
                    onChange={(e) => {
                      const tmpl = descriptionTemplates.find((t: any) => t.id === e.target.value);
                      if (tmpl) set('description', tmpl.description);
                    }}
                    className={inputClass}
                  >
                    <option value="">Apply a template...</option>
                    {descriptionTemplates.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                ) : form.categoryId ? (
                  <p className="text-sm text-gray-400 py-2">No templates for this category.</p>
                ) : (
                  <p className="text-sm text-gray-400 py-2">Select a category to see description templates.</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={inputClass} rows={4} placeholder="Write or apply a template..." />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Tags</label>
                <input type="text" value={form.tags} onChange={(e) => set('tags', e.target.value)} className={inputClass} placeholder="Comma-separated tags" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Pricing */}
        {step === 3 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>MRP (INR) {requiredMark}</label>
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
            {discountPercent > 0 && (
              <div className="bg-green-50 border border-green-200 p-3 rounded text-sm text-green-700">
                {discountPercent}% discount — customers save ₹{(parseFloat(form.basePrice) - parseFloat(form.salePrice)).toLocaleString('en-IN')}
              </div>
            )}
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
            </div>
          </div>
        )}

        {/* STEP 4: Variants */}
        {step === 4 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Variants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Colors</label>
                {variantColors.map((c, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="color" value={c.colorHex} onChange={(e) => {
                      const next = [...variantColors]; next[i] = { ...next[i], colorHex: e.target.value }; setVariantColors(next);
                    }} className="w-10 h-9 border cursor-pointer" />
                    <input type="text" value={c.color} onChange={(e) => {
                      const next = [...variantColors]; next[i] = { ...next[i], color: e.target.value }; setVariantColors(next);
                    }} className={inputClass} placeholder="Color name" />
                    {variantColors.length > 1 && (
                      <button type="button" onClick={() => setVariantColors(variantColors.filter((_, j) => j !== i))} className="text-red-500"><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setVariantColors([...variantColors, { color: '', colorHex: '#000000' }])}>
                  <Plus size={14} className="mr-1" /> Add Color
                </Button>
              </div>
              <div>
                <label className={labelClass}>Sizes</label>
                <input type="text" value={variantSizes.join(', ')} onChange={(e) => setVariantSizes(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} className={inputClass} placeholder="S, M, L, XL" />
                <p className="text-xs text-gray-400 mt-1">Comma-separated sizes</p>
              </div>
            </div>
            <Button type="button" onClick={generateVariants} className="bg-[#1a1a2e] hover:bg-[#2a2a3e]">
              Generate Variants
            </Button>
            {variants.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Color</th>
                      <th className="px-3 py-2 text-left">Size</th>
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">Price</th>
                      <th className="px-3 py-2 text-left">Stock</th>
                      <th className="px-3 py-2 text-left">Active</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2"><input type="text" value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} className="border px-2 py-1 text-xs w-20" /></td>
                        <td className="px-3 py-2"><input type="text" value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} className="border px-2 py-1 text-xs w-16" /></td>
                        <td className="px-3 py-2"><input type="text" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} className="border px-2 py-1 text-xs w-32" /></td>
                        <td className="px-3 py-2"><input type="number" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} className="border px-2 py-1 text-xs w-20" /></td>
                        <td className="px-3 py-2"><input type="number" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} className="border px-2 py-1 text-xs w-16" /></td>
                        <td className="px-3 py-2"><input type="checkbox" checked={v.isActive} onChange={(e) => updateVariant(i, 'isActive', e.target.checked)} className="w-4 h-4" /></td>
                        <td className="px-3 py-2"><button type="button" onClick={() => removeVariant(i)} className="text-red-500"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Attributes */}
        {step === 5 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Product Attributes</h2>
            {loadingAttributes ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="animate-spin" size={16} /> Loading attributes...
              </div>
            ) : !subcategoryId ? (
              <p className="text-sm text-gray-400 py-4">Select a subcategory in Step 1 to see attributes</p>
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
                              <input type="text" value={attributeValues[attr.id] || ''} onChange={(e) => setAttributeValues((prev) => ({ ...prev, [attr.id]: e.target.value }))} className={inputClass} required={attr.required} />
                            )}
                            {attr.fieldType === 'textarea' && (
                              <textarea value={attributeValues[attr.id] || ''} onChange={(e) => setAttributeValues((prev) => ({ ...prev, [attr.id]: e.target.value }))} className={inputClass} rows={3} required={attr.required} />
                            )}
                            {attr.fieldType === 'number' && (
                              <input type="number" value={attributeValues[attr.id] || ''} onChange={(e) => setAttributeValues((prev) => ({ ...prev, [attr.id]: e.target.value }))} className={inputClass} required={attr.required} />
                            )}
                            {attr.fieldType === 'select' && (
                              <select value={attributeValues[attr.id] || ''} onChange={(e) => setAttributeValues((prev) => ({ ...prev, [attr.id]: e.target.value }))} className={inputClass} required={attr.required}>
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
                                      <input type="checkbox" checked={selected} onChange={() => {
                                        const current = (attributeValues[attr.id] || '').split(',').filter(Boolean);
                                        const next = selected ? current.filter((v) => v !== opt) : [...current, opt];
                                        setAttributeValues((prev) => ({ ...prev, [attr.id]: next.join(',') }));
                                      }} className="w-3.5 h-3.5" />
                                      {opt}
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                            {attr.fieldType === 'boolean' && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                                <input type="checkbox" checked={attributeValues[attr.id] === 'true'} onChange={(e) => setAttributeValues((prev) => ({ ...prev, [attr.id]: e.target.checked ? 'true' : 'false' }))} className="w-4 h-4" />
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
        )}

        {/* STEP 6: Inventory */}
        {step === 6 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>SKU {requiredMark}</label><input type="text" value={form.sku} onChange={(e) => set('sku', e.target.value)} className={inputClass} required placeholder="e.g. TSH-BLK-M" /></div>
              <div><label className={labelClass}>Barcode</label><input type="text" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} className={inputClass} placeholder="EAN/UPC barcode" /></div>
            </div>
            {variants.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Stock Quantity</label><input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Low Stock Alert</label><input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} className={inputClass} /></div>
              </div>
            )}
            {variants.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 rounded">
                Stock is managed per-variant ({variants.length} variants). Edit stock in the Variants table (Step 4).
              </div>
            )}
          </div>
        )}

        {/* STEP 7: Shipping */}
        {step === 7 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Shipping</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Weight (kg)</label><input type="number" step="0.01" min="0" value={form.weight} onChange={(e) => set('weight', e.target.value)} className={inputClass} placeholder="0.5" /></div>
              <div><label className={labelClass}>Shipping Class</label><select value={form.shippingClass} onChange={(e) => set('shippingClass', e.target.value)} className={inputClass}><option value="">Standard</option><option value="heavy">Heavy/Oversized</option><option value="fragile">Fragile</option><option value="express">Express Only</option></select></div>
              <div><label className={labelClass}>Length (cm)</label><input type="number" step="0.1" min="0" value={form.length} onChange={(e) => set('length', e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Width (cm)</label><input type="number" step="0.1" min="0" value={form.width} onChange={(e) => set('width', e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Height (cm)</label><input type="number" step="0.1" min="0" value={form.height} onChange={(e) => set('height', e.target.value)} className={inputClass} /></div>
            </div>
          </div>
        )}

        {/* STEP 8: Media */}
        {step === 8 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Product Images</h2>
            <div>
              <label className={labelClass}>Image URLs (one per line)</label>
              <textarea value={bulkUrls} onChange={(e) => setBulkUrls(e.target.value)} className={inputClass} rows={5} placeholder="https://cdn.example.com/image1.jpg&#10;https://cdn.example.com/image2.jpg&#10;https://cdn.example.com/image3.jpg" />
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addBulkImages}>Add Images</Button>
            </div>
            {images.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">{images.length} image(s). Click star to set featured. Drag arrows to reorder.</p>
                <div className="flex flex-wrap gap-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative group w-28 h-32 border overflow-hidden bg-gray-50">
                      <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute top-1 left-1 flex gap-1">
                        <button type="button" onClick={() => setPrimaryImageIdx(i)} className={`p-0.5 rounded text-white text-xs ${i === primaryImageIdx ? 'bg-yellow-500' : 'bg-black/50'}`}>★</button>
                      </div>
                      <div className="absolute top-1 right-1 flex flex-col gap-1">
                        <button type="button" onClick={() => removeImage(i)} className="bg-red-500/80 text-white rounded p-0.5 opacity-0 group-hover:opacity-100"><X size={10} /></button>
                      </div>
                      <div className="absolute bottom-1 right-1 flex gap-1">
                        {i > 0 && <button type="button" onClick={() => moveImage(i, i - 1)} className="bg-black/50 text-white rounded p-0.5 text-xs">◀</button>}
                        {i < images.length - 1 && <button type="button" onClick={() => moveImage(i, i + 1)} className="bg-black/50 text-white rounded p-0.5 text-xs">▶</button>}
                      </div>
                      {i === primaryImageIdx && <span className="absolute bottom-0 left-0 right-0 bg-yellow-500 text-white text-[9px] text-center py-0.5 font-medium">Featured</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {images.length === 0 && <p className="text-sm text-gray-400">Paste image URLs above and click Add Images.</p>}
          </div>
        )}

        {/* STEP 9: SEO */}
        {step === 9 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">SEO</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={labelClass}>Meta Title</label><input type="text" value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} className={inputClass} placeholder="SEO title (defaults to product name)" /></div>
              <div className="md:col-span-2"><label className={labelClass}>Meta Description</label><textarea value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} className={inputClass} rows={3} placeholder="SEO description" /></div>
              <div className="md:col-span-2"><label className={labelClass}>Meta Keywords</label><input type="text" value={form.metaKeywords} onChange={(e) => set('metaKeywords', e.target.value)} className={inputClass} placeholder="Comma-separated keywords" /></div>
              <div><label className={labelClass}>Canonical URL</label><input type="text" value={form.canonicalUrl} onChange={(e) => set('canonicalUrl', e.target.value)} className={inputClass} placeholder="https://..." /></div>
              <div><label className={labelClass}>OG Image URL</label><input type="text" value={form.ogImage} onChange={(e) => set('ogImage', e.target.value)} className={inputClass} placeholder="https://..." /></div>
            </div>
          </div>
        )}

        {/* STEP 10: Offers */}
        {step === 10 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Offers & Promotions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.couponEligible} onChange={(e) => set('couponEligible', e.target.checked)} className="w-4 h-4" /><label className="text-sm">Coupon Eligible</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.flashSale} onChange={(e) => set('flashSale', e.target.checked)} className="w-4 h-4" /><label className="text-sm">Flash Sale</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.bogo} onChange={(e) => set('bogo', e.target.checked)} className="w-4 h-4" /><label className="text-sm">BOGO (Buy One Get One)</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.festivalOffer} onChange={(e) => set('festivalOffer', e.target.checked)} className="w-4 h-4" /><label className="text-sm">Festival Offer</label></div>
              <div>
                <label className={labelClass}>Special Discount (%)</label>
                <input type="number" min="0" max="100" value={form.specialDiscount} onChange={(e) => set('specialDiscount', e.target.value)} className={inputClass} placeholder="0" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 11: Visibility */}
        {step === 11 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Visibility & Flags</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-4 h-4" /><label className="text-sm">Active</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="w-4 h-4" /><label className="text-sm">Featured</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.isNewArrival} onChange={(e) => set('isNewArrival', e.target.checked)} className="w-4 h-4" /><label className="text-sm">New Arrival</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.isBestSeller} onChange={(e) => set('isBestSeller', e.target.checked)} className="w-4 h-4" /><label className="text-sm">Best Seller</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.isTrending} onChange={(e) => set('isTrending', e.target.checked)} className="w-4 h-4" /><label className="text-sm">Trending</label></div>
            </div>
            <div><label className={labelClass}>Admin Notes</label><textarea value={form.adminNotes} onChange={(e) => set('adminNotes', e.target.value)} className={inputClass} rows={3} placeholder="Internal notes (not visible to customers)" /></div>
          </div>
        )}

        {/* STEP 12: Returns */}
        {step === 12 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Returns & Warranty</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.returnAvailable} onChange={(e) => set('returnAvailable', e.target.checked)} className="w-4 h-4" /><label className="text-sm">Return Available</label></div>
              {form.returnAvailable && (
                <div><label className={labelClass}>Return Period (days)</label><input type="number" min="0" value={form.returnPeriod} onChange={(e) => set('returnPeriod', e.target.value)} className={inputClass} /></div>
              )}
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.exchangeAvailable} onChange={(e) => set('exchangeAvailable', e.target.checked)} className="w-4 h-4" /><label className="text-sm">Exchange Available</label></div>
              <div><label className={labelClass}>Warranty Period</label><input type="text" value={form.warrantyPeriod} onChange={(e) => set('warrantyPeriod', e.target.value)} className={inputClass} placeholder="e.g. 6 months, 1 year" /></div>
            </div>
          </div>
        )}

        {/* STEP 13: Review */}
        {step === 13 && (
          <div className="bg-white border p-6 space-y-6">
            <h2 className="text-lg font-semibold">Review & Update</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Product Info</h3>
                <div className="text-sm"><span className="text-gray-400">Name:</span> <span className="font-medium">{form.name || '—'}</span></div>
                <div className="text-sm"><span className="text-gray-400">SKU:</span> <span className="font-medium">{form.sku || '—'}</span></div>
                <div className="text-sm"><span className="text-gray-400">Status:</span> <span className={`px-2 py-0.5 text-xs ${form.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : form.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{form.status}</span></div>
                <div className="text-sm"><span className="text-gray-400">Category:</span> {categories.find((c: any) => c.id === form.categoryId)?.name || '—'}</div>
                <div className="text-sm"><span className="text-gray-400">Brand:</span> {brands.find((b: any) => b.id === form.brandId)?.name || '—'}</div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Pricing & Stock</h3>
                <div className="text-sm"><span className="text-gray-400">MRP:</span> ₹{parseFloat(form.basePrice || '0').toLocaleString('en-IN')}</div>
                {form.salePrice && <div className="text-sm"><span className="text-gray-400">Sale:</span> ₹{parseFloat(form.salePrice).toLocaleString('en-IN')} <span className="text-green-600">({discountPercent}% off)</span></div>}
                <div className="text-sm"><span className="text-gray-400">Variants:</span> {variants.length || '—'}</div>
                <div className="text-sm"><span className="text-gray-400">Images:</span> {images.length || '—'}</div>
                <div className="text-sm"><span className="text-gray-400">Attributes:</span> {Object.values(attributeValues).filter(Boolean).length || '—'}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.isFeatured && <span className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700">Featured</span>}
              {form.isNewArrival && <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700">New Arrival</span>}
              {form.isBestSeller && <span className="px-2 py-1 text-xs bg-purple-50 text-purple-700">Best Seller</span>}
              {form.isTrending && <span className="px-2 py-1 text-xs bg-orange-50 text-orange-700">Trending</span>}
              {form.flashSale && <span className="px-2 py-1 text-xs bg-red-50 text-red-700">Flash Sale</span>}
              {form.bogo && <span className="px-2 py-1 text-xs bg-pink-50 text-pink-700">BOGO</span>}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase">Validation</h3>
              {[
                [!!form.name, 'Product Name'],
                [!!form.categoryId, 'Category'],
                [parseFloat(form.basePrice) > 0, 'MRP > 0'],
                [!form.salePrice || parseFloat(form.salePrice) <= parseFloat(form.basePrice), 'Sale Price valid'],
                [images.length > 0, 'At least 1 image'],
              ].map(([ok, label], idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  {ok ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-red-500" />}
                  <span className={ok ? 'text-green-700' : 'text-red-600'}>{String(label)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pb-8">
        <Button type="button" variant="outline" disabled={step <= 1} onClick={() => setStep(step - 1)}>
          <ArrowLeft size={14} className="mr-1" /> Previous
        </Button>
        <div className="text-sm text-gray-400">Step {step} of {STEPS.length}</div>
        {step < STEPS.length ? (
          <Button type="button" onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Next <ArrowRight size={14} className="ml-1" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} loading={saving} className="bg-green-600 hover:bg-green-700">
            <Save size={14} className="mr-1" /> Update Product
          </Button>
        )}
      </div>
    </div>
  );
}
