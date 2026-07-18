import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { Toaster } from 'react-hot-toast';
import { WhatsAppButton } from '@/components/common/whatsapp-button';
import { OrganizationJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: { default: 'STORE NAME - Premium Fashion', template: '%s | STORE NAME' },
  description: 'Discover the latest fashion trends. Shop premium clothing for men, women, and kids.',
  keywords: ['fashion', 'clothing', 'online shopping', 'trends', 'premium fashion'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'STORE NAME',
    title: 'STORE NAME - Premium Fashion',
    description: 'Discover the latest fashion trends.',
  },
  twitter: { card: 'summary_large_image', title: 'STORE NAME', description: 'Premium Fashion Destination' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col">
        <OrganizationJsonLd />
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppButton />
          <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#000000', color: '#fff', fontSize: '14px', border: '1px solid #333' } }} />
        </Providers>
      </body>
    </html>
  );
}
