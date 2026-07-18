'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Package, ShoppingCart, Users, IndianRupee, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminDashboard().then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>;

  const stats = [
    { label: 'Total Revenue', value: data ? formatPrice(data.totalRevenue) : '₹0', icon: <IndianRupee size={20} />, change: '+12.5%', trend: 'up' },
    { label: 'Month Revenue', value: data ? formatPrice(data.monthRevenue) : '₹0', icon: <TrendingUp size={20} />, change: '+8.2%', trend: 'up' },
    { label: 'Total Orders', value: data?.totalOrders || 0, icon: <ShoppingCart size={20} />, change: `${data?.monthOrders || 0} this month`, trend: 'up' },
    { label: 'Customers', value: data?.totalCustomers || 0, icon: <Users size={20} />, change: 'Active', trend: 'up' },
    { label: 'Products', value: data?.totalProducts || 0, icon: <Package size={20} />, change: `${data?.lowStockProducts || 0} low stock`, trend: 'down' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</span>
              <span className={`p-2 rounded-full ${stat.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Order</th>
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Items</th>
                <th className="text-left p-4 font-medium">Total</th>
                <th className="text-left p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders?.map((order: any) => (
                <tr key={order.id} className="border-t">
                  <td className="p-4 font-medium">#{order.orderNumber}</td>
                  <td className="p-4">{order.user?.name}</td>
                  <td className="p-4">{order.items?.length || 0}</td>
                  <td className="p-4">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.recentOrders || data.recentOrders.length === 0) && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No recent orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
