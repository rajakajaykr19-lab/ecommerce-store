'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Category, CategoryDashboardStats } from '@/types';
import toast from 'react-hot-toast';
import {
  FolderTree, Plus, Search, ChevronDown, ChevronRight,
  MoreHorizontal, Edit, Trash2, Eye, EyeOff, Copy,
  Package, Star, X, Layers, Calendar, AlertTriangle,
  CheckCircle2, RefreshCw,
} from 'lucide-react';

type SortField = 'name' | 'products' | 'createdAt' | 'displayOrder';
type SortOrder = 'asc' | 'desc';
type CardFilter = 'all' | 'parent' | 'subcategory' | 'active' | 'hidden' | 'withProducts' | 'empty' | 'thisMonth';

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);
  return value;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-gray-200" />
        <div className="h-7 w-12 bg-gray-200 rounded" />
      </div>
      <div className="mt-3">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-32 bg-gray-100 rounded mt-1.5" />
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<CategoryDashboardStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('displayOrder');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [cardFilter, setCardFilter] = useState<CardFilter>('all');

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.getCategoryDashboardStats();
      setStats(res.data || res);
    } catch { /* stats will stay null */ }
    setStatsLoading(false);
  }, []);

  const fetchCategories = useCallback(async (filter?: CardFilter, searchTerm?: string) => {
    try {
      const params: Record<string, string> = { limit: '500' };
      if (filter && filter !== 'all') params.dashboardFilter = filter;
      if (searchTerm) params.search = searchTerm;
      if (sortField) params.sort = sortField;
      if (sortOrder) params.order = sortOrder;
      const res = await api.getAdminCategories(params);
      setCategories(res.data || res || []);
    } catch {
      toast.error('Failed to load categories');
    }
  }, [sortField, sortOrder]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setStatsLoading(true);
    await Promise.allSettled([fetchCategories(cardFilter, search), fetchStats()]);
    setLoading(false);
  }, [fetchCategories, fetchStats, cardFilter, search]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    fetchCategories(cardFilter, search);
  }, [cardFilter, sortField, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) { toast.error('Select categories first'); return; }
    if (action === 'delete' && !confirm(`Delete ${selectedIds.size} category(ies)?`)) return;
    try {
      await api.bulkCategoryOperations({ action, categoryIds: Array.from(selectedIds) });
      toast.success(`${selectedIds.size} category(ies) ${action === 'delete' ? 'deleted' : 'updated'}`);
      setSelectedIds(new Set());
      loadData();
    } catch (err: any) { toast.error(err.message || 'Action failed'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCategory(id);
      toast.success('Category deleted');
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) { toast.error(err.message || 'Delete failed'); }
  };

  const handleDuplicate = async (id: string) => {
    try { await api.duplicateCategory(id); toast.success('Category duplicated'); loadData(); }
    catch (err: any) { toast.error(err.message || 'Duplicate failed'); }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await api.updateCategory(cat.id, { isActive: !cat.isActive });
      toast.success(cat.isActive ? 'Category hidden' : 'Category published');
      loadData();
    } catch (err: any) { toast.error(err.message || 'Update failed'); }
  };

  const buildTree = (cats: Category[], parentId: string | null = null): Category[] =>
    cats.filter(c => c.parentId === parentId).sort((a, b) => a.displayOrder - b.displayOrder);

  const showTree = cardFilter === 'all' || cardFilter === 'parent';
  const topLevel = showTree ? buildTree(categories) : [];

  const setCardFilterAndScroll = (filter: CardFilter) => {
    const next = filter === cardFilter ? 'all' : filter;
    setCardFilter(next);
  };

  const handleSearch = (term: string) => {
    setSearch(term);
    fetchCategories(cardFilter, term);
  };

  const StatCard = ({ icon, label, value, color, desc, tooltip, filterKey, onClick }: {
    icon: React.ReactNode; label: string; value: number; color: string; desc?: string; tooltip: string; filterKey: CardFilter; onClick?: () => void;
  }) => {
    const animated = useCountUp(statsLoading ? 0 : value);
    const isActive = cardFilter === filterKey;
    return (
      <button
        onClick={onClick || (() => setCardFilterAndScroll(filterKey))}
        title={tooltip}
        className={`bg-white rounded-xl border shadow-sm p-5 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group ${isActive ? 'ring-2 ring-gray-900 border-gray-900' : 'border-gray-100'}`}
      >
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} transition-transform group-hover:scale-110`}>
            {icon}
          </div>
          <span className="text-2xl font-bold text-gray-900 tabular-nums">
            {statsLoading ? <span className="inline-block h-7 w-12 bg-gray-200 rounded animate-pulse" /> : animated}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-600 mt-2">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
        {isActive && <p className="text-xs text-gray-900 font-medium mt-1">Filtering — click to clear</p>}
      </button>
    );
  };

  const CategoryRow = ({ cat, level = 0 }: { cat: Category; level?: number }) => {
    const children = buildTree(categories, cat.id);
    const isExpanded = expandedIds.has(cat.id);
    const hasChildren = children.length > 0;
    const isMenuOpen = openMenuId === cat.id;

    return (
      <>
        <div
          className={`flex items-center gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${selectedIds.has(cat.id) ? 'bg-blue-50/50' : ''}`}
          style={{ paddingLeft: `${16 + level * 32}px` }}
        >
          <button onClick={() => toggleSelect(cat.id)} className="w-4 h-4 rounded border-gray-300 border flex items-center justify-center flex-shrink-0">
            {selectedIds.has(cat.id) && <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />}
          </button>
          {hasChildren ? (
            <button onClick={() => toggleExpand(cat.id)} className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : <div className="w-5" />}
          {cat.image && (
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img src={cat.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link href={`/admin/categories/${cat.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">{cat.name}</Link>
            <p className="text-xs text-gray-400 truncate">/{cat.slug}</p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1 w-16 justify-center"><Package size={12} />{cat._count?.products || 0}</span>
            {cat._count?.children ? <span className="flex items-center gap-1 w-12 justify-center"><Layers size={12} />{cat._count.children}</span> : <span className="w-12" />}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-16 text-center ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {cat.isActive ? 'Active' : 'Hidden'}
            </span>
          </div>
          <div className="relative">
            <button onClick={() => setOpenMenuId(isMenuOpen ? null : cat.id)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
              <MoreHorizontal size={16} />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1.5">
                <Link href={`/admin/categories/${cat.id}`} className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50"><Eye size={14} className="text-gray-400" /> View Details</Link>
                <Link href={`/admin/categories/${cat.id}`} className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50"><Edit size={14} className="text-gray-400" /> Edit</Link>
                {hasChildren && <button onClick={() => { setCardFilter('subcategory'); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50"><FolderTree size={14} className="text-gray-400" /> Subcategories ({cat._count?.children || 0})</button>}
                <button onClick={() => handleDuplicate(cat.id)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50"><Copy size={14} className="text-gray-400" /> Duplicate</button>
                <button onClick={() => toggleActive(cat)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50">
                  {cat.isActive ? <EyeOff size={14} className="text-gray-400" /> : <Eye size={14} className="text-gray-400" />} {cat.isActive ? 'Hide' : 'Publish'}
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={() => { setDeleteConfirm(cat.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
              </div>
            )}
          </div>
        </div>
        {isExpanded && children.map(child => <CategoryRow key={child.id} cat={child} level={level + 1} />)}
      </>
    );
  };

  const FlatCategoryRow = ({ cat }: { cat: Category }) => {
    const isMenuOpen = openMenuId === cat.id;
    return (
      <div
        className={`flex items-center gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${selectedIds.has(cat.id) ? 'bg-blue-50/50' : ''}`}
      >
        <button onClick={() => toggleSelect(cat.id)} className="w-4 h-4 rounded border-gray-300 border flex items-center justify-center flex-shrink-0">
          {selectedIds.has(cat.id) && <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />}
        </button>
        <div className="w-5" />
        {cat.image && (
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img src={cat.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/admin/categories/${cat.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">{cat.name}</Link>
          <p className="text-xs text-gray-400 truncate">/{cat.slug}{cat.parent ? ` — in ${cat.parent.name}` : ''}</p>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1 w-16 justify-center"><Package size={12} />{cat._count?.products || 0}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-16 text-center ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {cat.isActive ? 'Active' : 'Hidden'}
          </span>
        </div>
        <div className="relative">
          <button onClick={() => setOpenMenuId(isMenuOpen ? null : cat.id)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
            <MoreHorizontal size={16} />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1.5">
              <Link href={`/admin/categories/${cat.id}`} className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50"><Eye size={14} className="text-gray-400" /> View Details</Link>
              <Link href={`/admin/categories/${cat.id}`} className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50"><Edit size={14} className="text-gray-400" /> Edit</Link>
              <button onClick={() => handleDuplicate(cat.id)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50"><Copy size={14} className="text-gray-400" /> Duplicate</button>
              <button onClick={() => toggleActive(cat)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50">
                {cat.isActive ? <EyeOff size={14} className="text-gray-400" /> : <Eye size={14} className="text-gray-400" />} {cat.isActive ? 'Hide' : 'Publish'}
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => { setDeleteConfirm(cat.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const activeFilterLabel = useMemo(() => {
    switch (cardFilter) {
      case 'parent': return 'Parent Categories';
      case 'subcategory': return 'Subcategories';
      case 'active': return 'Active Categories';
      case 'hidden': return 'Hidden Categories';
      case 'withProducts': return 'Categories With Products';
      case 'empty': return 'Empty Categories';
      case 'thisMonth': return 'Created This Month';
      default: return null;
    }
  }, [cardFilter]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/admin" className="hover:text-gray-700">Dashboard</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Catalog</span>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Categories</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
            <p className="text-sm text-gray-500 mt-1">Organize your store catalog using categories and subcategories</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} disabled={loading} className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <Link href="/admin/categories/new" className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus size={16} /> Add Category
            </Link>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {statsLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : stats && (
              <>
                <StatCard icon={<FolderTree size={18} className="text-blue-600" />} label="Total Categories" value={stats.totalCategories} color="bg-blue-50" desc="Parent categories" tooltip="Top-level categories" filterKey="parent" />
                <StatCard icon={<Layers size={18} className="text-purple-600" />} label="Subcategories" value={stats.totalSubcategories} color="bg-purple-50" desc="Nested categories" tooltip="Nested categories" filterKey="subcategory" />
                <StatCard icon={<CheckCircle2 size={18} className="text-green-600" />} label="Active" value={stats.activeCategories} color="bg-green-50" desc="Published & visible" tooltip="Published and visible" filterKey="active" />
                <StatCard icon={<EyeOff size={18} className="text-gray-600" />} label="Hidden" value={stats.hiddenCategories} color="bg-gray-100" desc="Inactive categories" tooltip="Hidden from customers" filterKey="hidden" />
                <StatCard icon={<Star size={18} className="text-orange-600" />} label="With Products" value={stats.categoriesWithProducts} color="bg-orange-50" desc="Categories containing products" tooltip="Contains one or more products" filterKey="withProducts" />
                <StatCard icon={<AlertTriangle size={18} className="text-red-600" />} label="Empty" value={stats.emptyCategories} color="bg-red-50" desc="No products assigned" tooltip="No products assigned" filterKey="empty" />
                <StatCard icon={<Package size={18} className="text-indigo-600" />} label="Total Products" value={stats.productsAssigned} color="bg-indigo-50" desc="Across all categories" tooltip="Products across all categories" filterKey="all" onClick={() => router.push('/admin/products')} />
                <StatCard icon={<Calendar size={18} className="text-cyan-600" />} label="This Month" value={stats.thisMonthCategories} color="bg-cyan-50" desc="New categories this month" tooltip="Created during current month" filterKey="thisMonth" />
              </>
            )}
        </div>

        {/* Active filter banner */}
        {activeFilterLabel && (
          <div className="flex items-center gap-3 bg-gray-900 text-white px-4 py-2.5 rounded-xl mb-4 text-sm">
            <span className="font-medium">Filtering: {activeFilterLabel}</span>
            <span className="text-gray-400">({categories.length} results)</span>
            <button onClick={() => setCardFilter('all')} className="ml-auto p-1 hover:bg-white/10 rounded-lg"><X size={14} /></button>
          </div>
        )}

        {/* Search & Sort */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search categories by name, slug, or description..." value={search} onChange={e => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400" />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={`${sortField}-${sortOrder}`} onChange={e => { const [f, o] = e.target.value.split('-'); setSortField(f as SortField); setSortOrder(o as SortOrder); }}
                className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-gray-900/10">
                <option value="displayOrder-asc">Display Order</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="createdAt-desc">Newest</option>
                <option value="createdAt-asc">Oldest</option>
              </select>
            </div>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
              <button onClick={() => handleBulkAction('publish')} className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100">Publish</button>
              <button onClick={() => handleBulkAction('hide')} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Hide</button>
              <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Delete</button>
              <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-700">Clear</button>
            </div>
          )}
        </div>

        {/* Category List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="w-4" />
            <div className="w-5" />
            <div className="flex-1">Category</div>
            <div className="hidden md:flex items-center gap-4">
              <span className="w-16 text-center">Products</span>
              {!showTree && <span className="w-16 text-center">Status</span>}
              {showTree && <span className="w-12 text-center">Subs</span>}
              {showTree && <span className="w-16 text-center">Status</span>}
            </div>
            <div className="w-8" />
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-3">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
                  </div>
                  <div className="hidden md:flex gap-4"><div className="w-16 h-4 bg-gray-200 rounded animate-pulse" /><div className="w-16 h-5 bg-gray-200 rounded-full animate-pulse" /></div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><FolderTree size={24} className="text-gray-400" /></div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No categories found</h3>
              <p className="text-sm text-gray-500 mb-4">{search || cardFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by creating your first category'}</p>
              {!search && cardFilter === 'all' && (
                <Link href="/admin/categories/new" className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"><Plus size={16} /> Add Category</Link>
              )}
            </div>
          ) : showTree ? (
            <div className="divide-y divide-gray-50">
              {topLevel.map(cat => <CategoryRow key={cat.id} cat={cat} level={0} />)}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {categories.map(cat => <FlatCategoryRow key={cat.id} cat={cat} />)}
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={20} className="text-red-600" /></div>
              <h3 className="text-lg font-semibold text-center mb-2">Delete Category?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">This action cannot be undone. The category will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
