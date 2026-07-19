'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const ROLES = ['ALL', 'CUSTOMER', 'ADMIN', 'MANAGER', 'EMPLOYEE'] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (roleFilter !== 'ALL') params.role = roleFilter;
      const res = await api.getAdminUsers(params);
      setUsers(res.data || []);
      setPagination(res.pagination);
    } catch { setUsers([]); }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch (err: any) { toast.error(err.message); }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-purple-50 text-purple-700',
      SUPER_ADMIN: 'bg-purple-50 text-purple-700',
      MANAGER: 'bg-blue-50 text-blue-700',
      EMPLOYEE: 'bg-amber-50 text-amber-700',
      CUSTOMER: 'bg-gray-100 text-gray-700',
    };
    return styles[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
              className="w-full border pl-10 pr-4 py-2 text-sm outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="border px-3 py-2 text-sm outline-none"
          >
            {ROLES.map(r => <option key={r} value={r}>{r === 'ALL' ? 'All Roles' : r}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Phone</th>
              <th className="text-left p-4 font-medium">Role</th>
              <th className="text-left p-4 font-medium">Orders</th>
              <th className="text-left p-4 font-medium">Joined</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="animate-spin mx-auto" size={24} /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-gray-400">No users found</td></tr>
            ) : (
              users.map((u: any) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a1a2e] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">{u.email}</td>
                  <td className="p-4 text-gray-500">{u.phone || '-'}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 border-0 outline-none cursor-pointer ${getRoleBadge(u.role)}`}
                    >
                      {['CUSTOMER', 'ADMIN', 'MANAGER', 'EMPLOYEE'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">{u._count?.orders ?? u.ordersCount ?? 0}</td>
                  <td className="p-4 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="p-4">
                    <Link href={`/admin/users/${u.id}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      View <ChevronRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
