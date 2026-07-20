import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string, currency = 'INR'): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateStars(rating: number): string[] {
  const stars: string[] = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars.push('full');
    else if (i - rating < 1) stars.push('half');
    else stars.push('empty');
  }
  return stars;
}

export function getDiscountPercent(basePrice: number, salePrice: number): number {
  if (!salePrice || salePrice >= basePrice) return 0;
  return Math.round(((basePrice - salePrice) / basePrice) * 100);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    RETURNED: 'bg-orange-100 text-orange-800',
    REFUNDED: 'bg-teal-100 text-teal-800',
    SUCCESS: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function validatePincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  [key: string]: any;
}

export interface CategoryOption extends CategoryItem {
  displayName: string;
  level: number;
}

export function buildCategoryOptions(categories: CategoryItem[]): CategoryOption[] {
  const parentMap = new Map<string, CategoryItem[]>();
  const roots: CategoryItem[] = [];

  for (const cat of categories) {
    if (cat.parentId) {
      if (!parentMap.has(cat.parentId)) parentMap.set(cat.parentId, []);
      parentMap.get(cat.parentId)!.push(cat);
    } else {
      roots.push(cat);
    }
  }

  const result: CategoryOption[] = [];
  const traverse = (items: CategoryItem[], level: number) => {
    for (const item of items) {
      result.push({
        ...item,
        displayName: level > 0 ? `${'─'.repeat(level)} ${item.name}` : item.name,
        level,
      });
      const children = parentMap.get(item.id);
      if (children) traverse(children, level + 1);
    }
  };
  traverse(roots, 0);
  return result;
}

const CLOTHING_PARENT_NAMES = ['Men', 'Women', 'Kids'];

export function isClothingCategory(categories: CategoryItem[], categoryId: string): boolean {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return false;
  if (CLOTHING_PARENT_NAMES.includes(cat.name)) return true;
  if (cat.parentId) {
    const parent = categories.find((c) => c.id === cat.parentId);
    if (parent && CLOTHING_PARENT_NAMES.includes(parent.name)) return true;
  }
  return false;
}

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  return url;
}

export function isBabyCategory(categories: CategoryItem[], categoryId: string): boolean {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return false;
  if (cat.name === 'Baby') return true;
  if (cat.parentId) {
    const parent = categories.find((c) => c.id === cat.parentId);
    if (parent && parent.name === 'Baby') return true;
  }
  return false;
}
