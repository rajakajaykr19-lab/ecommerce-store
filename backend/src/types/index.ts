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
