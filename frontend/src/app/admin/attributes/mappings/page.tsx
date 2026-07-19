'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { Attribute, AttributeGroup, SubcategoryAttribute } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronRight, ChevronDown, Save, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children?: CategoryNode[];
}

interface MappedAttr {
  attributeId: string;
  required: boolean;
  displayOrder: number;
}

function buildTree(categories: { id: string; name: string; slug: string; parentId?: string }[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];
  categories.forEach((c) => map.set(c.id, { ...c, children: [] }));
  categories.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export default function AdminAttributeMappingsPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [allAttributes, setAllAttributes] = useState<Attribute[]>([]);
  const [groups, setGroups] = useState<AttributeGroup[]>([]);
  const [allSubcategoryAttrs, setAllSubcategoryAttrs] = useState<Record<string, SubcategoryAttribute[]>>({});
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedSubName, setSelectedSubName] = useState('');
  const [mappings, setMappings] = useState<MappedAttr[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, attrRes, groupRes, subAttrRes] = await Promise.all([
        api.getAdminCategories(),
        api.getAttributes(),
        api.getAttributeGroups(),
        api.getAllSubcategoryAttributes(),
      ]);
      const allCats = catRes.data || [];
      setCategories(buildTree(allCats));
      setAllAttributes(attrRes.data || []);
      setGroups(groupRes.data || []);

      const subAttrMap: Record<string, SubcategoryAttribute[]> = {};
      (subAttrRes.data || []).forEach((sa: SubcategoryAttribute) => {
        if (!subAttrMap[sa.subcategoryId]) subAttrMap[sa.subcategoryId] = [];
        subAttrMap[sa.subcategoryId].push(sa);
      });
      setAllSubcategoryAttrs(subAttrMap);
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  };

  const loadSubcategory = async (subId: string, subName: string) => {
    setSelectedSubId(subId);
    setSelectedSubName(subName);
    const existing = allSubcategoryAttrs[subId] || [];
    setMappings(existing.map((sa) => ({
      attributeId: sa.attributeId,
      required: sa.required,
      displayOrder: sa.displayOrder,
    })));
  };

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const isMapped = (attrId: string) => mappings.some((m) => m.attributeId === attrId);

  const toggleAttribute = (attrId: string) => {
    setMappings((prev) => {
      if (prev.some((m) => m.attributeId === attrId)) {
        return prev.filter((m) => m.attributeId !== attrId);
      }
      return [...prev, { attributeId: attrId, required: false, displayOrder: prev.length }];
    });
  };

  const toggleRequired = (attrId: string) => {
    setMappings((prev) => prev.map((m) => m.attributeId === attrId ? { ...m, required: !m.required } : m));
  };

  const handleSave = async () => {
    if (!selectedSubId) return;
    setSaving(true);
    try {
      await api.setSubcategoryAttributes(selectedSubId, mappings);
      toast.success('Mappings saved');
      const subAttrRes = await api.getAllSubcategoryAttributes();
      const subAttrMap: Record<string, SubcategoryAttribute[]> = {};
      (subAttrRes.data || []).forEach((sa: SubcategoryAttribute) => {
        if (!subAttrMap[sa.subcategoryId]) subAttrMap[sa.subcategoryId] = [];
        subAttrMap[sa.subcategoryId].push(sa);
      });
      setAllSubcategoryAttrs(subAttrMap);
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const attrMap = new Map(allAttributes.map((a) => [a.id, a]));
  const groupedAttrs = groups.map((g) => ({
    ...g,
    attributes: allAttributes.filter((a) => a.groupId === g.id),
  }));

  const renderCategoryTree = (nodes: CategoryNode[], depth: number = 0) => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedCats.has(node.id);
      const subcategories = node.children || [];
      const mappedCount = (sub: string) => (allSubcategoryAttrs[sub] || []).length;

      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            onClick={() => hasChildren && toggleExpand(node.id)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />
            ) : (
              <span className="w-3.5 shrink-0" />
            )}
            <FolderOpen size={14} className="text-gray-400 shrink-0" />
            <span className="truncate">{node.name}</span>
          </div>
          {isExpanded && subcategories.length > 0 && (
            <div>
              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => loadSubcategory(sub.id, sub.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                    selectedSubId === sub.id
                      ? 'bg-[#C9A84C]/10 text-[#C9A84C] font-medium border-r-2 border-[#C9A84C]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
                >
                  <span className="truncate">{sub.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 ${
                    mappedCount(sub.id) > 0 ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {mappedCount(sub.id)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={24} /></div>;

  return (
    <div>
      <Link href="/admin/attributes" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Attributes
      </Link>
      <h1 className="text-2xl font-bold mb-6">Map Attributes to Subcategories</h1>

      <div className="flex flex-col lg:flex-row gap-0 bg-white border min-h-[600px]">
        <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r overflow-y-auto max-h-[70vh]">
          <div className="p-3 border-b bg-gray-50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Categories</p>
          </div>
          {renderCategoryTree(categories)}
        </div>

        <div className="flex-1 overflow-y-auto max-h-[70vh]">
          {!selectedSubId ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <FolderOpen size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">Select a subcategory</p>
              <p className="text-sm text-center">Choose a subcategory from the tree to manage its attribute mappings.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold">{selectedSubName}</h2>
                  <p className="text-xs text-gray-400 mt-1">{mappings.length} attribute{mappings.length !== 1 ? 's' : ''} mapped</p>
                </div>
                <Button onClick={handleSave} loading={saving} className="bg-[#C9A84C] text-black hover:bg-[#b8943f] border-transparent">
                  <Save size={14} className="mr-2" /> Save Mappings
                </Button>
              </div>

              {groupedAttrs.map((group) => (
                <div key={group.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">{group.name}</h3>
                    <span className="text-xs text-gray-400">({group.attributes.length})</span>
                  </div>
                  {group.attributes.length === 0 ? (
                    <p className="text-xs text-gray-400 pl-3">No attributes in this group</p>
                  ) : (
                    <div className="space-y-1">
                      {group.attributes.map((attr) => {
                        const mapped = isMapped(attr.id);
                        const mapping = mappings.find((m) => m.attributeId === attr.id);
                        return (
                          <div
                            key={attr.id}
                            className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                              mapped ? 'bg-[#C9A84C]/5' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={mapped}
                                onChange={() => toggleAttribute(attr.id)}
                                className="w-4 h-4 accent-[#C9A84C]"
                              />
                              <div>
                                <span className={`${mapped ? 'font-medium' : 'text-gray-700'}`}>{attr.name}</span>
                                <span className="text-xs text-gray-400 ml-2 font-mono">{attr.fieldType}</span>
                              </div>
                            </div>
                            {mapped && (
                              <label className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={mapping?.required || false}
                                  onChange={() => toggleRequired(attr.id)}
                                  className="w-3.5 h-3.5 accent-[#C9A84C]"
                                />
                                <span className="text-gray-500">Required</span>
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
