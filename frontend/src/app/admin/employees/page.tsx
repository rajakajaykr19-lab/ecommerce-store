'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { parsePermissions } from '@/types';
import { Plus, Edit2, Trash2, Users, Shield } from 'lucide-react';

interface Employee {
  id: string; name: string; email: string; phone?: string;
  role: string; permissions: string; isActive: boolean; createdAt: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadEmployees(); }, []);

  const loadEmployees = async () => {
    try {
      const res = await api.getEmployees();
      setEmployees(res.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete employee "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteEmployee(id);
      setEmployees(employees.filter(e => e.id !== id));
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">Manage staff accounts and their permissions</p>
        </div>
        <Link
          href="/admin/employees/new"
          className="flex items-center gap-2 bg-[#C9A84C] text-white px-4 py-2 rounded-lg hover:bg-[#b8933d] transition-colors"
        >
          <Plus size={18} /> Add Employee
        </Link>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}

      {employees.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-600">No employees yet</h3>
          <p className="text-gray-400 mt-1">Create an employee account to get started</p>
          <Link href="/admin/employees/new" className="inline-block mt-4 bg-[#C9A84C] text-white px-4 py-2 rounded-lg hover:bg-[#b8933d]">
            Add First Employee
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Permissions</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees.map((emp) => {
                const perms = parsePermissions(emp.permissions);
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{emp.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{emp.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{emp.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {perms.slice(0, 3).map((p) => (
                          <span key={p} className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                            {p.split('.')[0]}
                          </span>
                        ))}
                        {perms.length > 3 && (
                          <span className="text-xs text-gray-400">+{perms.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded ${emp.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/employees/${emp.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                          <Edit2 size={16} />
                        </Link>
                        <button onClick={() => handleDelete(emp.id, emp.name)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
