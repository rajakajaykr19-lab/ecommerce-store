'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = ['All', 'Orders', 'Shipping', 'Returns', 'Payment', 'Sizing'];

const faqData = [
  { category: 'Orders', question: 'How do I place an order?', answer: 'Simply browse our catalog, add items to your cart, and proceed to checkout. You can create an account for a faster checkout experience or check out as a guest.' },
  { category: 'Orders', question: 'Can I modify or cancel my order after placing it?', answer: 'You can cancel or modify your order within 2 hours of placing it, provided it has not been shipped. Please contact our support team immediately for assistance.' },
  { category: 'Orders', question: 'How do I track my order?', answer: 'Once your order is shipped, you will receive a tracking link via email and SMS. You can also track your order from the "My Orders" section in your account.' },
  { category: 'Orders', question: 'I received a damaged/wrong item. What should I do?', answer: 'We\'re sorry about that! Please contact us within 48 hours of delivery with photos of the damaged item. We\'ll arrange a replacement or full refund immediately.' },
  { category: 'Shipping', question: 'What are the shipping charges?', answer: 'We offer free shipping on all orders above ₹999. For orders below ₹999, a flat shipping charge of ₹99 applies. Express shipping is available at ₹199.' },
  { category: 'Shipping', question: 'How long does delivery take?', answer: 'Standard delivery takes 3-7 business days depending on your location. Metro cities: 2-4 days. Tier 2-3 cities: 4-7 days. Remote areas may take up to 10 business days.' },
  { category: 'Shipping', question: 'Do you deliver pan-India?', answer: 'Yes! We deliver to all serviceable pin codes across India. You can check delivery availability by entering your pin code on any product page.' },
  { category: 'Shipping', question: 'Is international shipping available?', answer: 'International shipping is coming soon! We\'re working on making our products available globally. Subscribe to our newsletter to be notified when we launch.' },
  { category: 'Returns', question: 'What is your return policy?', answer: 'We offer a 7-day return policy from the date of delivery. Items must be unworn, unwashed, with original tags attached. Some categories like innerwear and accessories are non-returnable.' },
  { category: 'Returns', question: 'How do I initiate a return?', answer: 'Go to "My Orders" in your account, select the order, and click "Initiate Return." Choose your reason and we\'ll arrange a free pickup within 48 hours.' },
  { category: 'Returns', question: 'How long does the refund take?', answer: 'Once we receive and inspect the returned item, refunds are processed within 5-7 business days. The amount is credited to your original payment method.' },
  { category: 'Returns', question: 'Can I exchange an item instead of returning it?', answer: 'Yes! You can exchange for a different size or color of the same product, subject to availability. Select "Exchange" while initiating the return from your orders.' },
  { category: 'Payment', question: 'What payment methods do you accept?', answer: 'We accept UPI (Google Pay, PhonePe, Paytm), credit/debit cards, net banking, wallets, and Cash on Delivery (COD) for orders up to ₹5,000.' },
  { category: 'Payment', question: 'Is COD available?', answer: 'Yes, Cash on Delivery is available for orders up to ₹5,000 across most pin codes. A COD fee of ₹49 applies.' },
  { category: 'Payment', question: 'Is it safe to pay online?', answer: 'Absolutely. All transactions are encrypted with SSL and processed through PCI-DSS compliant payment gateways. We never store your card details on our servers.' },
  { category: 'Payment', question: 'My payment failed but money was deducted. What should I do?', answer: 'Don\'t worry! Failed transactions are automatically reversed within 5-7 business days. If not reversed, please share the transaction ID with our support team.' },
  { category: 'Sizing', question: 'How do I find my size?', answer: 'Visit our Size Guide page for detailed measurements. We recommend measuring yourself and comparing with our chart. If you\'re between sizes, we suggest sizing up.' },
  { category: 'Sizing', question: 'Do your sizes run true to fit?', answer: 'Yes, our sizes are designed to run true to fit. However, fits may vary slightly depending on the garment type. Refer to the individual product description for fit details.' },
  { category: 'Sizing', question: 'What if the size doesn\'t fit?', answer: 'No worries! We offer free size exchanges within 7 days of delivery. Simply initiate an exchange from your order page and we\'ll ship the new size at no extra cost.' },
];

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFAQs = useMemo(() => {
    return faqData.filter((faq) => {
      const matchCategory = activeCategory === 'All' || faq.category === activeCategory;
      const matchSearch = search === '' || faq.question.toLowerCase().includes(search.toLowerCase()) || faq.answer.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [search, activeCategory]);

  return (
    <div className="container-custom py-12">
      {/* Hero */}
      <div className="bg-black text-white p-8 md:p-12 mb-12">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={20} className="text-[#d4a853]" />
            <span className="text-[#d4a853] text-sm font-medium tracking-wider uppercase">Help Center</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-300 leading-relaxed">
            Find answers to the most common questions about our products, orders, shipping, and more.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpenIndex(null); }}
          placeholder="Search questions..."
          className="w-full border border-gray-300 pl-11 pr-4 py-4 text-sm outline-none focus:border-[#1a1a2e] focus:ring-1 focus:ring-[#1a1a2e] transition-all"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
            className={cn(
              'px-5 py-2 text-sm font-medium transition-all border',
              activeCategory === cat
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#d4a853] hover:text-[#d4a853]'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="max-w-3xl space-y-3 mb-16">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No questions found. Try a different search or category.</p>
          </div>
        ) : (
          filteredFAQs.map((faq, index) => (
            <div key={index} className="border border-gray-200">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp size={18} className="text-[#d4a853] flex-shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 border-t">
                  <p className="text-sm text-gray-600 leading-relaxed pt-4">{faq.answer}</p>
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wider text-[#d4a853] font-medium">{faq.category}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Still have questions */}
      <div className="bg-gray-50 p-8 md:p-12 text-center">
        <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Can&apos;t find the answer you&apos;re looking for? Our support team is ready to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact">
            <button className="bg-black text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 transition-colors">
              Contact Us
            </button>
          </Link>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="border border-gray-300 px-8 py-3 text-sm font-medium hover:border-[#d4a853] hover:text-[#d4a853] transition-colors">
              WhatsApp Support
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
