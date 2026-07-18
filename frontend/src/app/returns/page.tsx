import Link from 'next/link';
import { RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return & Exchange Policy',
  description: 'Learn about our hassle-free return and exchange policy. Easy returns within 7 days.',
};

export default function ReturnsPage() {
  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl">
        {/* Hero */}
        <div className="bg-black text-white p-8 md:p-12 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <RotateCcw size={20} className="text-[#d4a853]" />
            <span className="text-[#d4a853] text-sm font-medium tracking-wider uppercase">Returns & Exchanges</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Hassle-Free Returns</h1>
          <p className="text-gray-300 leading-relaxed">
            Not satisfied with your purchase? No worries. We offer easy returns and exchanges to ensure your complete satisfaction.
          </p>
        </div>

        {/* Key Info */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Clock, title: '7-Day Return Window', desc: 'Initiate a return within 7 days of delivery' },
            { icon: CheckCircle, title: 'Free Returns', desc: 'Free pickup on all eligible returns' },
            { icon: RotateCcw, title: 'Easy Exchanges', desc: 'Exchange for a different size or color' },
          ].map((item) => (
            <div key={item.title} className="border p-6 text-center">
              <item.icon size={24} className="mx-auto mb-3 text-[#d4a853]" />
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Return Window */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Return Window</h2>
          <div className="bg-[#d4a853]/10 border border-[#d4a853]/30 p-6">
            <p className="text-sm text-gray-700">
              You can initiate a return within <strong>7 days</strong> from the date of delivery. The return request must be raised through the &quot;My Orders&quot; section of your account or by contacting our customer support team.
            </p>
          </div>
        </section>

        {/* Conditions for Return */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Conditions for Return</h2>
          <p className="text-sm text-gray-600 mb-4">Items must meet the following conditions to be eligible for return:</p>
          <ul className="space-y-3">
            {[
              'The item must be unworn, unwashed, and in its original condition.',
              'All original tags and labels must be attached.',
              'The item must be in its original packaging.',
              'Items must be free from stains, odors, pet hair, or any signs of wear.',
              'The return must be initiated within 7 days of delivery.',
            ].map((condition, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                {condition}
              </li>
            ))}
          </ul>
        </section>

        {/* Non-Returnable Items */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Non-Returnable Items</h2>
          <div className="bg-red-50 border border-red-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-red-500" />
              <h3 className="font-semibold text-sm text-red-700">The following items cannot be returned:</h3>
            </div>
            <ul className="space-y-2">
              {[
                'Innerwear, lingerie, and swimwear',
                'Socks and hosiery',
                'Accessories (belts, caps, sunglasses, watches)',
                'Customized or personalized products',
                'Items marked as "Final Sale" or "Non-Returnable"',
                'Items without original tags or packaging',
                'Products bought during clearance sales (exchange only)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Exchange Process */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Exchange Process</h2>
          <p className="text-sm text-gray-600 mb-4">
            Want a different size or color? Here&apos;s how to exchange:
          </p>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Initiate Exchange', desc: 'Go to "My Orders" and select the item you want to exchange. Choose "Exchange" and select your preferred size or color.' },
              { step: '02', title: 'Schedule Pickup', desc: 'We\'ll arrange a free pickup from your address within 48 hours of the exchange request.' },
              { step: '03', title: 'Ship New Item', desc: 'Once we receive and inspect the original item, we\'ll ship the new size/color to you at no extra cost.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 border border-gray-200 p-5">
                <span className="text-2xl font-bold text-[#d4a853]">{item.step}</span>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Refund Timeline */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Refund Timeline</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Payment Method</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Refund Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Refund To</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { method: 'Credit/Debit Card', time: '5-7 business days', to: 'Original card' },
                  { method: 'UPI', time: '3-5 business days', to: 'Original UPI ID' },
                  { method: 'Net Banking', time: '5-7 business days', to: 'Original bank account' },
                  { method: 'Wallets', time: '3-5 business days', to: 'Original wallet' },
                  { method: 'Cash on Delivery', time: '5-7 business days', to: 'Bank account/UPI (you provide)' },
                ].map((row, i) => (
                  <tr key={row.method} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm font-medium">{row.method}</td>
                    <td className="px-6 py-4 text-sm">{row.time}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How to Initiate */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">How to Initiate a Return</h2>
          <ol className="list-decimal pl-6 space-y-3 text-sm text-gray-600">
            <li>Log in to your account and go to <strong>&quot;My Orders&quot;</strong>.</li>
            <li>Find the order containing the item you wish to return.</li>
            <li>Click <strong>&quot;Initiate Return&quot;</strong> and select the item(s) and reason.</li>
            <li>Choose between <strong>Return (Refund)</strong> or <strong>Exchange</strong>.</li>
            <li>Schedule a free pickup by selecting a convenient date and time slot.</li>
            <li>Pack the item securely in its original packaging with all tags attached.</li>
            <li>Our delivery partner will pick up the item from your address.</li>
            <li>Once received and inspected, your refund will be processed within 5-7 business days.</li>
          </ol>
        </section>

        {/* CTA */}
        <div className="bg-gray-50 p-8 text-center">
          <h2 className="text-xl font-bold mb-3">Need Help with a Return?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Our support team is ready to assist you with any return or exchange queries.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact">
              <button className="bg-black text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2">
                Contact Support <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
