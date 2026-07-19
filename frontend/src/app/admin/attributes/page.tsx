'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { parseAttributeOptions } from '@/types';
import type { Attribute, AttributeGroup } from '@/types';
import Link from 'next/link';
import { Plus, Loader2, Search, Trash2, Pencil, ToggleLeft, ToggleRight, Settings, LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [groups, setGroups] = useState<AttributeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState('');

  useEffect(() => { fetchGroups(); }, []);
  useEffect(() => { fetchAttributes(); }, [groupId]);

  const fetchGroups = async () => {
    try {
      const res = await api.getAttributeGroups();
      setGroups(res.data || []);
    } catch {}
  };

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const res = await api.getAttributes(groupId || undefined);
      setAttributes(res.data || []);
    } catch { setAttributes([]); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attribute? This action cannot be undone.')) return;
    try {
      await api.deleteAttribute(id);
      toast.success('Attribute deleted');
      fetchAttributes();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleToggleActive = async (attr: Attribute) => {
    try {
      await api.updateAttribute(attr.id, { isActive: !attr.isActive });
      toast.success(`Attribute ${attr.isActive ? 'deactivated' : 'activated'}`);
      fetchAttributes();
    } catch (err: any) { toast.error(err.message); }
  };

  const fieldTypeLabel: Record<string, string> = {
    text: 'Text',
    textarea: 'Text Area',
    select: 'Select',
    multiselect: 'Multi Select',
    number: 'Number',
    boolean: 'Boolean',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Attribute Management</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/admin/attributes/groups" className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all">
            <Settings size={14} /> Manage Groups
          </Link>
          <Link href="/admin/attributes/mappings" className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 text-sm font-medium hover:border-[#C9A84C] hover:text-[#C9A84C] transition-all">
            <LinkIcon size={14} /> Map to Subcategories
          </Link>
          <Link href="/admin/attributes/new" className="inline-flex items-center gap-2 bg-[#C9A84C] text-black px-6 py-2 text-sm font-semibold hover:bg-[#b8943f] transition-all">
            <Plus size={16} /> Add Attribute
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Filter by Group</label>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="w-full sm:w-72 border px-3 py-2 text-sm outline-none"
        >
          <option value="">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Group</th>
              <th className="text-left p-4 font-medium">Type</th>
              <th className="text-left p-4 font-medium hidden md:table-cell">Required</th>
              <th className="text-left p-4 font-medium hidden lg:table-cell">Filterable</th>
              <th className="text-left p-4 font-medium hidden lg:table-cell">Searchable</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-12 text-center"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
            ) : attributes.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <div className="text-gray-400">
                    <p className="text-lg font-medium mb-1">No attributes found</p>
                    <p className="text-sm">{groupId ? 'No attributes in this group. Try selecting a different group.' : 'Create your first attribute to get started.'}</p>
                    {!groupId && (
                      <Link href="/admin/attributes/new" className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-[#C9A84C] hover:underline">
                        <Plus size={14} /> Add Attribute
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              attributes.map((attr) => (
                <tr key={attr.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-medium">{attr.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{attr.slug}</p>
                    {attr.fieldType === 'select' || attr.fieldType === 'multiselect' ? (
                      <p className="text-xs text-gray-400 mt-1">Options: {parseAttributeOptions(attr.options).join(', ')}</p>
                    ) : null}
                  </td>
                  <td className="p-4">
                    {attr.group ? (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700">{attr.group.name}</span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-xs">{fieldTypeLabel[attr.fieldType] || attr.fieldType}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    {attr.required ? (
                      <span className="text-xs text-amber-600 font-medium">Required</span>
                    ) : (
                      <span className="text-xs text-gray-400">Optional</span>
                    )}
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    {attr.filterable ? (
                      <span className="text-xs text-green-600">Yes</span>
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    {attr.searchable ? (
                      <span className="text-xs text-green-600">Yes</span>
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleToggleActive(attr)} className="flex items-center gap-1" title={attr.isActive ? 'Deactivate' : 'Activate'}>
                      {attr.isActive ? (
                        <><ToggleRight size={18} className="text-green-600" /><span className="text-xs text-green-700 bg-green-50 px-2 py-0.5">Active</span></>
                      ) : (
                        <><ToggleLeft size={18} className="text-red-600" /><span className="text-xs text-red-700 bg-red-50 px-2 py-0.5">Inactive</span></>
                      )}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 items-center">
                      <Link href={`/admin/attributes/new?id=${attr.id}`} className="text-blue-600 hover:text-blue-800" title="Edit">
                        <Pencil size={14} />
                      </Link>
                      <button onClick={() => handleDelete(attr.id)} className="text-red-600 hover:text-red-800" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {attributes.length > 0 && (
        <p className="text-xs text-gray-400 mt-4">{attributes.length} attribute{attributes.length !== 1 ? 's' : ''} total</p>
      )}
    </div>
  );
}
