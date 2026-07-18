# Premium E-Commerce Platform

A modern, production-ready e-commerce platform built with Next.js 15, Express, PostgreSQL, and Prisma. Features a complete shopping experience with admin panel, multiple payment gateways, PWA support, and SEO optimization.

## Tech Stack

**Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Swiper

**Backend:** Node.js, Express 5, TypeScript, Prisma ORM, PostgreSQL

**Payments:** Razorpay, Stripe, COD, UPI

**Media:** Cloudinary

**Auth:** JWT (Access + Refresh Tokens)

## Project Structure

```
ecommerce/
├── backend/                  # Express API server
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Sample data
│   └── src/
│       ├── config/           # Environment config
│       ├── controllers/      # Route handlers
│       ├── middleware/        # Auth, error handling
│       ├── routes/           # API routes
│       ├── types/            # TypeScript types
│       ├── utils/            # Prisma client, helpers
│       └── server.ts         # Entry point
├── frontend/                 # Next.js 15 app
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # Reusable components
│   │   ├── lib/              # API client, utilities
│   │   ├── providers/        # Auth, Cart context
│   │   └── types/            # TypeScript types
│   └── public/               # Static assets
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env   # Edit with your credentials

# Frontend
cd ../frontend
npm install
cp .env.example .env.local
```

### 2. Database Setup

```bash
cd backend
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### 3. Run Development Servers

```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm run dev
```

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `SMTP_HOST/USER/PASS` | Email configuration |

### Frontend (.env.local)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay publishable key |

## Default Credentials

**Admin:** admin@storename.com / admin123

**Customer:** customer@example.com / customer123

## Features

### Customer
- Homepage with hero banners, categories, new arrivals, trending, best sellers
- Product search with autocomplete
- Advanced filters (category, price, size, color, rating, discount)
- Product detail page with image gallery, size guide, pincode check
- Wishlist & Cart management
- Secure checkout with Razorpay, Stripe, COD, UPI
- Order tracking & history
- User dashboard with address management
- Responsive, mobile-first design
- PWA support (installable, offline-ready)
- SEO optimized with meta tags

### Admin Panel
- Dashboard with revenue, orders, customers analytics
- Product CRUD with images, variants, SEO
- Category & Brand management
- Banner management
- Order management with status updates
- Customer management
- Coupon management
- Review moderation
- Blog management
- FAQ management
- Newsletter subscribers
- Analytics & reports
- Role-based access control
- Site settings (logo, colors, social links)
- Backup management

## API Routes

### Public
- `GET /api/v1/products` - List products (filtered, paginated)
- `GET /api/v1/products/:slug` - Product detail
- `GET /api/v1/products/search?q=` - Product search
- `GET /api/v1/categories` - All categories
- `GET /api/v1/banners` - Active banners
- `POST /api/v1/contact` - Contact form
- `POST /api/v1/subscribe` - Newsletter signup

### Auth
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Sign in
- `GET /api/v1/auth/me` - Current user
- `PUT /api/v1/auth/profile` - Update profile

### Protected
- `GET/POST /api/v1/cart` - Cart management
- `GET/POST /api/v1/wishlist` - Wishlist management
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Order history
- `GET/POST/PUT/DELETE /api/v1/addresses` - Address CRUD
- `POST /api/v1/reviews` - Submit review

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `CRUD /api/v1/admin/products` - Product management
- `CRUD /api/v1/admin/categories` - Category management
- `CRUD /api/v1/admin/brands` - Brand management
- `CRUD /api/v1/admin/banners` - Banner management
- `GET/PUT /api/v1/admin/orders` - Order management
- `CRUD /api/v1/admin/coupons` - Coupon management
- `GET /api/v1/admin/customers` - Customer list
- `CRUD /api/v1/admin/blog` - Blog management
- `GET/PUT /api/v1/admin/settings` - Site settings

## Deployment

### Backend (Railway / Render / VPS)

```bash
cd backend
npm run build
npm start
```

### Frontend (Vercel)

```bash
cd frontend
npm run build
npx vercel deploy --prod
```

Set environment variables in your hosting dashboard.

## License

MIT
