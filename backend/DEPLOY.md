# Deployment Notes

## Environment Variables (Render Dashboard)
Set these in Render dashboard after creating the service:

### Backend
- DATABASE_URL: Auto-set by Render (from database)
- JWT_SECRET: Auto-generated
- JWT_REFRESH_SECRET: Auto-generated
- CORS_ORIGIN: https://your-frontend.onrender.com
- SITE_URL: https://your-frontend.onrender.com
- RAZORPAY_KEY_ID: Your Razorpay key
- RAZORPAY_KEY_SECRET: Your Razorpay secret
- STRIPE_SECRET_KEY: Your Stripe secret
- SMTP_USER: Your email
- SMTP_PASS: Your app password

### Frontend
- NEXT_PUBLIC_API_URL: https://your-backend.onrender.com/api/v1
- NEXT_PUBLIC_SITE_URL: https://your-frontend.onrender.com
- NEXT_PUBLIC_RAZORPAY_KEY_ID: Same as backend
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Your Stripe publishable key

## First Deploy
After first deploy, seed the database:
1. Go to Render dashboard > ecommerce-backend > Shell
2. Run: npx prisma db seed

## Render Free Tier
- Services spin down after 15 min of inactivity
- First request after spin-down takes ~30-50 seconds
- Database has 90-day expiry on free tier (back up regularly)
