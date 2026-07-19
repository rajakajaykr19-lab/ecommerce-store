'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { buildCategoryOptions, isClothingCategory, isBabyCategory, type CategoryItem } from '@/lib/utils';
import { parseAttributeOptions, type Attribute } from '@/types';
import { ArrowLeft, ArrowRight, Loader2, X, Check, ChevronDown, ChevronRight, Plus, Trash2, GripVertical, Eye, Save } from 'lucide-react';
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
  color: string; colorHex: string; size: string; sku: string; barcode: string; price: string; stock: string; weight: string;
}

export default function AdminCreateProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: '', description: '', shortDescription: '', slug: '', tags: '', adminNotes: '',
    status: 'PUBLISHED', categoryId: '', brandId: '', gender: '',
    basePrice: '', salePrice: '', costPrice: '',
    sku: '', barcode: '', stock: '0', lowStockThreshold: '10',
    hsnCode: '6109', gstRate: '18',
    fabric: '', material: '', washCare: '',
    weight: '', length: '', width: '', height: '', shippingClass: '',
    metaTitle: '', metaDescription: '', metaKeywords: '',
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
    Promise.all([
      api.getAdminCategories().catch(() => ({ data: [] })),
      api.getAdminBrands().catch(() => ({ data: [] })),
    ]).then(([catRes, brandRes]: any) => {
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
    });
  }, []);

  useEffect(() => {
    if (!form.categoryId) {
      setSubcategories([]);
      setSubcategoryId('');
      setAttributes([]);
      setAttributeValues({});
      setDescriptionTemplates([]);
      return;
    }
    const children = categories.filter((c: any) => c.parentId === form.categoryId);
    setSubcategories(children);
    if (children.length > 0) {
      setSubcategoryId('');
      setAttributes([]);
      setAttributeValues({});
    } else {
      const selected = categories.find((c: any) => c.id === form.categoryId);
      if (selected?.parentId) {
        setSubcategoryId(form.categoryId);
      } else {
        setSubcategoryId('');
        setAttributes([]);
        setAttributeValues({});
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
        const vals: Record<string, string> = {};
        attrs.forEach((a) => { vals[a.id] = ''; });
        setAttributeValues(vals);
      })
      .catch(() => { setAttributes([]); setAttributeValues({}); })
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

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleNameChange = (name: string) => {
    set('name', name);
    if (!slugManuallyEdited) {
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
    const urls = bulkUrls.split('\n').map((u) => u.trim()).filter((u) => u && (u.startsWith('http://') || u.startsWith('https://')) && !images.includes(u));
    if (urls.length === 0) { toast.error('No valid URLs found'); return; }
    setImages([...images, ...urls]);
    setBulkUrls('');
    toast.success(`${urls.length} image(s) added`);
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
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
          stock: '0', weight: form.weight || '',
        });
      }
    }
    setVariants(rows);
    toast.success(`${rows.length} variants generated`);
  };

  const updateVariant = (idx: number, field: keyof VariantRow, value: string) => {
    setVariants((prev) => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const removeVariant = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!form.name || !form.sku || !form.basePrice || !form.categoryId) {
      toast.error('Name, SKU, Price and Category are required');
      return;
    }
    if (images.length === 0) {
      toast.error('At least one image is required');
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
        gstRate: parseFloat(form.gstRate),
        weight: form.weight ? parseFloat(form.weight) : undefined,
        length: form.length ? parseFloat(form.length) : undefined,
        width: form.width ? parseFloat(form.width) : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        returnPeriod: parseInt(form.returnPeriod) || 30,
        specialDiscount: form.specialDiscount ? parseFloat(form.specialDiscount) : undefined,
        images: images.map((url, i) => ({ url, isPrimary: i === primaryImageIdx, displayOrder: i })),
        variants: variants.map((v) => ({ size: v.size || undefined, color: v.color || undefined, colorHex: v.colorHex || undefined, sku: v.sku, barcode: v.barcode || undefined, price: v.price ? parseFloat(v.price) : undefined, stock: parseInt(v.stock) || 0, weight: v.weight ? parseFloat(v.weight) : undefined })),
        attributes: Object.entries(attributeValues).filter(([, v]) => v.trim() !== '').map(([attributeId, value]) => ({ attributeId, value })),
      };
      await api.createProduct(payload);
      toast.success('Product created successfully');
      router.push('/admin/products');
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
      case 1: return form.categoryId && form.brandId;
      case 2: return form.name.trim().length > 0;
      case 3: return parseFloat(form.basePrice) > 0 && (!form.salePrice || parseFloat(form.salePrice) <= parseFloat(form.basePrice));
      default: return true;
    }
  };

  return (
    <div className="max-w-5xl">
      <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Products
      </Link>

      {/* Progress Bar */}
      <div className="bg-white border p-4 mb-6 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => s.id <= step && setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  s.id === step ? 'bg-[#1a1a2e] text-white' :
                  s.id < step ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                } ${s.id <= step ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {s.id < step ? <Check size={12} /> : s.id}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`w-4 h-px mx-1 ${s.id < step ? 'bg-green-300' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-6">Create Product - Step {step}: {STEPS[step - 1].label}</h1>

      <div className="space-y-6">
        {/* STEP 1: Category */}
        {step === 1 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Select Category, Subcategory & Brand</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category {requiredMark}</label>
                <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={inputClass} required>
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
                    <option value="">All / None</option>
                    {subcategories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>Brand {requiredMark}</label>
                <select value={form.brandId} onChange={(e) => set('brandId', e.target.value)} className={inputClass} required>
                  <option value="">Select Brand</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputClass}>
                  <option value="">Select Gender</option>
                  <option value="MEN">Men</option>
                  <option value="WOMEN">Women</option>
                  <option value="KIDS">Kids</option>
                  <option value="UNISEX">Unisex</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Basic Info */}
        {step === 2 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <div>
              <label className={labelClass}>Product Name {requiredMark}</label>
              <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} required placeholder="e.g. Premium Cotton Slim Fit T-Shirt" />
            </div>
            <div>
              <label className={labelClass}>Slug</label>
              <input type="text" value={form.slug} onChange={(e) => { set('slug', e.target.value); setSlugManuallyEdited(true); }} className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">Auto-generated from name. Edit if needed.</p>
            </div>
            <div>
              <label className={labelClass}>Short Description</label>
              <input type="text" value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} className={inputClass} placeholder="Brief one-liner for product cards" />
            </div>
            <div>
              <label className={labelClass}>Description Template</label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2"><Loader2 className="animate-spin" size={14} /> Loading...</div>
              ) : descriptionTemplates.length > 0 ? (
                <select value="" onChange={(e) => { const t = descriptionTemplates.find((t: any) => t.id === e.target.value); if (t) set('description', t.description); }} className={inputClass}>
                  <option value="">Select a template...</option>
                  {descriptionTemplates.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              ) : <p className="text-sm text-gray-400 py-2">No templates for this category.</p>}
            </div>
            <div>
              <label className={labelClass}>Full Description {requiredMark}</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={inputClass} rows={6} placeholder="Detailed product description..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tags</label>
                <input type="text" value={form.tags} onChange={(e) => set('tags', e.target.value)} className={inputClass} placeholder="e.g. summer, cotton, casual (comma separated)" />
              </div>
              <div>
                <label className={labelClass}>Admin Notes</label>
                <input type="text" value={form.adminNotes} onChange={(e) => set('adminNotes', e.target.value)} className={inputClass} placeholder="Internal notes (not visible to customers)" />
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
                <label className={labelClass}>MRP (Base Price) {requiredMark}</label>
                <input type="number" step="0.01" min="0" value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} className={inputClass} required placeholder="e.g. 1999" />
              </div>
              <div>
                <label className={labelClass}>Selling Price (Sale Price)</label>
                <input type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} className={inputClass} placeholder="e.g. 1499" />
              </div>
              <div>
                <label className={labelClass}>Cost Price</label>
                <input type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} className={inputClass} placeholder="Internal cost" />
              </div>
            </div>
            {discountPercent > 0 && (
              <div className="bg-green-50 border border-green-200 p-3 text-sm text-green-700 rounded">
                Discount: <strong>{discountPercent}% off</strong> - Customer pays <strong>₹{parseFloat(form.salePrice || '0').toLocaleString('en-IN')}</strong> (save ₹{(parseFloat(form.basePrice) - parseFloat(form.salePrice)).toLocaleString('en-IN')})
              </div>
            )}
            {form.salePrice && parseFloat(form.salePrice) > parseFloat(form.basePrice) && parseFloat(form.basePrice) > 0 && (
              <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700 rounded">
                Selling price cannot be greater than MRP
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>GST Rate (%)</label>
                <select value={form.gstRate} onChange={(e) => set('gstRate', e.target.value)} className={inputClass}>
                  {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>HSN Code</label>
                <input type="text" value={form.hsnCode} onChange={(e) => set('hsnCode', e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Variants */}
        {step === 4 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Product Variants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Colors (one per line)</label>
                <div className="space-y-2">
                  {variantColors.map((c, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="color" value={c.colorHex} onChange={(e) => { const newColors = [...variantColors]; newColors[i].colorHex = e.target.value; setVariantColors(newColors); }} className="w-10 h-9 border cursor-pointer" />
                      <input type="text" value={c.color} onChange={(e) => { const newColors = [...variantColors]; newColors[i].color = e.target.value; setVariantColors(newColors); }} className={inputClass} placeholder="Color name" />
                      {variantColors.length > 1 && <button type="button" onClick={() => setVariantColors(variantColors.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 size={14} /></button>}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setVariantColors([...variantColors, { color: '', colorHex: '#000000' }])}><Plus size={14} /> Add Color</Button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Sizes (one per line)</label>
                <textarea value={variantSizes.join('\n')} onChange={(e) => setVariantSizes(e.target.value.split('\n').filter(Boolean))} className={inputClass} rows={4} placeholder="S&#10;M&#10;L&#10;XL" />
              </div>
            </div>
            <Button type="button" onClick={generateVariants} className="bg-[#1a1a2e] hover:bg-[#16213e]"><Plus size={14} className="mr-1" /> Generate Variants</Button>
            {variants.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Color</th>
                      <th className="p-2 text-left">Size</th>
                      <th className="p-2 text-left">SKU</th>
                      <th className="p-2 text-left">Price</th>
                      <th className="p-2 text-left">Stock</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2"><div className="flex items-center gap-1">{v.colorHex && <span className="w-4 h-4 rounded-full border inline-block" style={{ backgroundColor: v.colorHex }} />}{v.color}</div></td>
                        <td className="p-2">{v.size}</td>
                        <td className="p-2"><input type="text" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} className="border px-2 py-1 text-xs w-32" /></td>
                        <td className="p-2"><input type="number" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} className="border px-2 py-1 text-xs w-20" /></td>
                        <td className="p-2"><input type="number" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} className="border px-2 py-1 text-xs w-16" /></td>
                        <td className="p-2"><button type="button" onClick={() => removeVariant(i)} className="text-red-500"><Trash2 size={14} /></button></td>
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
          <div className="bg-white border p-6">
            <h2 className="text-lg font-semibold mb-4">Category-Specific Attributes</h2>
            {loadingAttributes ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4"><Loader2 className="animate-spin" size={16} /> Loading attributes...</div>
            ) : attributes.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No attributes defined for this category/subcategory.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedAttributes).map(([groupName, attrs]) => (
                  <div key={groupName} className="border rounded">
                    <button type="button" onClick={() => setCollapsedGroups((p) => ({ ...p, [groupName]: !p[groupName] }))} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-gray-50 hover:bg-gray-100">
                      <span>{groupName}</span>
                      {collapsedGroups[groupName] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {!collapsedGroups[groupName] && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attrs.sort((a, b) => a.displayOrder - b.displayOrder).map((attr) => (
                          <div key={attr.id}>
                            <label className={labelClass}>{attr.name}{attr.required && requiredMark}</label>
                            {attr.fieldType === 'text' && <input type="text" value={attributeValues[attr.id] || ''} onChange={(e) => setAttributeValues((p) => ({ ...p, [attr.id]: e.target.value }))} className={inputClass} />}
                            {attr.fieldType === 'textarea' && <textarea value={attributeValues[attr.id] || ''} onChange={(e) => setAttributeValues((p) => ({ ...p, [attr.id]: e.target.value }))} className={inputClass} rows={2} />}
                            {attr.fieldType === 'number' && <input type="number" value={attributeValues[attr.id] || ''} onChange={(e) => setAttributeValues((p) => ({ ...p, [attr.id]: e.target.value }))} className={inputClass} />}
                            {attr.fieldType === 'select' && (
                              <select value={attributeValues[attr.id] || ''} onChange={(e) => setAttributeValues((p) => ({ ...p, [attr.id]: e.target.value }))} className={inputClass}>
                                <option value="">Select {attr.name}</option>
                                {parseAttributeOptions(attr.options).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
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
                                        setAttributeValues((p) => ({ ...p, [attr.id]: (selected ? current.filter((v) => v !== opt) : [...current, opt]).join(',') }));
                                      }} className="w-3.5 h-3.5" />
                                      {opt}
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                            {attr.fieldType === 'boolean' && (
                              <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                                <input type="checkbox" checked={attributeValues[attr.id] === 'true'} onChange={(e) => setAttributeValues((p) => ({ ...p, [attr.id]: e.target.checked ? 'true' : 'false' }))} className="w-4 h-4" />
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
            {showFabricSection && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Fabric & Material</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className={labelClass}>Fabric</label><input type="text" value={form.fabric} onChange={(e) => set('fabric', e.target.value)} className={inputClass} placeholder="e.g. Cotton, Silk" /></div>
                  <div><label className={labelClass}>Material</label><input type="text" value={form.material} onChange={(e) => set('material', e.target.value)} className={inputClass} placeholder="e.g. Pure Cotton" /></div>
                  <div><label className={labelClass}>Wash Care</label><input type="text" value={form.washCare} onChange={(e) => set('washCare', e.target.value)} className={inputClass} placeholder="e.g. Machine wash" /></div>
                </div>
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
              <div><label className={labelClass}>Barcode</label><input type="text" value={form.barcode || ''} onChange={(e) => set('barcode' as any, e.target.value)} className={inputClass} placeholder="EAN/UPC barcode" /></div>
            </div>
            {variants.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>Stock Quantity</label><input type="number" min="0" value={form.stock || ''} onChange={(e) => set('stock', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Low Stock Alert</label><input type="number" min="0" value={form.lowStockThreshold || '10'} onChange={(e) => set('lowStockThreshold', e.target.value)} className={inputClass} /></div>
              </div>
            )}
            {variants.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 rounded">
                Stock is managed per-variant ({variants.length} variants). Edit stock in the Variants table above.
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
            <div><label className={labelClass}>SEO Title</label><input type="text" value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} className={inputClass} placeholder="Custom title for search engines" /></div>
            <div><label className={labelClass}>Meta Description</label><textarea value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} className={inputClass} rows={3} placeholder="Description for search results" /></div>
            <div><label className={labelClass}>Keywords</label><input type="text" value={form.metaKeywords} onChange={(e) => set('metaKeywords', e.target.value)} className={inputClass} placeholder="keyword1, keyword2, keyword3" /></div>
          </div>
        )}

        {/* STEP 10: Offers */}
        {step === 10 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Offers & Promotions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div><label className={labelClass}>Special Discount (%)</label><input type="number" min="0" max="90" value={form.specialDiscount} onChange={(e) => set('specialDiscount', e.target.value)} className={inputClass} placeholder="Additional discount percentage" /></div>
          </div>
        )}

        {/* STEP 11: Visibility */}
        {step === 11 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Visibility & Flags</h2>
            <div><label className={labelClass}>Status</label>
              <div className="flex gap-3">
                {[['PUBLISHED', 'Published'], ['DRAFT', 'Draft'], ['HIDDEN', 'Hidden']].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 px-4 py-2 border rounded cursor-pointer text-sm">
                    <input type="radio" name="status" value={val} checked={form.status === val} onChange={(e) => set('status', e.target.value)} />
                    {label}
                  </label>
                ))}
              </div>
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
        )}

        {/* STEP 12: Returns */}
        {step === 12 && (
          <div className="bg-white border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Return & Warranty</h2>
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
              <div><label className={labelClass}>Warranty Period</label><input type="text" value={form.warrantyPeriod} onChange={(e) => set('warrantyPeriod', e.target.value)} className={inputClass} placeholder="e.g. 6 months, 1 year" /></div>
            </div>
          </div>
        )}

        {/* STEP 13: Review & Publish */}
        {step === 13 && (
          <div className="bg-white border p-6 space-y-6">
            <h2 className="text-lg font-semibold">Review & Publish</h2>

            {/* Product Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Product Info</h3>
                <div className="text-sm"><span className="text-gray-400">Name:</span> <span className="font-medium">{form.name || '—'}</span></div>
                <div className="text-sm"><span className="text-gray-400">SKU:</span> <span className="font-medium">{form.sku || '—'}</span></div>
                <div className="text-sm"><span className="text-gray-400">Status:</span> <span className={`px-2 py-0.5 text-xs ${form.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : form.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{form.status}</span></div>
                <div className="text-sm"><span className="text-gray-400">Category:</span> {categories.find((c) => c.id === form.categoryId)?.name || '—'}</div>
                <div className="text-sm"><span className="text-gray-400">Brand:</span> {brands.find((b) => b.id === form.brandId)?.name || '—'}</div>
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

            {/* Flags */}
            <div className="flex flex-wrap gap-2">
              {form.isFeatured && <span className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700">Featured</span>}
              {form.isNewArrival && <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700">New Arrival</span>}
              {form.isBestSeller && <span className="px-2 py-1 text-xs bg-purple-50 text-purple-700">Best Seller</span>}
              {form.isTrending && <span className="px-2 py-1 text-xs bg-orange-50 text-orange-700">Trending</span>}
              {form.flashSale && <span className="px-2 py-1 text-xs bg-red-50 text-red-700">Flash Sale</span>}
              {form.bogo && <span className="px-2 py-1 text-xs bg-pink-50 text-pink-700">BOGO</span>}
            </div>

            {/* Validation */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase">Validation</h3>
              {[
                [!!form.name, 'Product Name'],
                [!!form.categoryId, 'Category'],
                [!!form.brandId, 'Brand'],
                [parseFloat(form.basePrice) > 0, 'MRP > 0'],
                [!form.salePrice || parseFloat(form.salePrice) <= parseFloat(form.basePrice), 'Sale Price valid'],
                [!!form.sku, 'SKU'],
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
            <Save size={14} className="mr-1" /> Publish Product
          </Button>
        )}
      </div>
    </div>
  );
}
