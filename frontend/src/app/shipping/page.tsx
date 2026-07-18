import Link from 'next/link';
import { Truck, Clock, MapPin, Globe, Package, CreditCard } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Learn about our shipping methods, charges, delivery timelines, and coverage areas.',
};

const shippingMethods = [
  {
    name: 'Standard Shipping',
    time: '3-7 Business Days',
    charge: 'Free above ₹999 | ₹99 below ₹999',
    description: 'Our reliable standard shipping covers all serviceable pin codes across India.',
  },
  {
    name: 'Express Shipping',
    time: '1-3 Business Days',
    charge: '₹199 per order',
    description: 'Get your order faster with our express shipping option available for major metro and tier 1 cities.',
  },
  {
    name: 'Cash on Delivery',
    time: '3-7 Business Days',
    charge: '₹49 additional (Orders up to ₹5,000)',
    description: 'Pay when you receive your order. Available for orders up to ₹5,000 in select areas.',
  },
];

const coverageAreas = [
  { tier: 'Tier 1 Cities', cities: 'Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad', time: '2-4 Business Days' },
  { tier: 'Tier 2 Cities', cities: 'Jaipur, Lucknow, Chandigarh, Bhopal, Indore, Nagpur, Coimbatore, Kochi', time: '4-6 Business Days' },
  { tier: 'Tier 3 & Other Cities', cities: 'All other serviceable pin codes across India', time: '5-7 Business Days' },
];

export default function ShippingPage() {
  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl">
        {/* Hero */}
        <div className="bg-black text-white p-8 md:p-12 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={20} className="text-[#d4a853]" />
            <span className="text-[#d4a853] text-sm font-medium tracking-wider uppercase">Shipping</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Shipping Policy</h1>
          <p className="text-gray-300 leading-relaxed">
            We aim to deliver your orders safely and on time. Here&apos;s everything you need to know about our shipping process.
          </p>
        </div>

        {/* Key Highlights */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Package, title: 'Free Shipping', desc: 'On all orders above ₹999' },
            { icon: Clock, title: 'Fast Delivery', desc: '2-7 business days' },
            { icon: CreditCard, title: 'Secure Packaging', desc: 'Premium packaging for every order' },
          ].map((item) => (
            <div key={item.title} className="border p-6 text-center">
              <item.icon size={24} className="mx-auto mb-3 text-[#d4a853]" />
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Shipping Methods */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Shipping Methods & Charges</h2>
          <div className="space-y-4">
            {shippingMethods.map((method) => (
              <div key={method.name} className="border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h3 className="font-semibold">{method.name}</h3>
                  <span className="text-sm font-medium text-[#d4a853]">{method.time}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                <p className="text-sm font-medium text-gray-900">Charge: {method.charge}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Coverage Areas */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Delivery Coverage</h2>
          <p className="text-sm text-gray-600 mb-6">
            We deliver to all serviceable pin codes across India. Enter your pin code on any product page to check delivery availability.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Area Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Major Cities</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Estimated Time</th>
                </tr>
              </thead>
              <tbody>
                {coverageAreas.map((area, i) => (
                  <tr key={area.tier} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm font-medium">{area.tier}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{area.cities}</td>
                    <td className="px-6 py-4 text-sm">{area.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Order Tracking */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Order Tracking</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>Once your order is shipped, you will receive:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>An email with the tracking number and carrier details.</li>
              <li>SMS updates at key milestones (shipped, out for delivery, delivered).</li>
              <li>You can also track your order from the <strong>&quot;My Orders&quot;</strong> section in your account.</li>
            </ul>
          </div>
        </section>

        {/* Important Notes */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Important Notes</h2>
          <ul className="list-disc pl-6 space-y-3 text-sm text-gray-600">
            <li>Delivery timelines are estimates and may vary due to unforeseen circumstances such as weather, festivals, or carrier delays.</li>
            <li>Please provide an accurate shipping address with a valid pin code. Incorrect addresses may delay delivery.</li>
            <li>For COD orders, please keep the exact change ready at the time of delivery.</li>
            <li>Orders placed before 2:00 PM IST are usually processed the same day. Orders placed after 2:00 PM are processed the next business day.</li>
            <li>During sale events and festive seasons, delivery may take an additional 2-3 business days.</li>
          </ul>
        </section>

        {/* International Shipping */}
        <section className="bg-gray-50 p-8 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Globe size={24} className="text-[#d4a853]" />
            <h2 className="text-xl font-bold">International Shipping</h2>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            International shipping is coming soon! We&apos;re working on making our premium collections available to customers worldwide.
          </p>
          <p className="text-sm text-gray-500">
            Subscribe to our newsletter to be the first to know when we launch international delivery.
          </p>
        </section>

        {/* Contact */}
        <section>
          <p className="text-sm text-gray-600">
            For any shipping-related queries, please contact our support team at <strong>support@storename.com</strong> or call <strong>+91 98765 43210</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
