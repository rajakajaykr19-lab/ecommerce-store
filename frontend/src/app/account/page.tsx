'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Address } from '@/types';
import toast from 'react-hot-toast';
import { User, Package, Heart, MapPin, LogOut, Loader2 } from 'lucide-react';

export default function AccountPage() {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (user) { setName(user.name); }
    if (user) { api.getAddresses().then((res) => setAddresses(res.data || [])).catch(() => {}); }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({ name });
      updateUser({ name });
      toast.success('Profile updated');
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.deleteAddress(id);
      setAddresses(addresses.filter((a) => a.id !== id));
      toast.success('Address deleted');
    } catch (err: any) { toast.error(err.message); }
  };

  if (!user) {
    return <div className="container-custom py-20 text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>;
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'orders', label: 'Orders', icon: <Package size={16} />, href: '/orders' },
    { id: 'addresses', label: 'Addresses', icon: <MapPin size={16} /> },
    { id: 'wishlist', label: 'Wishlist', icon: <Heart size={16} />, href: '/wishlist' },
  ];

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="border p-4 space-y-1">
            {tabs.map((tab) => (
              tab.href ? (
                <Link key={tab.id} href={tab.href} className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-gray-50">
                  {tab.icon} {tab.label}
                </Link>
              ) : (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 w-full px-3 py-3 text-sm text-left ${activeTab === tab.id ? 'bg-gray-50 font-medium' : 'hover:bg-gray-50'}`}>
                  {tab.icon} {tab.label}
                </button>
              )
            ))}
            <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-3 text-sm text-left text-red-500 hover:bg-gray-50">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <div className="border p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input label="Email" value={user.email} disabled />
                <Input label="Phone" value={user.phone || ''} disabled />
                <Button type="submit" loading={saving}>Update Profile</Button>
              </form>
              <div className="mt-6 pt-6 border-t">
                <Link href="/auth/change-password"><Button variant="outline" size="sm">Change Password</Button></Link>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="border p-4 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{addr.fullName} - {addr.phone}</p>
                    <p className="text-sm text-gray-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                    <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                    {addr.isDefault && <span className="text-xs text-[#1a1a2e] font-medium">Default</span>}
                  </div>
                  <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                </div>
              ))}
              <Link href="/checkout"><Button variant="outline" size="sm">Add New Address</Button></Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
