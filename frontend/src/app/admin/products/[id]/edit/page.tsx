'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { buildCategoryOptions, isClothingCategory, type CategoryItem } from '@/lib/utils';
import { parseAttributeOptions, type Attribute } from '@/types';
import { ArrowLeft, Loader2, X, Check, ChevronDown, ChevronRight, Plus, Trash2, Save, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface VariantRow {
  id?: string;
  color: string; colorHex: string; size: string; sku: string; barcode: string; price: string; stock: string; weight: string; isActive: boolean;
}

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}

function Section({ title, defaultOpen = false, children, badge }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800">{title}</span>
          {badge && <span className="text-xs bg-[#1a1a2e] text-white px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        {open ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t">{children}</div>}
    </div>
  );
}

export default function AdminEditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
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
    const selected = categories.find((c: any) => c.id === form.categoryId);
    if (selected?.gender && !form.gender) {
      setForm((prev) => ({ ...prev, gender: selected.gender }));
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

  const autoSeoTitle = useMemo(() => {
    if (form.metaTitle) return form.metaTitle;
    return form.name || '';
  }, [form.name, form.metaTitle]);

  const autoSeoDescription = useMemo(() => {
    if (form.metaDescription) return form.metaDescription;
    if (form.shortDescription) return form.shortDescription;
    if (form.description) return form.description.slice(0, 160);
    return '';
  }, [form.shortDescription, form.description, form.metaDescription]);

  const autoSeoKeywords = useMemo(() => {
    if (form.metaKeywords) return form.metaKeywords;
    if (form.tags) return form.tags;
    const catName = categories.find((c: any) => c.id === form.categoryId)?.name || '';
    const brandName = brands.find((b: any) => b.id === form.brandId)?.name || '';
    return [catName, brandName, form.name].filter(Boolean).join(', ');
  }, [form.tags, form.metaKeywords, form.name, form.categoryId, form.brandId, categories, brands]);

  const addBulkImages = () => {
    const lines = bulkUrls.split(/\r?\n/).map((u) => u.trim()).filter(Boolean);
    const valid = lines.filter((u) => (u.startsWith('http://') || u.startsWith('https://')) && !images.includes(u));
    if (valid.length === 0) { toast.error('No valid URLs found'); return; }
    setImages((prev) => [...prev, ...valid]);
    setBulkUrls('');
    toast.success(`${valid.length} image(s) added`);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (primaryImageIdx >= images.length - 1) setPrimaryImageIdx(Math.max(0, images.length - 2));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
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
        metaTitle: autoSeoTitle || undefined, metaDescription: autoSeoDescription || undefined,
        metaKeywords: autoSeoKeywords || undefined, canonicalUrl: form.canonicalUrl || undefined,
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

  const inputClass = 'w-full border px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] bg-white rounded';
  const labelClass = 'block text-sm font-medium mb-1';
  const requiredMark = <span className="text-red-500 ml-0.5">*</span>;

  const renderAttributeField = (attr: Attribute) => {
    const hasOptions = parseAttributeOptions(attr.options).length > 0;
    const value = attributeValues[attr.id] || '';
    const onChange = (v: string) => setAttributeValues((p) => ({ ...p, [attr.id]: v }));

    if (attr.fieldType === 'multiselect' && hasOptions) {
      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {parseAttributeOptions(attr.options).map((opt) => {
            const selected = value.split(',').filter(Boolean).includes(opt);
            return (
              <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer bg-gray-50 border rounded px-2 py-1 hover:bg-gray-100">
                <input type="checkbox" checked={selected} onChange={() => {
                  const current = value.split(',').filter(Boolean);
                  onChange((selected ? current.filter((v) => v !== opt) : [...current, opt]).join(','));
                }} className="w-3.5 h-3.5" />
                {opt}
              </label>
            );
          })}
        </div>
      );
    }

    if ((attr.fieldType === 'select' || (hasOptions && attr.fieldType !== 'boolean' && attr.fieldType !== 'textarea' && attr.fieldType !== 'number')) && hasOptions) {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">Select {attr.name}</option>
          {parseAttributeOptions(attr.options).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    if (attr.fieldType === 'boolean') {
      return (
        <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
          <input type="checkbox" checked={value === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : 'false')} className="w-4 h-4" />
          Yes
        </label>
      );
    }

    if (attr.fieldType === 'textarea') {
      return <textarea value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} rows={2} />;
    }

    if (attr.fieldType === 'number') {
      return <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
    }

    return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
  };

  if (loading) return (
    <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
  );

  return (
    <div className="max-w-5xl pb-12">
      <Link href={`/admin/products/${id}`} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Product
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-sm text-gray-400">{form.name}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Section title="Category & Organization" defaultOpen={!form.categoryId} badge={form.categoryId ? 'Done' : undefined}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <label className={labelClass}>Category {requiredMark}</label>
              <select value={form.categoryId} onChange={(e) => { set('categoryId', e.target.value); setSubcategoryId(''); }} className={inputClass} required>
                <option value="">Select Category</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
            </div>
            {subcategories.length > 0 && (
              <div>
                <label className={labelClass}>Subcategory</label>
                <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className={inputClass}>
                  <option value="">Select Subcategory</option>
                  {subcategories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>Brand</label>
              <select value={form.brandId} onChange={(e) => set('brandId', e.target.value)} className={inputClass}>
                <option value="">Select Brand</option>
                {brands.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Gender {form.gender && <span className="text-xs text-green-600 font-normal ml-2">auto-filled</span>}</label>
              <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputClass}>
                <option value="">Select Gender</option>
                <option value="MEN">Men</option>
                <option value="WOMEN">Women</option>
                <option value="KIDS">Kids</option>
                <option value="UNISEX">Unisex</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Basic Information" badge={form.name ? 'Done' : undefined}>
          <div className="space-y-4 pt-4">
            <div>
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
            <div>
              <label className={labelClass}>Description Template</label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="animate-spin" size={14} /> Loading templates...
                </div>
              ) : descriptionTemplates.length > 0 ? (
                <select value="" onChange={(e) => {
                  const tmpl = descriptionTemplates.find((t: any) => t.id === e.target.value);
                  if (tmpl) set('description', tmpl.description);
                }} className={inputClass}>
                  <option value="">Apply a template...</option>
                  {descriptionTemplates.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              ) : form.categoryId ? (
                <p className="text-sm text-gray-400 py-2">No templates for this category.</p>
              ) : (
                <p className="text-sm text-gray-400 py-2">Select a category to see templates.</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={inputClass} rows={6} placeholder="Write or apply a template..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tags</label>
                <input type="text" value={form.tags} onChange={(e) => set('tags', e.target.value)} className={inputClass} placeholder="Comma-separated tags" />
              </div>
              <div>
                <label className={labelClass}>Admin Notes</label>
                <input type="text" value={form.adminNotes} onChange={(e) => set('adminNotes', e.target.value)} className={inputClass} placeholder="Internal notes" />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Pricing & Tax" badge={form.basePrice ? 'Done' : undefined}>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>MRP (Base Price) {requiredMark}</label>
                <input type="number" step="0.01" min="0" value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Selling Price</label>
                <input type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Cost Price</label>
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
                <label className={labelClass}>GST Rate</label>
                <select value={form.gstRate} onChange={(e) => set('gstRate', e.target.value)} className={inputClass}>
                  {[0, 5, 12, 18, 28].map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>HSN Code</label>
                <select value={form.hsnCode} onChange={(e) => set('hsnCode', e.target.value)} className={inputClass}>
                  <option value="6109">6109 - T-shirts, Singlets</option>
                  <option value="6203">6203 - Men&apos;s Trousers, Shorts</option>
                  <option value="6204">6204 - Women&apos;s Suits, Dresses</option>
                  <option value="6205">6205 - Men&apos;s Shirts</option>
                  <option value="6206">6206 - Women&apos;s Blouses</option>
                  <option value="6211">6211 - Track Suits, Kurtas</option>
                  <option value="6403">6403 - Footwear</option>
                  <option value="4202">4202 - Bags, Wallets</option>
                  <option value="9102">9102 - Watches</option>
                  <option value="7117">7117 - Jewellery</option>
                  <option value="6115">6115 - Stockings, Socks</option>
                  <option value="6110">6110 - Sweaters, Cardigans</option>
                  <option value="6201">6201 - Men&apos;s Jackets</option>
                  <option value="6202">6202 - Women&apos;s Jackets</option>
                  <option value="6102">6102 - Women&apos;s Knitted Clothing</option>
                  <option value="6101">6101 - Men&apos;s Knitted Clothing</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Variants" defaultOpen={variants.length > 0} badge={variants.length > 0 ? `${variants.length} variants` : undefined}>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Colors</label>
                {variantColors.map((c, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="color" value={c.colorHex} onChange={(e) => {
                      const next = [...variantColors]; next[i] = { ...next[i], colorHex: e.target.value }; setVariantColors(next);
                    }} className="w-10 h-9 border cursor-pointer rounded" />
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
                <label className={labelClass}>Sizes (one per line)</label>
                <textarea value={variantSizes.join('\n')} onChange={(e) => setVariantSizes(e.target.value.split('\n').filter(Boolean))} className={inputClass} rows={4} />
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
                        <td className="px-3 py-2"><div className="flex items-center gap-1">{v.colorHex && <span className="w-4 h-4 rounded-full border inline-block" style={{ backgroundColor: v.colorHex }} />}{v.color}</div></td>
                        <td className="px-3 py-2">{v.size}</td>
                        <td className="px-3 py-2"><input type="text" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} className="border px-2 py-1 text-xs w-32 rounded" /></td>
                        <td className="px-3 py-2"><input type="number" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} className="border px-2 py-1 text-xs w-20 rounded" /></td>
                        <td className="px-3 py-2"><input type="number" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} className="border px-2 py-1 text-xs w-16 rounded" /></td>
                        <td className="px-3 py-2"><input type="checkbox" checked={v.isActive} onChange={(e) => updateVariant(i, 'isActive', e.target.checked)} className="w-4 h-4" /></td>
                        <td className="px-3 py-2"><button type="button" onClick={() => removeVariant(i)} className="text-red-500"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Section>

        <Section title="Attributes" defaultOpen={Object.values(attributeValues).some(Boolean)} badge={Object.values(attributeValues).filter(Boolean).length > 0 ? `${Object.values(attributeValues).filter(Boolean).length} set` : undefined}>
          <div className="pt-4">
            {loadingAttributes ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="animate-spin" size={16} /> Loading attributes...
              </div>
            ) : !subcategoryId ? (
              <p className="text-sm text-gray-400 py-4">Select a subcategory to see attributes</p>
            ) : attributes.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No attributes defined for this subcategory</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedAttributes).map(([groupName, attrs]) => (
                  <div key={groupName} className="border rounded">
                    <button type="button" onClick={() => setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }))} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-gray-50 hover:bg-gray-100 transition-colors">
                      <span>{groupName}</span>
                      {collapsedGroups[groupName] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {!collapsedGroups[groupName] && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attrs.sort((a, b) => a.displayOrder - b.displayOrder).map((attr) => (
                          <div key={attr.id}>
                            <label className={labelClass}>{attr.name}{attr.required && requiredMark}</label>
                            {renderAttributeField(attr)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {showFabricSection && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Fabric & Material</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Fabric</label>
                    <select value={form.fabric} onChange={(e) => set('fabric', e.target.value)} className={inputClass}>
                      <option value="">Select Fabric</option>
                      {['Cotton', 'Silk', 'Polyester', 'Linen', 'Wool', 'Denim', 'Viscose', 'Rayon', 'Nylon', 'Spandex', 'Chiffon', 'Georgette', 'Crepe', 'Velvet', 'Satin', 'Modal', 'Jersey', 'Terry Cotton', 'Cotton Blend', 'Art Silk'].map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Material</label>
                    <select value={form.material} onChange={(e) => set('material', e.target.value)} className={inputClass}>
                      <option value="">Select Material</option>
                      {['Pure Cotton', 'Pure Silk', 'Art Silk', 'Polyester Blend', 'Cotton Blend', 'Rayon Blend', 'Leather', 'Faux Leather', 'Suede', 'Canvas', 'Nylon', 'Rubber', 'EVA Foam', 'Memory Foam', 'Bamboo Fiber', 'Organic Cotton', 'Recycled Polyester'].map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Wash Care</label>
                    <select value={form.washCare} onChange={(e) => set('washCare', e.target.value)} className={inputClass}>
                      <option value="">Select Wash Care</option>
                      {['Machine Wash Cold', 'Machine Wash Warm', 'Hand Wash Only', 'Dry Clean Only', 'Do Not Wash', 'Wash With Like Colors', 'Tumble Dry Low', 'Line Dry', 'Do Not Bleach', 'Do Not Iron', 'Iron Low Heat', 'Iron Medium Heat'].map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title="Inventory & Shipping">
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>SKU {requiredMark}</label><input type="text" value={form.sku} onChange={(e) => set('sku', e.target.value)} className={inputClass} required /></div>
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
                Stock is managed per-variant ({variants.length} variants). Edit stock in the Variants section above.
              </div>
            )}
            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold mb-3">Shipping Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Weight (kg)</label><input type="number" step="0.01" min="0" value={form.weight} onChange={(e) => set('weight', e.target.value)} className={inputClass} placeholder="0.5" /></div>
                <div>
                  <label className={labelClass}>Shipping Class</label>
                  <select value={form.shippingClass} onChange={(e) => set('shippingClass', e.target.value)} className={inputClass}>
                    <option value="">Standard</option>
                    <option value="heavy">Heavy/Oversized</option>
                    <option value="fragile">Fragile</option>
                    <option value="express">Express Only</option>
                  </select>
                </div>
                <div><label className={labelClass}>Length (cm)</label><input type="number" step="0.1" min="0" value={form.length} onChange={(e) => set('length', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Width (cm)</label><input type="number" step="0.1" min="0" value={form.width} onChange={(e) => set('width', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Height (cm)</label><input type="number" step="0.1" min="0" value={form.height} onChange={(e) => set('height', e.target.value)} className={inputClass} /></div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Product Images" defaultOpen={false} badge={images.length > 0 ? `${images.length} images` : undefined}>
          <div className="space-y-4 pt-4">
            <div>
              <label className={labelClass}>Paste Image URLs (one per line, then click Add)</label>
              <textarea value={bulkUrls} onChange={(e) => setBulkUrls(e.target.value)} className={inputClass} rows={5} placeholder={"https://cdn.example.com/image1.jpg\nhttps://cdn.example.com/image2.jpg\nhttps://cdn.example.com/image3.jpg"} />
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addBulkImages}><ImagePlus size={14} className="mr-1" /> Add All Images</Button>
            </div>
            {images.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">{images.length} image(s). Click star to set featured. Use arrows to reorder.</p>
                <div className="flex flex-wrap gap-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative group w-28 h-32 border overflow-hidden bg-gray-50 rounded">
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
            {images.length === 0 && <p className="text-sm text-gray-400">Paste image URLs above and click Add All Images.</p>}
          </div>
        </Section>

        <Section title="SEO (Auto-generated)" defaultOpen={false}>
          <div className="space-y-4 pt-4">
            <div className="bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 rounded mb-2">
              SEO fields are auto-filled from your product info. Edit below or leave as-is.
            </div>
            <div>
              <label className={labelClass}>SEO Title</label>
              <input type="text" value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} className={inputClass} placeholder={autoSeoTitle || "Auto-generated from product name"} />
              {!form.metaTitle && autoSeoTitle && <p className="text-xs text-gray-400 mt-1">Will use: {autoSeoTitle}</p>}
            </div>
            <div>
              <label className={labelClass}>Meta Description</label>
              <textarea value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} className={inputClass} rows={3} placeholder={autoSeoDescription || "Auto-generated from description"} />
              {!form.metaDescription && autoSeoDescription && <p className="text-xs text-gray-400 mt-1">Will use: {autoSeoDescription.slice(0, 100)}...</p>}
            </div>
            <div>
              <label className={labelClass}>Keywords</label>
              <input type="text" value={form.metaKeywords} onChange={(e) => set('metaKeywords', e.target.value)} className={inputClass} placeholder={autoSeoKeywords || "Auto-generated from tags, category, brand"} />
              {!form.metaKeywords && autoSeoKeywords && <p className="text-xs text-gray-400 mt-1">Will use: {autoSeoKeywords}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Canonical URL</label><input type="text" value={form.canonicalUrl} onChange={(e) => set('canonicalUrl', e.target.value)} className={inputClass} placeholder="https://..." /></div>
              <div><label className={labelClass}>OG Image URL</label><input type="text" value={form.ogImage} onChange={(e) => set('ogImage', e.target.value)} className={inputClass} placeholder="https://..." /></div>
            </div>
          </div>
        </Section>

        <Section title="Offers & Visibility" defaultOpen={false}>
          <div className="space-y-6 pt-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Promotions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['couponEligible', 'Coupon Eligible'],
                  ['flashSale', 'Flash Sale'],
                  ['bogo', 'Buy One Get One'],
                  ['festivalOffer', 'Festival Offer'],
                ].map(([field, label]) => (
                  <label key={field} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={!!(form as any)[field]} onChange={(e) => set(field, e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3"><label className={labelClass}>Special Discount (%)</label><input type="number" min="0" max="90" value={form.specialDiscount} onChange={(e) => set('specialDiscount', e.target.value)} className={inputClass} placeholder="Additional discount percentage" /></div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Status & Visibility</h3>
              <div className="mb-3">
                <label className={labelClass}>Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  ['isActive', 'Active'],
                  ['isFeatured', 'Featured Product'],
                  ['isNewArrival', 'New Arrival'],
                  ['isBestSeller', 'Best Seller'],
                  ['isTrending', 'Trending'],
                ].map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50 text-sm">
                    <input type="checkbox" checked={!!(form as any)[field]} onChange={(e) => set(field, e.target.checked)} className="w-4 h-4" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Return & Warranty</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 border rounded cursor-pointer">
                  <input type="checkbox" checked={form.returnAvailable} onChange={(e) => set('returnAvailable', e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm">Return Available</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded cursor-pointer">
                  <input type="checkbox" checked={form.exchangeAvailable} onChange={(e) => set('exchangeAvailable', e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm">Exchange Available</span>
                </label>
                {form.returnAvailable && (
                  <div><label className={labelClass}>Return Period (days)</label><input type="number" min="0" value={form.returnPeriod} onChange={(e) => set('returnPeriod', e.target.value)} className={inputClass} /></div>
                )}
                <div><label className={labelClass}>Warranty Period</label><select value={form.warrantyPeriod} onChange={(e) => set('warrantyPeriod', e.target.value)} className={inputClass}><option value="">No Warranty</option><option value="7 days">7 Days</option><option value="15 days">15 Days</option><option value="1 month">1 Month</option><option value="3 months">3 Months</option><option value="6 months">6 Months</option><option value="1 year">1 Year</option><option value="2 years">2 Years</option><option value="5 years">5 Years</option></select></div>
              </div>
            </div>
            <div className="border-t pt-4">
              <label className={labelClass}>Admin Notes</label>
              <textarea value={form.adminNotes} onChange={(e) => set('adminNotes', e.target.value)} className={inputClass} rows={3} placeholder="Internal notes (not visible to customers)" />
            </div>
          </div>
        </Section>
      </div>

      <div className="flex items-center justify-between mt-8">
        <Link href={`/admin/products/${id}`} className="text-sm text-gray-500 hover:text-gray-900">
          Cancel
        </Link>
        <Button type="button" onClick={handleSubmit} loading={saving} className="bg-green-600 hover:bg-green-700">
          <Save size={14} className="mr-1" /> Update Product
        </Button>
      </div>
    </div>
  );
}
