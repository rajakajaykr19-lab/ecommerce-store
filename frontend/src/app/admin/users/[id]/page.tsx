'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Mail, Phone, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [role, setRole] = useState('');

  useEffect(() => { fetchUser(); }, [id]);

  const fetchUser = async () => {
    try {
      const res = await api.getAdminUser(id);
      const u = res.data || res;
      setUser(u);
      setRole(u.role);
    } catch { setUser(null); }
    setLoading(false);
  };

  const handleRoleUpdate = async () => {
    setUpdating(true);
    try {
      await api.updateAdminUser(id, { role });
      toast.success('User role updated');
      fetchUser();
    } catch (err: any) { toast.error(err.message); }
    setUpdating(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={24} /></div>;
  if (!user) return <div className="text-center py-20"><h1 className="text-2xl font-bold">User not found</h1></div>;

  const orders = user.orders || [];

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-6">
        <ArrowLeft size={14} /> Back to Users
      </Link>

      <div className="grid md:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="bg-white border p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#1a1a2e] text-white flex items-center justify-center text-xl font-bold">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-gray-500">ID: {user.id?.slice(0, 8)}...</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={14} /> {user.email}
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} /> {user.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={14} /> Joined {formatDate(user.createdAt)}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <label className="block text-sm font-medium mb-2 flex items-center gap-1">
              <Shield size={14} /> Role
            </label>
            <div className="flex gap-2">
              <select value={role} onChange={(e) => setRole(e.target.value)} className="flex-1 border px-3 py-2 text-sm outline-none">
                {['CUSTOMER', 'ADMIN', 'MANAGER', 'SELLER'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <Button size="sm" onClick={handleRoleUpdate} loading={updating}>Update</Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
        </div>

        {/* Order History */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Order History</h3>
          {orders.length === 0 ? (
            <div className="bg-white border p-8 text-center text-gray-400">No orders yet</div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <Link key={order.id} href={`/admin/orders/${order.orderNumber}`} className="block bg-white border p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">#{order.orderNumber}</span>
                      <span className="text-xs text-gray-500 ml-3">{formatDate(order.createdAt)}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs ${getStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{order.items?.length || 0} items</span>
                    <span className="font-medium">{formatPrice(order.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
