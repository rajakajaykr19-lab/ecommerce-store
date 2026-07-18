import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how we collect, use, protect, and handle your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: January 1, 2025</p>

        <div className="prose-custom space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="mb-3">We collect information to provide and improve our services. The types of information we collect include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, shipping and billing addresses when you create an account or place an order.</li>
              <li><strong>Payment Information:</strong> Credit/debit card numbers, UPI IDs, or wallet details, processed securely through our payment partners. We do not store full card numbers.</li>
              <li><strong>Usage Data:</strong> Browsing history, pages viewed, products searched, time spent on pages, and other interaction data collected automatically.</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers.</li>
              <li><strong>Communication Data:</strong> Messages, reviews, and feedback you send to our customer support.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To process and fulfill your orders, including shipping and payment processing.</li>
              <li>To create and manage your account and provide personalized experiences.</li>
              <li>To communicate order updates, promotional offers, and important service notifications.</li>
              <li>To improve our website, products, and services through analytics and feedback.</li>
              <li>To detect and prevent fraud, unauthorized access, and other security threats.</li>
              <li>To comply with legal obligations and resolve disputes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Information Sharing</h2>
            <p className="mb-3">We do not sell your personal information. We may share your data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Shipping carriers, payment gateways, and technology partners who assist in operating our business, under strict confidentiality agreements.</li>
              <li><strong>Legal Authorities:</strong> When required by law, court order, or to protect our rights and safety.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with prior notice to you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information, including SSL encryption, secure servers, firewalls, and regular security audits. While we strive to protect your data, no method of transmission over the Internet is 100% secure. We encourage you to use strong passwords and keep your account credentials confidential.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Cookies & Tracking Technologies</h2>
            <p className="mb-3">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Remember your preferences and cart items.</li>
              <li>Analyze website traffic and user behavior.</li>
              <li>Deliver relevant advertisements and marketing.</li>
              <li>Enable social media features and third-party integrations.</li>
            </ul>
            <p className="mt-3">
              You can manage cookie preferences through your browser settings. Disabling certain cookies may affect website functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to read the privacy policies of any third-party site you visit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Children&apos;s Privacy</h2>
            <p>
              Our website is not intended for children under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal data, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Your Rights</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> You can request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> You can update or correct inaccurate information through your account settings.</li>
              <li><strong>Deletion:</strong> You can request deletion of your account and personal data, subject to legal retention requirements.</li>
              <li><strong>Opt-Out:</strong> You can unsubscribe from marketing emails by clicking the unsubscribe link in any email.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Contact Us</h2>
            <p>
              For any questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> privacy@storename.com<br />
              <strong>Address:</strong> 123 Fashion Street, Mumbai, Maharashtra 400001, India<br />
              <strong>Phone:</strong> +91 98765 43210
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
