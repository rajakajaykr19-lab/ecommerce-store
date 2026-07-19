'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ALL_PERMISSIONS, parsePermissions } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

const permissionGroups = ALL_PERMISSIONS.reduce((acc, p) => {
  if (!acc[p.group]) acc[p.group] = [];
  acc[p.group].push(p);
  return acc;
}, {} as Record<string, typeof ALL_PERMISSIONS>);

interface Employee {
  id: string; name: string; email: string; phone?: string;
  role: string; permissions: string; isActive: boolean;
}

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getAdminUsers();
        const emp = res.data.find((u: any) => u.id === id);
        if (!emp) throw new Error('Employee not found');
        setEmployee(emp);
        setForm({ name: emp.name, phone: emp.phone || '', password: '' });
        setSelectedPermissions(new Set(parsePermissions(emp.permissions)));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const togglePermission = (key: string) => {
    const next = new Set(selectedPermissions);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedPermissions(next);
  };

  const toggleGroup = (group: string, keys: string[]) => {
    const allSelected = keys.every(k => selectedPermissions.has(k));
    const next = new Set(selectedPermissions);
    keys.forEach(k => { if (allSelected) next.delete(k); else next.add(k); });
    setSelectedPermissions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data: any = {
        name: form.name,
        phone: form.phone,
        permissions: Array.from(selectedPermissions),
      };
      if (form.password) data.password = form.password;
      await api.updateEmployee(id, data);
      router.push('/admin/employees');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!employee) return;
    try {
      await api.updateEmployee(id, { isActive: !employee.isActive });
      setEmployee({ ...employee, isActive: !employee.isActive });
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-[#C9A84C] rounded-full" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center py-12 text-gray-500">Employee not found</div>;
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/employees" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={16} /> Back to Employees
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Employee</h1>
        <button
          onClick={handleToggleActive}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${employee.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
        >
          {employee.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-3">Account Details</h2>
          <p className="text-sm text-gray-400">Email: {employee.email} (cannot be changed)</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              minLength={8}
              placeholder="Leave blank to keep current"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-semibold text-lg mb-3">Permissions</h2>
          <p className="text-sm text-gray-500 mb-4">Select what this employee can access in the admin panel.</p>

          <div className="space-y-4">
            {Object.entries(permissionGroups).map(([group, perms]) => {
              const allSelected = perms.every(p => selectedPermissions.has(p.key));
              const someSelected = perms.some(p => selectedPermissions.has(p.key));
              return (
                <div key={group} className="border rounded-lg p-4">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={() => toggleGroup(group, perms.map(p => p.key))}
                      className="rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
                    />
                    <span className="font-medium text-sm">{group}</span>
                  </label>
                  <div className="ml-6 grid grid-cols-2 gap-2">
                    {perms.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.has(p.key)}
                          onChange={() => togglePermission(p.key)}
                          className="rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#C9A84C] text-white px-6 py-2.5 rounded-lg hover:bg-[#b8933d] disabled:opacity-50 transition-colors"
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/admin/employees" className="px-6 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
