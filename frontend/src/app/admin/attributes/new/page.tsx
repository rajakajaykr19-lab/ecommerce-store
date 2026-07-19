'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { parseAttributeOptions } from '@/types';
import type { AttributeGroup } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Select (Single)' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
];

export default function AdminAttributeFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [groups, setGroups] = useState<AttributeGroup[]>([]);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  const [form, setForm] = useState({
    groupId: '',
    name: '',
    slug: '',
    fieldType: 'text',
    options: '',
    required: false,
    filterable: false,
    searchable: false,
    displayOrder: '0',
    isActive: true,
  });

  useEffect(() => { fetchGroups(); }, []);
  useEffect(() => { if (editId) fetchAttribute(); }, [editId]);

  const fetchGroups = async () => {
    try {
      const res = await api.getAttributeGroups();
      setGroups(res.data || []);
    } catch {}
  };

  const fetchAttribute = async () => {
    setLoading(true);
    try {
      const res = await api.getAttributes();
      const attr = (res.data || []).find((a: any) => a.id === editId);
      if (attr) {
        setForm({
          groupId: attr.groupId || '',
          name: attr.name || '',
          slug: attr.slug || '',
          fieldType: attr.fieldType || 'text',
          options: attr.options || '',
          required: attr.required ?? false,
          filterable: attr.filterable ?? false,
          searchable: attr.searchable ?? false,
          displayOrder: String(attr.displayOrder || 0),
          isActive: attr.isActive ?? true,
        });
        setOptions(parseAttributeOptions(attr.options));
      } else {
        toast.error('Attribute not found');
        router.push('/admin/attributes');
      }
    } catch { toast.error('Failed to load attribute'); }
    setLoading(false);
  };

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleNameChange = (name: string) => {
    set('name', name);
    if (!form.slug || form.slug === slugify(form.name)) {
      set('slug', slugify(name));
    }
  };

  const addOption = () => {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) { toast.error('Option already exists'); return; }
    const updated = [...options, trimmed];
    setOptions(updated);
    set('options', JSON.stringify(updated));
    setNewOption('');
  };

  const removeOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    set('options', JSON.stringify(updated));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.groupId) return toast.error('Please select a group');
    if ((form.fieldType === 'select' || form.fieldType === 'multiselect') && options.length === 0) {
      return toast.error('Add at least one option for select fields');
    }

    setSaving(true);
    try {
      const payload = {
        groupId: form.groupId,
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        fieldType: form.fieldType,
        options: form.fieldType === 'select' || form.fieldType === 'multiselect' ? JSON.stringify(options) : '[]',
        required: form.required,
        filterable: form.filterable,
        searchable: form.searchable,
        displayOrder: parseInt(form.displayOrder) || 0,
        isActive: form.isActive,
      };

      if (editId) {
        await api.updateAttribute(editId, payload);
        toast.success('Attribute updated');
      } else {
        await api.createAttribute(payload);
        toast.success('Attribute created');
      }
      router.push('/admin/attributes');
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const inputClass = 'w-full border px-3 py-2 text-sm outline-none focus:border-[#C9A84C]';
  const labelClass = 'block text-sm font-medium mb-1';
  const isSelect = form.fieldType === 'select' || form.fieldType === 'multiselect';

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={24} /></div>;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/attributes" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Attributes
      </Link>
      <h1 className="text-2xl font-bold mb-6">{editId ? 'Edit Attribute' : 'Create Attribute'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Attribute Name *</label>
              <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} required placeholder="e.g. Color, Size, Material" />
            </div>
            <div>
              <label className={labelClass}>Slug</label>
              <input type="text" value={form.slug} onChange={(e) => set('slug', e.target.value)} className={inputClass} placeholder="auto-generated" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Group *</label>
              <select value={form.groupId} onChange={(e) => set('groupId', e.target.value)} className={inputClass} required>
                <option value="">Select a group</option>
                {groups.filter((g) => g.isActive).map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Field Type *</label>
              <select value={form.fieldType} onChange={(e) => set('fieldType', e.target.value)} className={inputClass}>
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Display Order</label>
            <input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} className="w-32 border px-3 py-2 text-sm outline-none" min="0" />
          </div>

          {isSelect && (
            <div>
              <label className={labelClass}>Options *</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                  className="flex-1 border px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
                  placeholder="Type an option and press Add"
                />
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus size={14} /> Add
                </Button>
              </div>
              {options.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {options.map((opt, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 text-xs">
                      {opt}
                      <button type="button" onClick={() => removeOption(i)} className="text-gray-400 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No options added yet</p>
              )}
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <label className="block text-sm font-medium">Properties</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.required} onChange={(e) => set('required', e.target.checked)} className="w-4 h-4 accent-[#C9A84C]" />
                Required
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.filterable} onChange={(e) => set('filterable', e.target.checked)} className="w-4 h-4 accent-[#C9A84C]" />
                Filterable
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.searchable} onChange={(e) => set('searchable', e.target.checked)} className="w-4 h-4 accent-[#C9A84C]" />
                Searchable
              </label>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-4 h-4 accent-[#C9A84C]" />
              Active
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={saving} className="bg-[#C9A84C] text-black hover:bg-[#b8943f] border-transparent">{editId ? 'Update Attribute' : 'Create Attribute'}</Button>
          <Link href="/admin/attributes"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
