import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  gender?: string;
  minPrice?: string;
  maxPrice?: string;
  sizes?: string;
  colors?: string;
  rating?: string;
  discountPercent?: string;
  isActive?: string;
  isFeatured?: string;
  isNewArrival?: string;
  isBestSeller?: string;
  isTrending?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationInfo;
  error?: string;
}

export interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

export type OrderStatusType = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'REFUNDED';

export type PaymentStatusType = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PICKUP_SCHEDULED' | 'RETURNED' | 'UNDER_INSPECTION' | 'APPROVED_FOR_REFUND' | 'REFUNDED';

export type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ShipmentStatus = 'LABEL_CREATED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED';

export interface OrderFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  courierPartner?: string;
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  state?: string;
  sort?: 'latest' | 'oldest' | 'highest_amount' | 'lowest_amount';
  page?: string;
  limit?: string;
}

export interface BulkOrderAction {
  orderIds: string[];
  action: 'confirm' | 'ship' | 'cancel' | 'status';
  status?: string;
  note?: string;
  courierPartner?: string;
  trackingNumbers?: Record<string, string>;
}

export interface OrderDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  outForDeliveryOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  totalRevenue: number;
  pendingRefunds: number;
  activeReturns: number;
  todayOrders: number;
  todayRevenue: number;
}
