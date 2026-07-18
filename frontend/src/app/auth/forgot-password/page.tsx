'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
          <p className="text-gray-500 mb-2">
            We&apos;ve sent a password reset link to <span className="font-medium text-gray-700">{email}</span>
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => { setSent(false); setEmail(''); }}>
              Try Another Email
            </Button>
            <Link href="/auth/login" className="block">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={32} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Forgot Password?</h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            required
          />
          <Button type="submit" loading={loading} className="w-full">Send Reset Link</Button>
        </form>
        <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 mt-6 transition-colors">
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
