'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { AttributeGroup } from '@/types';
import Link from 'next/link';
import { Plus, Loader2, ArrowLeft, Pencil, Trash2, X, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminAttributeGroupsPage() {
  const [groups, setGroups] = useState<AttributeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AttributeGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    displayOrder: '0',
    isActive: true,
  });

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.getAttributeGroups();
      setGroups(res.data || []);
    } catch { setGroups([]); }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', displayOrder: String(groups.length), isActive: true });
    setShowModal(true);
  };

  const openEditModal = (group: AttributeGroup) => {
    setEditing(group);
    setForm({
      name: group.name,
      slug: group.slug,
      description: group.description || '',
      displayOrder: String(group.displayOrder),
      isActive: group.isActive,
    });
    setShowModal(true);
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: !prev.slug || prev.slug === slugify(prev.name) ? slugify(name) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        description: form.description || undefined,
        displayOrder: parseInt(form.displayOrder) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        await api.updateAttributeGroup(editing.id, payload);
        toast.success('Group updated');
      } else {
        await api.createAttributeGroup(payload);
        toast.success('Group created');
      }
      setShowModal(false);
      fetchGroups();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete group "${name}"? Attributes in this group will not be deleted.`)) return;
    try {
      await api.deleteAttributeGroup(id);
      toast.success('Group deleted');
      fetchGroups();
    } catch (err: any) { toast.error(err.message); }
  };

  const inputClass = 'w-full border px-3 py-2 text-sm outline-none focus:border-[#C9A84C]';
  const labelClass = 'block text-sm font-medium mb-1';

  return (
    <div>
      <Link href="/admin/attributes" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Attributes
      </Link>

      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Attribute Groups</h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-[#C9A84C] text-black px-6 py-2 text-sm font-semibold hover:bg-[#b8943f] transition-all"
        >
          <Plus size={16} /> Add Group
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={24} /></div>
      ) : groups.length === 0 ? (
        <div className="bg-white border p-12 text-center text-gray-400">
          <p className="text-lg font-medium mb-1">No attribute groups</p>
          <p className="text-sm">Create a group to organize your attributes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-white border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-gray-300" />
                  <div>
                    <h3 className="font-semibold text-sm">{group.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{group.slug}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs ${group.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {group.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {group.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{group.description}</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {group._count?.attributes || 0} attribute{(group._count?.attributes || 0) !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-400">Order: {group.displayOrder}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => openEditModal(group)} className="text-blue-600 hover:text-blue-800" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(group.id, group.name)} className="text-red-600 hover:text-red-800" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{editing ? 'Edit Group' : 'Create Group'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Name *</label>
                <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Slug</label>
                <input type="text" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} className={inputClass} placeholder="auto-generated" />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className={inputClass} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Display Order</label>
                  <input type="number" value={form.displayOrder} onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: e.target.value }))} className={inputClass} min="0" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} className="w-4 h-4" />
                    Active
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={saving}>{editing ? 'Update Group' : 'Create Group'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
