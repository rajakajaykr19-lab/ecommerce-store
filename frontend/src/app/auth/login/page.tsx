'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-[#C9A84C] rounded-full" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      router.push(redirectTo);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <h1 className="text-2xl font-bold text-center mb-8">Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" id="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter your email" required />
          <Input label="Password" type="password" id="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" required />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-[#1a1a2e]" /> Remember me</label>
            <Link href="/auth/forgot-password" className="text-[#1a1a2e] hover:underline">Forgot Password?</Link>
          </div>
          <Button type="submit" loading={loading} className="w-full">Sign In</Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account? <Link href="/auth/register" className="text-[#1a1a2e] font-medium hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
}
