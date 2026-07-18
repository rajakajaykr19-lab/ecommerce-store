'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, LayoutGrid, ShoppingBag, Image,
  ShoppingCart, Users, Tag, Star, FileText, Settings, BarChart3,
  Mail, HelpCircle, Shield, Database, Menu, X, ChevronDown,
} from 'lucide-react';

const sidebarLinks = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Products', href: '/admin/products', icon: <Package size={18} /> },
  { label: 'Categories', href: '/admin/categories', icon: <LayoutGrid size={18} /> },
  { label: 'Brands', href: '/admin/brands', icon: <ShoppingBag size={18} /> },
  { label: 'Banners', href: '/admin/banners', icon: <Image size={18} /> },
  { label: 'Orders', href: '/admin/orders', icon: <ShoppingCart size={18} /> },
  { label: 'Customers', href: '/admin/customers', icon: <Users size={18} /> },
  { label: 'Coupons', href: '/admin/coupons', icon: <Tag size={18} /> },
  { label: 'Reviews', href: '/admin/reviews', icon: <Star size={18} /> },
  { label: 'Blog', href: '/admin/blog', icon: <FileText size={18} /> },
  { label: 'Newsletter', href: '/admin/newsletter', icon: <Mail size={18} /> },
  { label: 'FAQ', href: '/admin/faq', icon: <HelpCircle size={18} /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={18} /> },
  { label: 'Roles', href: '/admin/roles', icon: <Shield size={18} /> },
  { label: 'Backup', href: '/admin/backup', icon: <Database size={18} /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings size={18} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-[#C9A84C] rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="mx-auto h-12 w-12 text-[#C9A84C] mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Login Required</h1>
          <p className="text-gray-500 mb-6">Please log in with your admin credentials to access the dashboard.</p>
          <Link href="/auth/login?redirect=/admin" className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium">
            Login as Admin
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            Admin: admin@storename.com / admin123
          </p>
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">You don&apos;t have permission to access the admin panel. This area is restricted to administrators.</p>
          <Link href="/" className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 shadow-md rounded">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-full w-64 bg-[#1a1a2e] text-white transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-700">
          <Link href="/admin" className="text-xl font-bold">Admin Panel</Link>
          <p className="text-xs text-gray-400 mt-1">{user.email}</p>
        </div>
        <nav className="overflow-y-auto h-[calc(100%-5rem)] p-2 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded transition-colors"
            >
              {link.icon} {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-700 pt-2 mt-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 rounded">
              Back to Store
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold hidden lg:block">Welcome, {user.name}</h1>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">View Store</Link>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
