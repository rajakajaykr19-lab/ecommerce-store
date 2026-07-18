'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Store, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    storeName: '',
    storeDescription: '',
    contactEmail: '',
    contactPhone: '',
    storeAddress: '',
    gstin: '',
    pan: '',
    businessName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.getAdminSettings();
      const data = res.data || res;
      setSettings({
        storeName: data.storeName || '',
        storeDescription: data.storeDescription || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        storeAddress: data.storeAddress || '',
        gstin: data.gstin || data.businessGSTIN || '',
        pan: data.pan || data.businessPAN || '',
        businessName: data.businessName || '',
        bankName: data.bankName || '',
        accountNumber: data.accountNumber || '',
        ifscCode: data.ifscCode || '',
        upiId: data.upiId || '',
      });
    } catch { toast.error('Failed to load settings'); }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAdminSettings(settings);
      toast.success('Settings saved');
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={24} /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Store Settings */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Store size={18} /> Store Settings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Store Name</label>
              <input type="text" name="storeName" value={settings.storeName} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Store Description</label>
              <textarea name="storeDescription" value={settings.storeDescription} onChange={handleChange} rows={3} className="w-full border px-3 py-2 text-sm outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input type="email" name="contactEmail" value={settings.contactEmail} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Phone</label>
              <input type="text" name="contactPhone" value={settings.contactPhone} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Store Address</label>
              <textarea name="storeAddress" value={settings.storeAddress} onChange={handleChange} rows={2} className="w-full border px-3 py-2 text-sm outline-none resize-none" />
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-white border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 size={18} /> Business Settings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <input type="text" name="businessName" value={settings.businessName} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GSTIN</label>
              <input type="text" name="gstin" value={settings.gstin} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none font-mono" placeholder="22AAAAA0000A1Z5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PAN</label>
              <input type="text" name="pan" value={settings.pan} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none font-mono" placeholder="AAAAA0000A" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name</label>
              <input type="text" name="bankName" value={settings.bankName} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <input type="text" name="accountNumber" value={settings.accountNumber} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">IFSC Code</label>
              <input type="text" name="ifscCode" value={settings.ifscCode} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none font-mono" placeholder="SBIN0001234" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">UPI ID</label>
              <input type="text" name="upiId" value={settings.upiId} onChange={handleChange} className="w-full border px-3 py-2 text-sm outline-none" placeholder="store@upi" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving} className="inline-flex items-center gap-2">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
