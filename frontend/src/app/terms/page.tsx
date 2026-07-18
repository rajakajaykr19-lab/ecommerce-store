import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Read the terms and conditions governing the use of our website and services.',
};

export default function TermsPage() {
  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: January 1, 2025</p>

        <div className="prose-custom space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              Welcome to our website. These Terms and Conditions (&quot;Terms&quot;) govern your use of our website, products, and services. By accessing or using our website, you agree to be bound by these Terms. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Definitions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>&quot;We&quot;, &quot;Us&quot;, &quot;Our&quot;</strong> refers to the company operating this website.</li>
              <li><strong>&quot;You&quot;, &quot;User&quot;</strong> refers to any individual accessing or using our website.</li>
              <li><strong>&quot;Products&quot;</strong> refers to garments, accessories, and other items available for purchase.</li>
              <li><strong>&quot;Services&quot;</strong> refers to all services provided through this website, including shopping, delivery, and customer support.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Orders</h2>
            <p className="mb-3">
              By placing an order, you are making an offer to purchase our products. All orders are subject to availability and acceptance. We reserve the right to refuse or cancel any order for any reason, including limitations on quantities available, inaccuracies in product or pricing information, or errors identified by our fraud detection system.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prices and availability are subject to change without notice.</li>
              <li>We reserve the right to limit the quantity of items purchased per person, per household, or per order.</li>
              <li>An order confirmation email does not constitute acceptance of your order.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Payment</h2>
            <p>
              We accept payments through UPI, credit/debit cards, net banking, digital wallets, and Cash on Delivery (COD) where available. All online payments are processed through secure, PCI-DSS compliant payment gateways. You agree to provide accurate and complete payment information. COD payments must be made in full at the time of delivery.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Shipping & Delivery</h2>
            <p className="mb-3">
              We endeavor to deliver products within the estimated time frames, but delivery dates are not guaranteed. We are not liable for delays caused by shipping carriers, natural disasters, or events beyond our control.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Free shipping is available on orders above ₹999.</li>
              <li>Risk of loss and title for products pass to you upon delivery.</li>
              <li>Please inspect your order upon delivery and report any issues within 48 hours.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Returns & Refunds</h2>
            <p>
              Products may be returned within 7 days of delivery, subject to our Return Policy. Items must be in their original condition with tags attached. Certain items, including innerwear, accessories, and customized products, are non-returnable. Refunds will be processed to the original payment method within 5-7 business days of receiving the returned item.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Privacy</h2>
            <p>
              Your use of our website is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices regarding the collection, use, and disclosure of your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Intellectual Property</h2>
            <p>
              All content on this website, including text, graphics, logos, images, product descriptions, and software, is the property of our company or our content suppliers and is protected by Indian and international copyright laws. You may not reproduce, distribute, modify, or create derivative works without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of our website or products. Our total liability for any claim arising out of these Terms shall not exceed the amount paid by you for the product in question.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. Changes will be effective upon posting on this page. Your continued use of the website following any changes constitutes acceptance of the new Terms. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">12. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at <strong>legal@storename.com</strong> or write to us at our registered address in Mumbai, Maharashtra.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
