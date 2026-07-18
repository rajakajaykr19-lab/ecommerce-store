'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { SearchBar } from '@/components/common/search-bar';
import { cn } from '@/lib/utils';
import { Menu, X, Search, Heart, ShoppingBag, User, ChevronDown } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '/' },
  {
    label: 'Shop',
    href: '/shop',
    children: [
      { label: 'All Products', href: '/shop' },
      { label: 'New Arrivals', href: '/shop?sort=newest' },
      { label: 'Best Sellers', href: '/shop?sort=bestseller' },
      { label: 'Sale', href: '/shop?discountPercent=30' },
    ],
  },
  {
    label: 'Men',
    href: '/shop?gender=MEN',
    children: [
      { label: 'Shirts', href: '/shop?gender=MEN&category=shirts' },
      { label: 'T-Shirts', href: '/shop?gender=MEN&category=t-shirts' },
      { label: 'Jeans', href: '/shop?gender=MEN&category=jeans' },
      { label: 'Trousers', href: '/shop?gender=MEN&category=trousers' },
      { label: 'Jackets', href: '/shop?gender=MEN&category=jackets' },
      { label: 'Hoodies', href: '/shop?gender=MEN&category=hoodies' },
      { label: 'Kurtas', href: '/shop?gender=MEN&category=kurtas' },
      { label: 'Blazers', href: '/shop?gender=MEN&category=blazers' },
    ],
  },
  {
    label: 'Women',
    href: '/shop?gender=WOMEN',
    children: [
      { label: 'Sarees', href: '/shop?gender=WOMEN&category=sarees' },
      { label: 'Kurtis', href: '/shop?gender=WOMEN&category=kurtis' },
      { label: 'Dresses', href: '/shop?gender=WOMEN&category=dresses' },
      { label: 'Tops', href: '/shop?gender=WOMEN&category=tops' },
      { label: 'Jeans', href: '/shop?gender=WOMEN&category=jeans' },
      { label: 'Leggings', href: '/shop?gender=WOMEN&category=leggings' },
      { label: 'Nightwear', href: '/shop?gender=WOMEN&category=nightwear' },
    ],
  },
  {
    label: 'Kids',
    href: '/shop?gender=KIDS',
    children: [
      { label: 'Boys Wear', href: '/shop?gender=KIDS&category=boys-wear' },
      { label: 'Girls Wear', href: '/shop?gender=KIDS&category=girls-wear' },
      { label: 'Baby Wear', href: '/shop?gender=KIDS&category=baby-wear' },
      { label: 'School Wear', href: '/shop?gender=KIDS&category=school-wear' },
    ],
  },
  {
    label: 'Accessories',
    href: '/shop?gender=ACCESSORIES',
    children: [
      { label: 'Belts', href: '/shop?gender=ACCESSORIES&category=belts' },
      { label: 'Wallets', href: '/shop?gender=ACCESSORIES&category=wallets' },
      { label: 'Caps', href: '/shop?gender=ACCESSORIES&category=caps' },
      { label: 'Sunglasses', href: '/shop?gender=ACCESSORIES&category=sunglasses' },
      { label: 'Watches', href: '/shop?gender=ACCESSORIES&category=watches' },
    ],
  },
  { label: 'Sale', href: '/shop?discountPercent=30' },
  { label: 'New Arrivals', href: '/shop?sort=newest' },
];

export function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      {/* Top bar */}
      <div className="hidden lg:block bg-black text-white text-xs py-2">
        <div className="container-custom flex items-center justify-between">
          <span className="text-gray-300">Free shipping on orders above ₹499</span>
          <div className="flex items-center gap-4">
            <Link href="/size-guide" className="text-gray-300 hover:text-[#d4a853] transition-colors">Size Guide</Link>
            <Link href="/tracking" className="text-gray-300 hover:text-[#d4a853] transition-colors">Track Order</Link>
            <Link href="/contact" className="text-gray-300 hover:text-[#d4a853] transition-colors">Help & Contact</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link href="/" className="text-2xl lg:text-3xl font-bold tracking-tight text-black whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif' }}>
            STORE NAME
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative group"
                onMouseEnter={() => setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#d4a853] flex items-center gap-1 transition-colors"
                >
                  {link.label}
                  {link.children && <ChevronDown size={14} />}
                </Link>
                {link.children && activeDropdown === link.label && (
                  <div className="absolute top-full left-0 bg-white shadow-xl border min-w-[200px] py-2 animate-fadeIn">
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#d4a853] transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-2 lg:gap-3">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:text-gray-600" aria-label="Search">
              <Search size={20} />
            </button>
            <Link href="/wishlist" className="p-2 hover:text-gray-600 relative" aria-label="Wishlist">
              <Heart size={20} />
            </Link>
            <Link href="/cart" className="p-2 hover:text-gray-600 relative" aria-label="Cart">
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#e94560] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="p-2 hover:text-gray-600" aria-label="Account">
                  <User size={20} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full bg-white shadow-xl border min-w-[200px] py-2 mt-1">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link href="/account" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>My Account</Link>
                    <Link href="/orders" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>My Orders</Link>
                    <Link href="/wishlist" className="block px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>Wishlist</Link>
                    {user.role !== 'CUSTOMER' && (
                      <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-gray-50 border-t" onClick={() => setUserMenuOpen(false)}>Admin Panel</Link>
                    )}
                    <button onClick={() => { logout(); setUserMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 border-t">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="p-2 hover:text-gray-600" aria-label="Login">
                <User size={20} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="container-custom py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between px-2 py-3 text-sm font-medium hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
                {link.children && (
                  <div className="ml-4 space-y-1">
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="border-t pt-4 mt-4">
              {user ? (
                <>
                  <Link href="/account" className="block px-2 py-3 text-sm font-medium" onClick={() => setMobileOpen(false)}>My Account</Link>
                  <Link href="/orders" className="block px-2 py-3 text-sm font-medium" onClick={() => setMobileOpen(false)}>Orders</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-2 py-3 text-sm font-medium text-red-600">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="block px-2 py-3 text-sm font-medium" onClick={() => setMobileOpen(false)}>Sign In</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
