import Link from 'next/link';
import { XCircle, Clock, CreditCard, Phone, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation Policy',
  description: 'Learn about our order cancellation process, conditions, and refund timeline.',
};

export default function CancellationPage() {
  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl">
        {/* Hero */}
        <div className="bg-black text-white p-8 md:p-12 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <XCircle size={20} className="text-[#d4a853]" />
            <span className="text-[#d4a853] text-sm font-medium tracking-wider uppercase">Cancellations</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Cancellation Policy</h1>
          <p className="text-gray-300 leading-relaxed">
            We understand that plans change. Here&apos;s everything you need to know about cancelling your order.
          </p>
        </div>

        {/* How to Cancel */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">How to Cancel Your Order</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-50 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">A</span>
                </div>
                <h3 className="font-semibold">Before Shipping (Easy Cancellation)</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                If your order has not been shipped yet, you can cancel it directly from your account:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-600">
                <li>Go to <strong>&quot;My Orders&quot;</strong> in your account.</li>
                <li>Find the order you want to cancel.</li>
                <li>Click <strong>&quot;Cancel Order&quot;</strong> and select a reason.</li>
                <li>Confirm the cancellation.</li>
              </ol>
              <p className="text-sm text-green-600 mt-3 font-medium">
                Full refund will be processed to your original payment method.
              </p>
            </div>

            <div className="border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-50 flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-sm">B</span>
                </div>
                <h3 className="font-semibold">After Shipping (Refused Delivery)</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                If your order has already been shipped but not yet delivered:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600">
                <li>You may refuse to accept the delivery when the courier arrives.</li>
                <li>The order will be automatically returned to us.</li>
                <li>A full refund will be processed once we receive the returned package.</li>
                <li>Please note this may take 7-10 business days.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Cancellation Conditions */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Cancellation Conditions</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853] mt-1.5 flex-shrink-0" />
              Orders can be cancelled for free within 2 hours of placement (before shipping).
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853] mt-1.5 flex-shrink-0" />
              COD orders can be cancelled at any time before delivery.
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853] mt-1.5 flex-shrink-0" />
              Orders that have already been delivered cannot be cancelled. Please use our return process instead.
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853] mt-1.5 flex-shrink-0" />
              Customized or personalized orders cannot be cancelled once production has started.
            </li>
          </ul>
        </section>

        {/* Refund Process */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Refund After Cancellation</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={18} className="text-[#d4a853]" />
                <h3 className="font-semibold text-sm">Online Payment Orders</h3>
              </div>
              <p className="text-sm text-gray-600">
                Full refund is processed to the original payment method within <strong>5-7 business days</strong> of cancellation confirmation.
              </p>
            </div>
            <div className="border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={18} className="text-[#d4a853]" />
                <h3 className="font-semibold text-sm">COD Orders</h3>
              </div>
              <p className="text-sm text-gray-600">
                Refund is credited to your bank account or UPI ID within <strong>5-7 business days</strong>. Please provide your account details during the cancellation.
              </p>
            </div>
          </div>
        </section>

        {/* Contact for Cancellation */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6">Need Help Cancelling?</h2>
          <div className="bg-gray-50 p-6">
            <p className="text-sm text-gray-600 mb-4">
              If you&apos;re unable to cancel through your account, our support team is here to help:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-[#d4a853]" />
                <span className="text-sm"><strong>Phone:</strong> +91 98765 43210 (Mon-Sat, 10AM-8PM)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#d4a853] text-xs font-bold">✉</span>
                <span className="text-sm"><strong>Email:</strong> support@storename.com</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Please have your order number ready for faster assistance. Order numbers are sent to your email upon purchase.
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Want to check your order status?
          </p>
          <Link href="/auth/login">
            <button className="bg-black text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2">
              Go to My Orders <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
