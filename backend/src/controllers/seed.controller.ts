import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

export const seedDatabase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const seedKey = req.query.key;
    if (seedKey !== 'seed-ecommerce-2026') {
      return res.status(403).json({ success: false, message: 'Invalid seed key' });
    }

    const results: string[] = [];

    // Admin user (default)
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@storename.com' } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await prisma.user.create({
        data: { name: 'Admin', email: 'admin@storename.com', password: hashedPassword, role: 'ADMIN', phone: '+919876543210' },
      });
      results.push('Admin user created');
    } else {
      results.push('Admin user exists');
    }

    // Store owner admin
    const ownerEmail = 'rajakajaykumar686@gmail.com';
    const existingOwner = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingOwner) {
      const hashedPassword = await bcrypt.hash('@Kareena.com201522', 12);
      await prisma.user.update({
        where: { email: ownerEmail },
        data: { role: 'SUPER_ADMIN', password: hashedPassword },
      });
      results.push('Owner account promoted to SUPER_ADMIN');
    } else {
      const hashedPassword = await bcrypt.hash('@Kareena.com201522', 12);
      await prisma.user.create({
        data: { name: 'Ajay Kumar', email: ownerEmail, password: hashedPassword, role: 'SUPER_ADMIN', phone: '+919876543210' },
      });
      results.push('Owner SUPER_ADMIN account created');
    }

    // Customer user
    const existingCustomer = await prisma.user.findUnique({ where: { email: 'customer@example.com' } });
    if (!existingCustomer) {
      const hashedPassword = await bcrypt.hash('customer123', 12);
      await prisma.user.create({
        data: { name: 'Customer', email: 'customer@example.com', password: hashedPassword, role: 'CUSTOMER', phone: '+919876543211' },
      });
      results.push('Customer user created');
    } else {
      results.push('Customer user exists');
    }

    // Categories
    const categoryNames = ['Men', 'Women', 'Kids', 'Accessories'];
    const categories: Record<string, any> = {};
    for (const name of categoryNames) {
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const cat = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { name, slug, description: `${name} Collection`, isActive: true },
      });
      categories[name] = cat;
    }
    results.push(`${categoryNames.length} categories ready`);

    // Sub-categories
    const subCats = [
      { name: 'T-Shirts', slug: 't-shirts', parent: 'Men' },
      { name: 'Shirts', slug: 'shirts', parent: 'Men' },
      { name: 'Jeans', slug: 'jeans', parent: 'Men' },
      { name: 'Jackets', slug: 'jackets', parent: 'Men' },
      { name: 'Dresses', slug: 'dresses', parent: 'Women' },
      { name: 'Kurtis', slug: 'kurtis', parent: 'Women' },
      { name: 'Sarees', slug: 'sarees', parent: 'Women' },
      { name: 'Tops', slug: 'tops', parent: 'Women' },
    ];
    for (const sub of subCats) {
      const parent = categories[sub.parent];
      if (parent) {
        await prisma.category.upsert({
          where: { slug: sub.slug },
          update: {},
          create: { name: sub.name, slug: sub.slug, description: `${sub.name} Collection`, parentId: parent.id, isActive: true },
        });
      }
    }
    results.push(`${subCats.length} sub-categories ready`);

    // Products
    const products = [
      { name: 'Classic Polo T-Shirt', slug: 'classic-polo-t-shirt', description: 'Premium cotton polo t-shirt with a classic fit.', categoryId: categories['Men']?.id, basePrice: 1499, salePrice: 999, sku: 'M-PT-001', gender: 'MEN', gstRate: 5, fabric: 'Cotton', hsnCode: '6105', isNewArrival: true, isFeatured: true },
      { name: 'Slim Fit Jeans', slug: 'slim-fit-jeans', description: 'Modern slim fit jeans with stretch fabric for comfort.', categoryId: categories['Men']?.id, basePrice: 2999, salePrice: 1999, sku: 'M-JN-001', gender: 'MEN', gstRate: 12, fabric: 'Denim', hsnCode: '6203', isBestSeller: true },
      { name: 'Floral Print Dress', slug: 'floral-print-dress', description: 'Beautiful floral print A-line dress in lightweight viscose.', categoryId: categories['Women']?.id, basePrice: 2999, salePrice: 1999, sku: 'W-DR-001', gender: 'WOMEN', gstRate: 12, fabric: 'Viscose', hsnCode: '6204', isFeatured: true, isNewArrival: true },
      { name: 'Silk Saree', slug: 'silk-saree', description: 'Elegant silk saree with gold zari border.', categoryId: categories['Women']?.id, basePrice: 5999, salePrice: 4499, sku: 'W-SR-001', gender: 'WOMEN', gstRate: 5, fabric: 'Silk', hsnCode: '5007', isBestSeller: true, isFeatured: true },
      { name: 'Cotton Kurta', slug: 'cotton-kurta', description: 'Traditional kurta in pure cotton with embroidery.', categoryId: categories['Men']?.id, basePrice: 2499, salePrice: 1799, sku: 'M-KR-001', gender: 'MEN', gstRate: 5, fabric: 'Cotton', hsnCode: '6211', isNewArrival: true },
      { name: 'Bomber Jacket', slug: 'bomber-jacket', description: 'Classic bomber jacket with ribbed cuffs and hem.', categoryId: categories['Men']?.id, basePrice: 4999, salePrice: 3499, sku: 'M-JK-001', gender: 'MEN', gstRate: 18, fabric: 'Polyester', hsnCode: '6201', isFeatured: true },
      { name: 'Printed Top', slug: 'printed-top', description: 'Stylish printed top with V-neck and short sleeves.', categoryId: categories['Women']?.id, basePrice: 1299, salePrice: 899, sku: 'W-TP-001', gender: 'WOMEN', gstRate: 12, fabric: 'Cotton Blend', hsnCode: '6206', isTrending: true },
      { name: 'Casual Leggings', slug: 'casual-leggings', description: 'High-waist leggings with tummy control.', categoryId: categories['Women']?.id, basePrice: 999, salePrice: 699, sku: 'W-LG-001', gender: 'WOMEN', gstRate: 12, fabric: 'Spandex', hsnCode: '6104', isTrending: true },
    ];

    let productCount = 0;
    for (const data of products) {
      if (!data.categoryId) continue;
      const product = await prisma.product.upsert({
        where: { sku: data.sku },
        update: {},
        create: { ...data, isActive: true, discountPercent: data.salePrice ? Math.round(((data.basePrice - data.salePrice) / data.basePrice) * 100) : null },
      });
      productCount++;

      const sizes = ['S', 'M', 'L', 'XL'];
      for (const size of sizes) {
        await prisma.productVariant.upsert({
          where: { sku: `${data.sku}-${size}` },
          update: {},
          create: { productId: product.id, size, color: 'Black', colorHex: '#000000', sku: `${data.sku}-${size}`, price: data.salePrice || data.basePrice, stock: Math.floor(Math.random() * 30) + 5 },
        });
      }

      const existingImage = await prisma.productImage.findFirst({ where: { productId: product.id } });
      if (!existingImage) {
        await prisma.productImage.create({
          data: { productId: product.id, url: '/placeholder-product.jpg', isPrimary: true, displayOrder: 0 },
        });
      }
    }
    results.push(`${productCount} products created`);

    // Site settings
    const settings = [
      { key: 'site_name', value: 'PREMIUM FASHION', group: 'general' },
      { key: 'site_description', value: 'Premium Fashion Destination', group: 'general' },
      { key: 'contact_email', value: 'hello@premiumfashion.com', group: 'contact' },
      { key: 'contact_phone', value: '+91 98765 43210', group: 'contact' },
      { key: 'contact_address', value: '123 Fashion Street, Mumbai, India', group: 'contact' },
      { key: 'free_shipping_threshold', value: '999', group: 'shipping' },
      { key: 'shipping_charge', value: '49', group: 'shipping' },
      { key: 'currency', value: 'INR', group: 'general' },
      { key: 'next_invoice_number', value: '1001', group: 'billing' },
    ];
    for (const setting of settings) {
      await prisma.siteSetting.upsert({ where: { key: setting.key }, update: { value: setting.value }, create: setting });
    }
    results.push('Site settings ready');

    // FAQs
    const faqs = [
      { question: 'How do I place an order?', answer: 'Browse, add to cart, and checkout. Pay via UPI, card, net banking, or COD.', category: 'Orders', displayOrder: 1 },
      { question: 'What is the delivery time?', answer: 'Standard delivery takes 3-5 business days. Metro cities: 2-3 days.', category: 'Shipping', displayOrder: 2 },
      { question: 'What is your return policy?', answer: '30-day return policy. Items must be unused with tags attached.', category: 'Returns', displayOrder: 3 },
    ];
    for (const faq of faqs) {
      const existing = await prisma.fAQ.findFirst({ where: { question: faq.question } });
      if (!existing) await prisma.fAQ.create({ data: faq });
    }
    results.push('FAQs ready');

    res.json({ success: true, message: 'Database seeded successfully!', data: results });
  } catch (error) {
    next(error);
  }
};
