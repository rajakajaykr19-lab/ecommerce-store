# API Reference - Premium Garments Store

Base URL: `http://localhost:5000/api/v1`

## Authentication
All protected routes require `Authorization: Bearer <token>` header.

## Public Routes

### Products
- `GET /products` - List products (query: category, brand, minPrice, maxPrice, search, sort, page, limit)
- `GET /products/:slug` - Get product by slug
- `GET /products/:id/reviews` - Get product reviews

### Categories
- `GET /categories` - List categories
- `GET /categories/:slug` - Get category by slug

### Brands
- `GET /brands` - List brands

### Coupons
- `GET /coupons/validate/:code` - Validate a coupon code

### Wishlist
- `POST /wishlist/:productId` - Add to wishlist (optional auth)
- `DELETE /wishlist/:productId` - Remove from wishlist (optional auth)
- `GET /wishlist` - Get wishlist (optional auth)

### Site Settings
- `GET /settings` - Get public site settings

### Newsletter
- `POST /newsletter/subscribe` - Subscribe to newsletter
- `DELETE /newsletter/unsubscribe` - Unsubscribe from newsletter

## Auth Routes
- `POST /auth/register` - Register user
- `POST /auth/login` - Login (returns accessToken + refreshToken)
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user (protected)
- `PUT /auth/profile` - Update profile (protected)
- `PUT /auth/password` - Change password (protected)
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

## Protected Routes (Customer)
- `GET /orders` - My orders
- `GET /orders/:orderNumber` - My order detail
- `POST /orders` - Create order
- `GET /addresses` - My addresses
- `POST /addresses` - Add address
- `PUT /addresses/:id` - Update address
- `DELETE /addresses/:id` - Delete address
- `POST /cart` - Get cart with pricing
- `GET /coupons/my` - My coupons

## Payment Routes
- `POST /payments/razorpay/create-order` - Create Razorpay order
- `POST /payments/razorpay/verify` - Verify Razorpay payment
- `POST /payments/stripe/create-intent` - Create Stripe payment intent
- `POST /payments/stripe/confirm` - Confirm Stripe payment
- `GET /payments/:orderId/status` - Get payment status

## Upload Routes (Admin)
- `POST /upload/product-images` - Upload product images (max 10)

## Invoice Routes
- `POST /invoices/:orderId` - Generate invoice (admin)
- `GET /invoices/:orderId` - Get invoice (admin)
- `GET /invoices/:orderId/download` - Download invoice HTML

## Inventory Routes
- `POST /inventory/lock` - Lock stock (auth required)
- `POST /inventory/release` - Release stock lock (auth required)
- `POST /inventory/confirm` - Confirm stock (auth required)

## Admin Routes (ADMIN/MANAGER/SELLER)
### Dashboard
- `GET /admin/dashboard` - Dashboard stats
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/dashboard/sales-report` - Sales report (query: startDate, endDate)

### Products
- `GET /admin/products` - List all products
- `POST /admin/products` - Create product
- `PUT /admin/products/:id` - Update product
- `DELETE /admin/products/:id` - Delete product

### Categories
- `GET /admin/categories` - List all categories
- `POST /admin/categories` - Create category
- `PUT /admin/categories/:id` - Update category
- `DELETE /admin/categories/:id` - Delete category

### Orders
- `GET /admin/orders` - List all orders (query: status, paymentStatus, page, limit)
- `GET /admin/orders/:orderNumber` - Order detail
- `PUT /admin/orders/:orderNumber/status` - Update order status
- `PUT /admin/orders/:id/verify-payment` - Verify UPI payment

### Coupons
- `GET /admin/coupons` - List all coupons
- `POST /admin/coupons` - Create coupon
- `PUT /admin/coupons/:id` - Update coupon
- `DELETE /admin/coupons/:id` - Delete coupon

### Users
- `GET /admin/users` - List users (query: role, search, page, limit)
- `GET /admin/users/:id` - User detail
- `PUT /admin/users/:id` - Update user role

### Settings
- `GET /admin/settings` - Get site settings
- `PUT /admin/settings` - Update site settings

### Inventory Management
- `GET /admin/inventory` - Inventory dashboard
- `GET /admin/inventory/low-stock` - Low stock products
- `PUT /admin/inventory/:id` - Update stock
- `PUT /admin/inventory/lock` - Admin lock stock
- `PUT /admin/inventory/release` - Admin release stock
- `GET /admin/inventory/locks` - View active locks
