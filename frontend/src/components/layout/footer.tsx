'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone, ChevronRight } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    try {
      await api.subscribe(email);
      toast.success('Subscribed successfully!');
      setEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Subscription failed');
    }
    setSubscribing(false);
  };

  return (
    <footer className="bg-black text-gray-300">
      {/* Newsletter */}
      <div className="border-b border-gray-700">
        <div className="container-custom py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Join Our Newsletter</h3>
            <p className="text-gray-400 mb-6">Subscribe to get special offers, free giveaways, and exclusive deals.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 text-sm text-gray-900 outline-none"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="bg-[#d4a853] text-black px-6 py-3 text-sm font-semibold hover:bg-[#c49a3f] transition-colors disabled:opacity-50"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/shop?gender=MEN" className="hover:text-white transition-colors">Men</Link></li>
              <li><Link href="/shop?gender=WOMEN" className="hover:text-white transition-colors">Women</Link></li>
              <li><Link href="/shop?gender=KIDS" className="hover:text-white transition-colors">Kids</Link></li>
              <li><Link href="/shop?gender=ACCESSORIES" className="hover:text-white transition-colors">Accessories</Link></li>
              <li><Link href="/shop?discountPercent=30" className="hover:text-white transition-colors text-[#e94560]">Sale</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/tracking" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Return & Exchange</Link></li>
              <li><Link href="/cancellation" className="hover:text-white transition-colors">Cancellation Policy</Link></li>
              <li><Link href="/size-guide" className="hover:text-white transition-colors">Size Guide</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/sitemap" className="hover:text-white transition-colors">Sitemap</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                <span>123 Fashion Street, Mumbai, Maharashtra 400001</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="flex-shrink-0" />
                <span>hello@storename.com</span>
              </li>
            </ul>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#d4a853] hover:text-black transition-colors" aria-label="Facebook"><Facebook size={18} /></a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#d4a853] hover:text-black transition-colors" aria-label="Instagram"><Instagram size={18} /></a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#d4a853] hover:text-black transition-colors" aria-label="Twitter"><Twitter size={18} /></a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#d4a853] hover:text-black transition-colors" aria-label="YouTube"><Youtube size={18} /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-700">
        <div className="container-custom py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {currentYear} STORE NAME. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>We accept:</span>
            <div className="flex items-center gap-2 text-lg font-bold text-white">
              <span>Visa</span>
              <span>MC</span>
              <span>UPI</span>
              <span>COD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
