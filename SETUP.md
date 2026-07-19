# Local Development Setup

## Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Edit with your values
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # Edit with your values
npm run dev
```

### Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- Admin Panel: http://localhost:3000/admin

### Default Credentials
- Admin: rajakajaykumar686@gmail.com / @Kareena.com201522
- Customer: customer@example.com / customer123

## Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | SQLite/PostgreSQL URL | file:./dev.db |
| JWT_SECRET | JWT signing secret | your-super-secret-jwt-key |
| JWT_REFRESH_SECRET | Refresh token secret | your-refresh-secret-key |
| RAZORPAY_KEY_ID | Razorpay key | (test mode) |
| RAZORPAY_KEY_SECRET | Razorpay secret | (test mode) |
| STRIPE_SECRET_KEY | Stripe secret | (test mode) |
| SMTP_HOST | Email server host | smtp.gmail.com |
| SMTP_PORT | Email server port | 587 |
| SMTP_USER | Email user | your-email@gmail.com |
| SMTP_PASS | Email password | your-app-password |

### Frontend (`.env.local`)
| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:5000/api/v1 |
| NEXT_PUBLIC_RAZORPAY_KEY_ID | Razorpay publishable key | (test mode) |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe publishable key | (test mode) |
