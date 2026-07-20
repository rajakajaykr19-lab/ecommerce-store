const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

type RequestOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, cache, next } = options;
    const token = this.getToken();

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(cache ? { cache } : {}),
      ...(next ? { next } : {}),
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  private async requestText(endpoint: string, options: RequestOptions = {}): Promise<string> {
    const { method = 'GET', body, headers = {} } = options;
    const token = this.getToken();

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Something went wrong');
    }

    return response.text();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', { method: 'POST', body: { email, password } });
  }

  async register(name: string, email: string, password: string, phone?: string) {
    return this.request('/auth/register', { method: 'POST', body: { name, email, password, phone } });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(data: any) {
    return this.request('/auth/profile', { method: 'PUT', body: data });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', { method: 'PUT', body: { currentPassword, newPassword } });
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', { method: 'POST', body: { email } });
  }

  // Products
  async getProducts(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/products${query}`);
  }

  async getProductBySlug(slug: string) {
    return this.request(`/products/${slug}`);
  }

  async getFeaturedProducts() {
    return this.request('/products/featured', { next: { revalidate: 300 } });
  }

  async getNewArrivals() {
    return this.request('/products/new-arrivals', { next: { revalidate: 300 } });
  }

  async getBestSellers() {
    return this.request('/products/best-sellers', { next: { revalidate: 300 } });
  }

  async getTrendingProducts() {
    return this.request('/products/trending', { next: { revalidate: 300 } });
  }

  async searchProducts(q: string) {
    return this.request(`/products/search?q=${encodeURIComponent(q)}`);
  }

  async checkPincode(pincode: string) {
    return this.request(`/products/pincode/${pincode}`);
  }

  async getDescriptionTemplates(categoryId: string) {
    return this.request(`/products/description-templates/${categoryId}`);
  }

  async getRecentlyPurchased(productId: string) {
    return this.request(`/products/recently-purchased/${productId}`);
  }

  async getSellerRating(brandId: string) {
    return this.request(`/products/seller-rating/${brandId}`);
  }

  async getCompleteTheLook(slug: string) {
    return this.request(`/products/look/${slug}`);
  }

  async getFrequentlyBoughtTogether(slug: string) {
    return this.request(`/products/together/${slug}`);
  }

  async getQuestions(productId: string, page = 1) {
    return this.request(`/questions/product/${productId}?page=${page}`);
  }

  async askQuestion(productId: string, question: string) {
    return this.request(`/questions/product/${productId}`, { method: 'POST', body: { question } });
  }

  async upvoteQuestion(id: string) {
    return this.request(`/questions/${id}/upvote`, { method: 'POST' });
  }

  // Cart
  async getCart() {
    return this.request('/cart');
  }

  async addToCart(productId: string, quantity: number = 1, variantId?: string) {
    return this.request('/cart', { method: 'POST', body: { productId, quantity, variantId } });
  }

  async updateCartItem(id: string, quantity: number) {
    return this.request(`/cart/${id}`, { method: 'PUT', body: { quantity } });
  }

  async removeFromCart(id: string) {
    return this.request(`/cart/${id}`, { method: 'DELETE' });
  }

  async clearCart() {
    return this.request('/cart', { method: 'DELETE' });
  }

  // Wishlist
  async getWishlist() {
    return this.request('/wishlist');
  }

  async addToWishlist(productId: string) {
    return this.request('/wishlist', { method: 'POST', body: { productId } });
  }

  async removeFromWishlist(id: string) {
    return this.request(`/wishlist/${id}`, { method: 'DELETE' });
  }

  async toggleWishlist(productId: string) {
    return this.request('/wishlist/toggle', { method: 'POST', body: { productId } });
  }

  // Orders
  async createOrder(data: any) {
    return this.request('/orders', { method: 'POST', body: data });
  }

  async getOrders(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/orders${query}`);
  }

  async getOrderByNumber(orderNumber: string) {
    return this.request(`/orders/${orderNumber}`);
  }

  async cancelOrder(orderNumber: string) {
    return this.request(`/orders/${orderNumber}/cancel`, { method: 'POST' });
  }

  async generateInvoice(orderId: string) {
    return this.request('/invoices/generate/' + orderId, { method: 'POST' });
  }

  async getInvoice(orderNumber: string) {
    return this.request('/invoices/' + orderNumber);
  }

  async trackOrder(orderNumber: string) {
    return this.request(`/orders/track/${orderNumber}`);
  }

  // Addresses
  async getAddresses() {
    return this.request('/addresses');
  }

  async createAddress(data: any) {
    return this.request('/addresses', { method: 'POST', body: data });
  }

  async updateAddress(id: string, data: any) {
    return this.request(`/addresses/${id}`, { method: 'PUT', body: data });
  }

  async deleteAddress(id: string) {
    return this.request(`/addresses/${id}`, { method: 'DELETE' });
  }

  // Payments
  async createRazorpayOrder(orderId: string) {
    return this.request('/payments/razorpay/create', { method: 'POST', body: { orderId } });
  }

  async verifyRazorpayPayment(data: any) {
    return this.request('/payments/razorpay/verify', { method: 'POST', body: data });
  }

  async createStripePaymentIntent(orderId: string) {
    return this.request('/payments/stripe/create-intent', { method: 'POST', body: { orderId } });
  }

  // Reviews
  async createReview(data: any) {
    return this.request('/reviews', { method: 'POST', body: data });
  }

  async getProductReviews(productId: string, params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/reviews/product/${productId}${query}`);
  }

  // Public
  async getCategories() {
    return this.request('/categories', { next: { revalidate: 3600 } });
  }

  async getBrands() {
    return this.request('/brands', { next: { revalidate: 3600 } });
  }

  async getBanners() {
    return this.request('/banners', { next: { revalidate: 3600 } });
  }

  async getFAQs() {
    return this.request('/faqs', { next: { revalidate: 3600 } });
  }

  async getPolicies() {
    return this.request('/policies', { next: { revalidate: 3600 } });
  }

  async getBlogPosts() {
    return this.request('/blog', { next: { revalidate: 600 } });
  }

  async getSettings() {
    return this.request('/settings', { next: { revalidate: 3600 } });
  }

  async submitContact(data: any) {
    return this.request('/contact', { method: 'POST', body: data });
  }

  async subscribe(email: string) {
    return this.request('/subscribe', { method: 'POST', body: { email } });
  }

  async validateCoupon(code: string, subtotal: number) {
    return this.request(`/coupons/validate/${encodeURIComponent(code)}?subtotal=${subtotal}`);
  }

  // Admin
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAdminProducts(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/products${query}`);
  }

  async createProduct(data: any) {
    return this.request('/admin/products', { method: 'POST', body: data });
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/admin/products/${id}`, { method: 'PUT', body: data });
  }

  async deleteProduct(id: string) {
    return this.request(`/admin/products/${id}`, { method: 'DELETE' });
  }

  // Admin: Categories (Enhanced)
  async getCategoryDashboardStats() { return this.request('/admin/categories/dashboard-stats'); }
  async getAdminCategories(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/categories${query}`);
  }
  async getAdminCategory(id: string) { return this.request(`/admin/categories/${id}`); }
  async getAllCategoriesFlat() { return this.request('/admin/categories/all-flat'); }
  async createCategory(data: any) { return this.request('/admin/categories', { method: 'POST', body: data }); }
  async updateCategory(id: string, data: any) { return this.request(`/admin/categories/${id}`, { method: 'PUT', body: data }); }
  async deleteCategory(id: string) { return this.request(`/admin/categories/${id}`, { method: 'DELETE' }); }
  async duplicateCategory(id: string) { return this.request(`/admin/categories/${id}/duplicate`, { method: 'POST' }); }
  async bulkCategoryOperations(data: { action: string; categoryIds: string[]; parentId?: string; displayOrder?: number }) {
    return this.request('/admin/categories/bulk', { method: 'POST', body: data });
  }
  async reorderCategories(orderedIds: string[]) {
    return this.request('/admin/categories/reorder', { method: 'POST', body: { orderedIds } });
  }

  async getAdminBrands() { return this.request('/admin/brands'); }
  async createBrand(data: any) { return this.request('/admin/brands', { method: 'POST', body: data }); }
  async updateBrand(id: string, data: any) { return this.request(`/admin/brands/${id}`, { method: 'PUT', body: data }); }
  async deleteBrand(id: string) { return this.request(`/admin/brands/${id}`, { method: 'DELETE' }); }

  async getAdminBanners() { return this.request('/admin/banners'); }
  async createBanner(data: any) { return this.request('/admin/banners', { method: 'POST', body: data }); }
  async updateBanner(id: string, data: any) { return this.request(`/admin/banners/${id}`, { method: 'PUT', body: data }); }
  async deleteBanner(id: string) { return this.request(`/admin/banners/${id}`, { method: 'DELETE' }); }

  async getAdminOrders(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/orders${query}`);
  }

  async updateOrderStatus(id: string, data: any) {
    return this.request(`/admin/orders/${id}/status`, { method: 'PUT', body: data });
  }

  async getAdminCustomers(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/customers${query}`);
  }

  async getAdminCoupons(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/coupons${query}`);
  }
  async getAdminCoupon(id: string) { return this.request(`/admin/coupons/${id}`); }
  async createCoupon(data: any) { return this.request('/admin/coupons', { method: 'POST', body: data }); }
  async updateCoupon(id: string, data: any) { return this.request(`/admin/coupons/${id}`, { method: 'PUT', body: data }); }
  async deleteCoupon(id: string) { return this.request(`/admin/coupons/${id}`, { method: 'DELETE' }); }

  async getAdminReviews() { return this.request('/admin/reviews'); }
  async toggleReview(id: string) { return this.request(`/admin/reviews/${id}/toggle`, { method: 'PUT' }); }
  async deleteReview(id: string) { return this.request(`/admin/reviews/${id}`, { method: 'DELETE' }); }

  async getAdminBlogs() { return this.request('/admin/blog'); }
  async createBlog(data: any) { return this.request('/admin/blog', { method: 'POST', body: data }); }
  async updateBlog(id: string, data: any) { return this.request(`/admin/blog/${id}`, { method: 'PUT', body: data }); }
  async deleteBlog(id: string) { return this.request(`/admin/blog/${id}`, { method: 'DELETE' }); }

  async getAdminSettings() { return this.request('/admin/settings'); }
  async updateSettings(data: any) { return this.request('/admin/settings', { method: 'PUT', body: data }); }

  async getAdminPolicies() { return this.request('/admin/policies'); }
  async updatePolicy(type: string, data: any) { return this.request(`/admin/policies/${type}`, { method: 'PUT', body: data }); }

  async getContactMessages() { return this.request('/admin/contact-messages'); }
  async getSubscribers() { return this.request('/admin/subscribers'); }

  async getAdminFAQs() { return this.request('/admin/faqs'); }
  async createFAQ(data: any) { return this.request('/admin/faqs', { method: 'POST', body: data }); }
  async updateFAQ(id: string, data: any) { return this.request(`/admin/faqs/${id}`, { method: 'PUT', body: data }); }
  async deleteFAQ(id: string) { return this.request(`/admin/faqs/${id}`, { method: 'DELETE' }); }

  async getAnalytics() { return this.request('/admin/analytics'); }

  async getAdminUsers(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/users${query}`);
  }
  async getAdminUser(id: string) { return this.request(`/admin/users/${id}`); }
  async updateAdminUser(id: string, data: any) { return this.request(`/admin/users/${id}`, { method: 'PUT', body: data }); }
  async updateUserRole(id: string, data: any) { return this.request(`/admin/users/${id}/role`, { method: 'PUT', body: data }); }

  // Employees
  async getEmployees() { return this.request('/admin/employees'); }
  async createEmployee(data: any) { return this.request('/admin/employees', { method: 'POST', body: data }); }
  async updateEmployee(id: string, data: any) { return this.request(`/admin/employees/${id}`, { method: 'PUT', body: data }); }
  async deleteEmployee(id: string) { return this.request(`/admin/employees/${id}`, { method: 'DELETE' }); }

  // Attributes
  async getAttributeGroups() { return this.request('/attributes/groups'); }
  async createAttributeGroup(data: any) { return this.request('/attributes/groups', { method: 'POST', body: data }); }
  async updateAttributeGroup(id: string, data: any) { return this.request(`/attributes/groups/${id}`, { method: 'PUT', body: data }); }
  async deleteAttributeGroup(id: string) { return this.request(`/attributes/groups/${id}`, { method: 'DELETE' }); }

  async getAttributes(groupId?: string) {
    const query = groupId ? `?groupId=${groupId}` : '';
    return this.request(`/attributes${query}`);
  }
  async createAttribute(data: any) { return this.request('/attributes', { method: 'POST', body: data }); }
  async updateAttribute(id: string, data: any) { return this.request(`/attributes/${id}`, { method: 'PUT', body: data }); }
  async deleteAttribute(id: string) { return this.request(`/attributes/${id}`, { method: 'DELETE' }); }

  async getSubcategoryAttributes(subcategoryId: string) { return this.request(`/attributes/subcategory/${subcategoryId}`); }
  async getAllSubcategoryAttributes() { return this.request('/attributes/subcategory-all'); }
  async setSubcategoryAttributes(subcategoryId: string, attributes: any[]) { return this.request(`/attributes/subcategory/${subcategoryId}`, { method: 'PUT', body: { attributes } }); }

  async getProductAttributes(productId: string) { return this.request(`/attributes/product/${productId}`); }
  async setProductAttributes(productId: string, attributes: any[]) { return this.request(`/attributes/product/${productId}`, { method: 'PUT', body: { attributes } }); }

  async getSubcategoryAttributesPublic(subcategoryId: string) { return this.request(`/attributes/public/subcategory/${subcategoryId}`); }

  async getAdminDashboardStats() { return this.request('/admin/dashboard/stats'); }
  async getAdminSalesReport(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/dashboard/sales-report${query}`);
  }

  async updateAdminSettings(data: any) { return this.request('/admin/settings', { method: 'PUT', body: data }); }

  async getBackups() { return this.request('/admin/backups'); }

  async adminVerifyPayment(orderId: string) {
    return this.request(`/admin/orders/${orderId}/verify-payment`, { method: 'PUT' });
  }

  async getOrderDetail(orderId: string) {
    return this.request(`/admin/orders/${orderId}`);
  }

  async getOrderDashboardStats() {
    return this.request('/admin/orders/dashboard-stats');
  }

  // Bulk Order Operations
  async bulkUpdateOrderStatus(orderIds: string[], status: string, note?: string) {
    return this.request('/admin/orders/bulk/status', { method: 'POST', body: { orderIds, status, note } });
  }

  async bulkConfirmOrders(orderIds: string[]) {
    return this.request('/admin/orders/bulk/confirm', { method: 'POST', body: { orderIds } });
  }

  async bulkShipOrders(orderIds: string[], courierPartner: string, trackingNumbers: Record<string, string>) {
    return this.request('/admin/orders/bulk/ship', { method: 'POST', body: { orderIds, courierPartner, trackingNumbers } });
  }

  async bulkCancelOrders(orderIds: string[], reason?: string) {
    return this.request('/admin/orders/bulk/cancel', { method: 'POST', body: { orderIds, reason } });
  }

  async exportOrders(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.requestText(`/admin/orders/export${query}`);
  }

  // Returns
  async getAdminReturns(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/returns${query}`);
  }

  async getReturnById(id: string) {
    return this.request(`/admin/returns/${id}`);
  }

  async updateReturnStatus(id: string, data: any) {
    return this.request(`/admin/returns/${id}/status`, { method: 'PUT', body: data });
  }

  async createReturnRequest(data: any) {
    return this.request('/orders/returns/request', { method: 'POST', body: data });
  }

  async getCustomerReturns(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/orders/returns/list${query}`);
  }

  // Refunds
  async getAdminRefunds(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/refunds${query}`);
  }

  async getRefundById(id: string) {
    return this.request(`/admin/refunds/${id}`);
  }

  async createRefund(data: any) {
    return this.request('/admin/refunds', { method: 'POST', body: data });
  }

  async updateRefundStatus(id: string, data: any) {
    return this.request(`/admin/refunds/${id}/status`, { method: 'PUT', body: data });
  }

  // Shipments
  async getAdminShipments(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/shipments${query}`);
  }

  async getShipmentById(id: string) {
    return this.request(`/admin/shipments/${id}`);
  }

  async createShipment(data: any) {
    return this.request('/admin/shipments', { method: 'POST', body: data });
  }

  async updateShipment(id: string, data: any) {
    return this.request(`/admin/shipments/${id}`, { method: 'PUT', body: data });
  }

  async getCourierPartners() {
    return this.request('/admin/courier-partners');
  }

  // Invoice PDF
  async getInvoicePDF(invoiceNumber: number) {
    return this.request(`/invoices/pdf/${invoiceNumber}`);
  }

  async getShippingLabelPDF(shipmentId: string) {
    return this.request(`/invoices/shipping-label/${shipmentId}`);
  }

  // Inventory
  async lockInventory(items: any[]) {
    return this.request('/inventory/lock', { method: 'POST', body: items });
  }

  async releaseInventory() {
    return this.request('/inventory/release', { method: 'POST' });
  }

  async confirmInventory() {
    return this.request('/inventory/confirm', { method: 'POST' });
  }
}

export const api = new ApiClient(API_BASE);
