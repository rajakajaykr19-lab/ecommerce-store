'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, Loader2 } from 'lucide-react';

const SUBJECTS = [
  'General Inquiry',
  'Order Issue',
  'Return & Exchange',
  'Product Question',
  'Shipping Inquiry',
  'Payment Issue',
  'Feedback & Suggestions',
  'Wholesale Inquiry',
  'Other',
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await api.submitContact(form);
      toast.success('Message sent! We\'ll get back to you soon.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="container-custom py-12">
      {/* Hero */}
      <div className="bg-black text-white p-8 md:p-12 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Get in Touch</h1>
          <p className="text-gray-300 leading-relaxed">
            Have a question, suggestion, or need help? We&apos;re here for you. Reach out and our team will respond within 24 hours.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-6">Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                required
              />
              <Input
                label="Email Address *"
                type="email"
                id="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9876543210"
              />
              <div className="w-full">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#1a1a2e] focus:ring-1 focus:ring-[#1a1a2e]"
                  required
                >
                  <option value="">Select a subject</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="w-full">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="How can we help you?"
                rows={6}
                className="w-full border border-gray-300 px-4 py-3 text-sm outline-none transition-all focus:border-[#1a1a2e] focus:ring-1 focus:ring-[#1a1a2e] resize-none"
                required
              />
            </div>
            <Button type="submit" loading={loading} className="flex items-center gap-2">
              <Send size={16} /> Send Message
            </Button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-6">Contact Information</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-[#d4a853]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Phone</h3>
                  <p className="text-sm text-gray-600">+91 98765 43210</p>
                  <p className="text-sm text-gray-600">+91 98765 43211</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-[#d4a853]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Email</h3>
                  <p className="text-sm text-gray-600">support@storename.com</p>
                  <p className="text-sm text-gray-600">orders@storename.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-[#d4a853]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Address</h3>
                  <p className="text-sm text-gray-600">
                    123 Fashion Street,<br />
                    Textile Market Area,<br />
                    Mumbai, Maharashtra 400001<br />
                    India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#d4a853]/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-[#d4a853]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Business Hours</h3>
                  <p className="text-sm text-gray-600">Monday - Saturday: 10:00 AM - 8:00 PM</p>
                  <p className="text-sm text-gray-600">Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-green-500 text-white px-6 py-4 hover:bg-green-600 transition-colors"
          >
            <MessageCircle size={20} />
            <div>
              <p className="font-semibold text-sm">Chat on WhatsApp</p>
              <p className="text-xs text-green-100">Quick response within minutes</p>
            </div>
          </a>

          {/* Map Placeholder */}
          <div className="border h-48 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <MapPin size={24} className="mx-auto mb-2" />
              <p className="text-sm">Map View</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
