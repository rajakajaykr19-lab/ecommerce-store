'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Category, CategoryDashboardStats } from '@/types';
import toast from 'react-hot-toast';
import {
  FolderTree, Plus, Search, Filter, ChevronDown, ChevronRight,
  MoreHorizontal, Edit, Trash2, Eye, Copy, Archive, EyeOff,
  Package, BarChart3, Star, TrendingUp, ArrowUpDown, X,
  ChevronUp, GripVertical, Download, Upload, RefreshCw,
  LayoutGrid, List, Folder, Tag, ShoppingCart, DollarSign,
  Calendar, AlertTriangle, CheckCircle2, XCircle, Home, Layers,
} from 'lucide-react';

type ViewMode = 'tree' | 'list';
type SortField = 'name' | 'products' | 'createdAt' | 'displayOrder';
type SortOrder = 'asc' | 'desc';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [stats, setStats] = useState<CategoryDashboardStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [parentFilter, setParentFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('displayOrder');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const catsRes = await api.getAdminCategories({ limit: '200' });
      setCategories(catsRes.data || catsRes || []);
    } catch {
      toast.error('Failed to load categories');
    }
    try {
      const allCatsRes = await api.getAllCategoriesFlat();
      setAllCategories(allCatsRes.data || allCatsRes || []);
    } catch { /* optional */ }
    try {
      const statsRes = await api.getCategoryDashboardStats();
      setStats(statsRes);
    } catch { /* optional */ }
    setLoading(false);
  };

  const filteredCategories = useMemo(() => {
    let result = [...(categories || [])];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (statusFilter === 'active') result = result.filter(c => c.isActive);
    if (statusFilter === 'inactive') result = result.filter(c => !c.isActive);
    if (statusFilter === 'empty') result = result.filter(c => (c._count?.products || 0) === 0 && (c._count?.children || 0) === 0);
    if (statusFilter === 'featured') result = result.filter(c => (c._count?.products || 0) > 5);

    if (parentFilter === 'none') result = result.filter(c => !c.parentId);
    else if (parentFilter !== 'all') result = result.filter(c => c.parentId === parentFilter);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'products') cmp = (a._count?.products || 0) - (b._count?.products || 0);
      else if (sortField === 'createdAt') cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      else cmp = a.displayOrder - b.displayOrder;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [categories, search, statusFilter, parentFilter, sortField, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredCategories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCategories.map(c => c.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) { toast.error('Select categories first'); return; }
    if (action === 'delete' && !confirm(`Delete ${selectedIds.size} category(ies)?`)) return;

    try {
      await api.bulkCategoryOperations({ action, categoryIds: Array.from(selectedIds) });
      toast.success(`${selectedIds.size} category(ies) ${action === 'delete' ? 'deleted' : 'updated'}`);
      setSelectedIds(new Set());
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCategory(id);
      toast.success('Category deleted');
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateCategory(id);
      toast.success('Category duplicated');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Duplicate failed');
    }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await api.updateCategory(cat.id, { isActive: !cat.isActive });
      toast.success(cat.isActive ? 'Category hidden' : 'Category published');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const buildTree = (cats: Category[], parentId: string | null = null): Category[] => {
    return cats
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  };

  const topLevel = buildTree(filteredCategories);

  const getHealthColor = (issues: string[]) => {
    if (issues.includes('Healthy')) return 'text-green-600 bg-green-50';
    return 'text-amber-600 bg-amber-50';
  };

  const getHealthIcon = (issues: string[]) => {
    if (issues.includes('Healthy')) return <CheckCircle2 size={12} />;
    return <AlertTriangle size={12} />;
  };

  const StatCard = ({ icon, label, value, color, desc }: { icon: React.ReactNode; label: string; value: number | string; color: string; desc?: string }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <p className="text-sm font-medium text-gray-600 mt-2">{label}</p>
      {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
    </div>
  );

  const CategoryRow = ({ cat, level = 0 }: { cat: Category; level?: number }) => {
    const children = buildTree(filteredCategories, cat.id);
    const isExpanded = expandedIds.has(cat.id);
    const hasChildren = children.length > 0;
    const health = cat.healthIssues || ['Healthy'];
    const isMenuOpen = openMenuId === cat.id;

    return (
      <>
        <div
          className={`flex items-center gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${selectedIds.has(cat.id) ? 'bg-blue-50/50' : ''}`}
          style={{ paddingLeft: `${16 + level * 32}px` }}
        >
          <button
            onClick={() => toggleSelect(cat.id)}
            className="w-4 h-4 rounded border-gray-300 border flex items-center justify-center flex-shrink-0"
          >
            {selectedIds.has(cat.id) && <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />}
          </button>

          {hasChildren ? (
            <button onClick={() => toggleExpand(cat.id)} className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {cat.image ? (
              <img src={cat.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Folder size={14} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Link href={`/admin/categories/${cat.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">
              {cat.name}
            </Link>
            <p className="text-xs text-gray-400 truncate">/{cat.slug}</p>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Package size={12} />
              {cat._count?.products || 0}
            </span>
            {cat._count?.children ? (
              <span className="flex items-center gap-1">
                <Layers size={12} />
                {cat._count.children}
              </span>
            ) : null}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {cat.isActive ? 'Active' : 'Hidden'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getHealthColor(health)}`}>
              {getHealthIcon(health)}
              {health[0]}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenMenuId(isMenuOpen ? null : cat.id)}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1.5">
                <Link href={`/admin/categories/${cat.id}`} className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50">
                  <Eye size={14} className="text-gray-400" /> View Details
                </Link>
                <Link href={`/admin/categories/${cat.id}`} className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50">
                  <Edit size={14} className="text-gray-400" /> Edit
                </Link>
                {hasChildren && (
                  <button onClick={() => { setParentFilter(cat.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50">
                    <FolderTree size={14} className="text-gray-400" /> Subcategories ({cat._count?.children || 0})
                  </button>
                )}
                <button onClick={() => handleDuplicate(cat.id)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50">
                  <Copy size={14} className="text-gray-400" /> Duplicate
                </button>
                <button onClick={() => toggleActive(cat)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50">
                  {cat.isActive ? <EyeOff size={14} className="text-gray-400" /> : <Eye size={14} className="text-gray-400" />}
                  {cat.isActive ? 'Hide' : 'Publish'}
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { setDeleteConfirm(cat.id); setOpenMenuId(null); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {isExpanded && children.map(child => (
          <CategoryRow key={child.id} cat={child} level={level + 1} />
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/admin" className="hover:text-gray-700">Dashboard</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Catalog</span>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Categories</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
            <p className="text-sm text-gray-500 mt-1">Organize your store catalog using categories and subcategories</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/categories/new" className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus size={16} /> Add Category
            </Link>
          </div>
        </div>

        {/* Dashboard Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            <StatCard icon={<FolderTree size={18} className="text-blue-600" />} label="Categories" value={stats.totalCategories} color="bg-blue-50" desc="Parent categories" />
            <StatCard icon={<Layers size={18} className="text-purple-600" />} label="Subcategories" value={stats.totalSubcategories} color="bg-purple-50" desc="Nested categories" />
            <StatCard icon={<CheckCircle2 size={18} className="text-green-600" />} label="Active" value={stats.activeCategories} color="bg-green-50" desc="Published & visible" />
            <StatCard icon={<EyeOff size={18} className="text-gray-600" />} label="Hidden" value={stats.hiddenCategories} color="bg-gray-100" desc="Inactive categories" />
            <StatCard icon={<Star size={18} className="text-amber-600" />} label="With Products" value={stats.featuredCategories} color="bg-amber-50" desc="5+ products" />
            <StatCard icon={<AlertTriangle size={18} className="text-red-600" />} label="Empty" value={stats.emptyCategories} color="bg-red-50" desc="No products assigned" />
            <StatCard icon={<Package size={18} className="text-indigo-600" />} label="Total Products" value={stats.productsAssigned} color="bg-indigo-50" desc="Across all categories" />
            <StatCard icon={<Calendar size={18} className="text-teal-600" />} label="This Month" value={stats.thisMonthCategories} color="bg-teal-50" desc="New categories" />
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories by name, slug, or description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-gray-900/10">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Hidden</option>
                <option value="empty">Empty</option>
                <option value="featured">With Products</option>
              </select>
              <select value={parentFilter} onChange={e => setParentFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-gray-900/10">
                <option value="all">All Levels</option>
                <option value="none">Top Level Only</option>
                {allCategories.filter(c => !c.parentId && (c._count?.children || 0) > 0).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select value={`${sortField}-${sortOrder}`} onChange={e => {
                const [f, o] = e.target.value.split('-');
                setSortField(f as SortField);
                setSortOrder(o as SortOrder);
              }} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-gray-900/10">
                <option value="displayOrder-asc">Display Order</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="products-desc">Most Products</option>
                <option value="createdAt-desc">Newest</option>
                <option value="createdAt-asc">Oldest</option>
              </select>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('tree')} className={`px-3 py-2 text-sm ${viewMode === 'tree' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <FolderTree size={14} />
                </button>
                <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
              <button onClick={() => handleBulkAction('publish')} className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100">Publish</button>
              <button onClick={() => handleBulkAction('hide')} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Hide</button>
              <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Delete</button>
              <button onClick={() => { setSelectedIds(new Set()); }} className="ml-auto text-xs text-gray-500 hover:text-gray-700">Clear</button>
            </div>
          )}
        </div>

        {/* Category List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <button onClick={selectAll} className="w-4 h-4 rounded border-gray-300 border flex items-center justify-center flex-shrink-0">
              {selectedIds.size === filteredCategories.length && filteredCategories.length > 0 ? <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /> : null}
            </button>
            <div className="w-5" />
            <div className="w-8" />
            <div className="flex-1">Category</div>
            <div className="hidden md:flex items-center gap-4">
              <span className="w-16 text-center">Products</span>
              <span className="w-12 text-center">Subs</span>
              <span className="w-16 text-center">Status</span>
              <span className="w-24 text-center">Health</span>
            </div>
            <div className="w-8" />
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-3">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-5" />
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
                  </div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-16 h-5 bg-gray-200 rounded-full animate-pulse" />
                  <div className="w-24 h-5 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderTree size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No categories found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by creating your first category'}
              </p>
              {!search && statusFilter === 'all' && (
                <Link href="/admin/categories/new" className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
                  <Plus size={16} /> Add Category
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(viewMode === 'tree' ? topLevel : filteredCategories).map(cat => (
                <CategoryRow key={cat.id} cat={cat} level={0} />
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Delete Category?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                This action cannot be undone. The category will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
