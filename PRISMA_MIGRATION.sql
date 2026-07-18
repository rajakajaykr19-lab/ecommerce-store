# Database Migration Notes

## For SQLite (Development)
```bash
cd backend
npx prisma generate
npx prisma db push
```

## For PostgreSQL (Production)
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
# or for new database:
npx prisma migrate dev --name init
```

## Seed Database
```bash
npx prisma db seed
```

This creates:
- Admin user: admin@storename.com / admin123
- Customer user: customer@example.com / customer123
- Categories: T-Shirts, Shirts, Pants, Dresses, Jackets
- Brands: Premium Brand 1, Premium Brand 2
- 8 sample products with variants
