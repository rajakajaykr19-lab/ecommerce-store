export interface User {
  id: string; name: string; email: string; phone?: string; role: string;
  avatar?: string; isActive: boolean; createdAt: string;
}

export interface Address {
  id: string; userId: string; label?: string; fullName: string; phone: string;
  line1: string; line2?: string; city: string; state: string; pincode: string;
  country: string; isDefault: boolean;
}

export interface Category {
  id: string; name: string; slug: string; description?: string; image?: string;
  gender?: string; parentId?: string; isActive: boolean; displayOrder: number;
  _count?: { products: number; children: number };
}

export interface Brand {
  id: string; name: string; slug: string; description?: string; logo?: string;
  isActive: boolean; _count?: { products: number };
}

export interface ProductImage {
  id: string; url: string; alt?: string; width?: number; height?: number;
  isPrimary: boolean; displayOrder: number;
}

export interface ProductVariant {
  id: string; productId: string; size?: string; color?: string; colorHex?: string;
  sku: string; price?: number; stock: number; isActive: boolean;
}

export interface Product {
  id: string; name: string; slug: string; description: string;
  shortDescription?: string; categoryId: string; brandId?: string;
  gender?: string; basePrice: number; salePrice?: number;
  discountPercent?: number; currency: string; sku: string;
  isActive: boolean; isFeatured: boolean; isNewArrival: boolean;
  isBestSeller: boolean; isTrending: boolean;
  category: { id: string; name: string; slug?: string };
  brand?: { id: string; name: string };
  images: ProductImage[]; variants: ProductVariant[];
  primaryImage?: string | null; avgRating?: number; reviewCount?: number;
  inStock?: boolean; totalStock?: number; sizes?: string[]; colors?: { color: string; colorHex: string }[];
  reviews?: Review[]; relatedProducts?: Product[];
  availableVariants?: { size: string; stock: number; color?: string; colorHex?: string }[];
}

export interface Review {
  id: string; productId: string; userId: string; rating: number;
  title?: string; comment?: string; images: string[];
  isVerified: boolean; isActive: boolean; createdAt: string;
  user: { id: string; name: string; avatar?: string };
}

export interface CartItem {
  id: string; userId: string; productId: string; variantId?: string;
  quantity: number; product: Product;
}

export interface WishlistItem {
  id: string; productId: string; createdAt: string;
  product: Product;
}

export interface OrderItem {
  id: string; orderId: string; productId: string; variantId?: string;
  name: string; sku: string; size?: string; color?: string;
  price: number; quantity: number; total: number; image?: string;
  product?: { slug: string; images: ProductImage[] };
}

export interface Order {
  id: string; orderNumber: string; userId: string; addressId: string;
  subtotal: number; discount: number; shipping: number; tax: number;
  total: number; status: OrderStatus; paymentStatus: PaymentStatus;
  paymentMethod: string; paymentId?: string; trackingNumber?: string;
  estimatedDelivery?: string; deliveredAt?: string; createdAt: string;
  items: OrderItem[]; address: Address;
  statusHistory: OrderStatusHistory[];
  user?: { id: string; name: string; email: string };
  upiTxId?: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface OrderStatusHistory {
  id: string; status: OrderStatus; note?: string; createdAt: string;
}

export interface Coupon {
  id: string; code: string; description?: string; discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number; minOrderAmount?: number; maxDiscount?: number;
  usageLimit?: number; usedCount: number; isActive: boolean;
  startsAt: string; expiresAt: string;
}

export interface Banner {
  id: string; title?: string; subtitle?: string; description?: string;
  image: string; mobileImage?: string; link?: string; buttonText?: string;
  position: string; displayOrder: number; isActive: boolean;
}

export interface BlogPost {
  id: string; title: string; slug: string; excerpt?: string; content: string;
  coverImage?: string; author?: string; tags: string[];
  isPublished: boolean; publishedAt?: string; createdAt: string;
}

export interface Pagination {
  page: number; limit: number; total: number; totalPages: number;
  hasNext: boolean; hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean; message?: string; data?: T; pagination?: Pagination; error?: string;
}
