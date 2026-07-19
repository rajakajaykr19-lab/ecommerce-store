import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('@Kareena.com201522', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'rajakajaykumar686@gmail.com' },
    update: {},
    create: {
      name: 'Ajay Kumar',
      email: 'rajakajaykumar686@gmail.com',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      phone: '9876543210',
    },
  });
  console.log('Admin created:', admin.email);

  // Customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'customer@example.com',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '9876543211',
    },
  });
  console.log('Customer created:', customer.email);

  // Categories
  const menCat = await prisma.category.upsert({
    where: { slug: 'men' },
    update: {},
    create: { name: 'Men', slug: 'men', gender: 'MEN', displayOrder: 1, description: 'Men\'s fashion collection' },
  });
  const womenCat = await prisma.category.upsert({
    where: { slug: 'women' },
    update: {},
    create: { name: 'Women', slug: 'women', gender: 'WOMEN', displayOrder: 2, description: 'Women\'s fashion collection' },
  });
  const kidsCat = await prisma.category.upsert({
    where: { slug: 'kids' },
    update: {},
    create: { name: 'Kids', slug: 'kids', gender: 'KIDS', displayOrder: 3, description: 'Kids\' fashion collection' },
  });
  const accessoriesCat = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: { name: 'Accessories', slug: 'accessories', gender: 'ACCESSORIES', displayOrder: 4, description: 'Fashion accessories' },
  });

  // Sub-categories (Men)
  const menSubs = ['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Jackets', 'Hoodies', 'Kurtas', 'Blazers', 'Shorts'];
  for (const name of menSubs) {
    await prisma.category.upsert({
      where: { slug: `men-${name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { name, slug: `men-${name.toLowerCase().replace(/\s+/g, '-')}`, parentId: menCat.id, gender: 'MEN', displayOrder: menSubs.indexOf(name) + 1 },
    });
  }

  // Sub-categories (Women)
  const womenSubs = ['Sarees', 'Kurtis', 'Dresses', 'Tops', 'T-Shirts', 'Jeans', 'Leggings', 'Palazzo', 'Skirts', 'Jackets', 'Nightwear'];
  for (const name of womenSubs) {
    await prisma.category.upsert({
      where: { slug: `women-${name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { name, slug: `women-${name.toLowerCase().replace(/\s+/g, '-')}`, parentId: womenCat.id, gender: 'WOMEN', displayOrder: womenSubs.indexOf(name) + 1 },
    });
  }

  // Sub-categories (Kids)
  const kidsSubs = ['T-Shirts', 'Shirts', 'Jeans', 'Dresses', 'Trousers', 'Activewear', 'Traditional', 'Nightwear'];
  for (const name of kidsSubs) {
    await prisma.category.upsert({
      where: { slug: `kids-${name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { name, slug: `kids-${name.toLowerCase().replace(/\s+/g, '-')}`, parentId: kidsCat.id, gender: 'KIDS', displayOrder: kidsSubs.indexOf(name) + 1 },
    });
  }

  // Sub-categories (Accessories)
  const accSubs = ['Bags', 'Belts', 'Watches', 'Sunglasses', 'Hats', 'Scarves', 'Jewellery', 'Wallets'];
  for (const name of accSubs) {
    await prisma.category.upsert({
      where: { slug: `accessories-${name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { name, slug: `accessories-${name.toLowerCase().replace(/\s+/g, '-')}`, parentId: accessoriesCat.id, gender: 'ACCESSORIES', displayOrder: accSubs.indexOf(name) + 1 },
    });
  }

  // Baby category
  const babyCat = await prisma.category.upsert({
    where: { slug: 'baby' },
    update: {},
    create: { name: 'Baby', slug: 'baby', gender: 'KIDS', displayOrder: 5, description: 'Baby & infant collection' },
  });

  // Sub-categories (Baby)
  const babySubs = ['Bodysuits', 'Diapers', 'Baby Clothing', 'Baby Accessories', 'Footwear', 'Outerwear'];
  for (const name of babySubs) {
    await prisma.category.upsert({
      where: { slug: `baby-${name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { name, slug: `baby-${name.toLowerCase().replace(/\s+/g, '-')}`, parentId: babyCat.id, gender: 'KIDS', displayOrder: babySubs.indexOf(name) + 1 },
    });
  }

  // Brands
  const brandNames = ['Premium Wear', 'Urban Style', 'Classic Threads', 'Modern Fit', 'Elite Collection', 'Street Vogue'];
  for (const name of brandNames) {
    await prisma.brand.upsert({
      where: { slug: name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/\s+/g, '-'), isActive: true },
    });
  }

  // Sample Products
  const brands = await prisma.brand.findMany();

  const productData = [
    { name: 'Classic Fit Cotton Shirt', description: 'Premium cotton shirt with a classic fit. Perfect for both casual and formal occasions.', categoryId: menCat.id, brandId: brands[0].id, basePrice: 1999, salePrice: 1299, gender: 'MEN', sku: 'M-SH-001', isFeatured: true, isNewArrival: true, isBestSeller: true },
    { name: 'Slim Fit Oxford Shirt', description: 'Oxford fabric shirt with a modern slim fit. Features button-down collar and chest pocket.', categoryId: menCat.id, brandId: brands[1].id, basePrice: 2499, salePrice: 1799, gender: 'MEN', sku: 'M-SH-002', isFeatured: true, isBestSeller: true },
    { name: 'Premium Solid T-Shirt', description: 'Ultra-soft cotton t-shirt with a relaxed fit. Pre-shrunk fabric for lasting comfort.', categoryId: menCat.id, brandId: brands[2].id, basePrice: 999, salePrice: 599, gender: 'MEN', sku: 'M-TS-001', isNewArrival: true, isTrending: true },
    { name: 'Graphic Print T-Shirt', description: 'Trendy graphic print t-shirt made from 100% organic cotton.', categoryId: menCat.id, brandId: brands[3].id, basePrice: 1299, salePrice: 899, gender: 'MEN', sku: 'M-TS-002', isTrending: true },
    { name: 'Slim Fit Stretch Jeans', description: 'Modern slim fit jeans with 4-way stretch comfort. Mid-rise waist with zip fly.', categoryId: menCat.id, brandId: brands[0].id, basePrice: 2999, salePrice: 1999, gender: 'MEN', sku: 'M-JN-001', isFeatured: true, isBestSeller: true },
    { name: 'Regular Fit Chinos', description: 'Versatile chino trousers in a regular fit. Wrinkle-resistant fabric for all-day wear.', categoryId: menCat.id, brandId: brands[4].id, basePrice: 2499, salePrice: 1699, gender: 'MEN', sku: 'M-TR-001', isNewArrival: true },
    { name: 'Bomber Jacket', description: 'Classic bomber jacket with ribbed cuffs and hem. Lightweight quilted lining.', categoryId: menCat.id, brandId: brands[1].id, basePrice: 4999, salePrice: 3499, gender: 'MEN', sku: 'M-JK-001', isFeatured: true },
    { name: 'Pullover Hoodie', description: 'Cozy pullover hoodie with kangaroo pocket. Brushed fleece interior for warmth.', categoryId: menCat.id, brandId: brands[5].id, basePrice: 2999, salePrice: 1999, gender: 'MEN', sku: 'M-HD-001', isTrending: true, isBestSeller: true },
    { name: 'Cotton Kurta', description: 'Traditional kurta in pure cotton fabric. Features intricate embroidery on collar.', categoryId: menCat.id, brandId: brands[2].id, basePrice: 2499, salePrice: 1799, gender: 'MEN', sku: 'M-KR-001', isNewArrival: true },
    { name: 'Tailored Blazer', description: 'Sharp tailored blazer in premium wool blend. Two-button closure with notch lapel.', categoryId: menCat.id, brandId: brands[4].id, basePrice: 8999, salePrice: 6499, gender: 'MEN', sku: 'M-BZ-001', isFeatured: true },
    { name: 'Floral Print Dress', description: 'Beautiful floral print dress with a flattering A-line silhouette. Made from lightweight viscose.', categoryId: womenCat.id, brandId: brands[0].id, basePrice: 2999, salePrice: 1999, gender: 'WOMEN', sku: 'W-DR-001', isFeatured: true, isNewArrival: true },
    { name: 'Silk Saree', description: 'Elegant silk saree with gold zari border. Comes with blouse piece.', categoryId: womenCat.id, brandId: brands[4].id, basePrice: 5999, salePrice: 4499, gender: 'WOMEN', sku: 'W-SR-001', isFeatured: true, isBestSeller: true },
    { name: 'Cotton Kurti', description: 'Comfortable cotton kurti with straight cut and three-quarter sleeves.', categoryId: womenCat.id, brandId: brands[2].id, basePrice: 1499, salePrice: 999, gender: 'WOMEN', sku: 'W-KU-001', isNewArrival: true },
    { name: 'Printed Top', description: 'Stylish printed top with V-neck and short sleeves. Easy-care fabric.', categoryId: womenCat.id, brandId: brands[1].id, basePrice: 1299, salePrice: 899, gender: 'WOMEN', sku: 'W-TP-001', isTrending: true },
    { name: 'Women Slim Fit Jeans', description: 'High-rise slim fit jeans with stretch denim. Classic 5-pocket design.', categoryId: womenCat.id, brandId: brands[3].id, basePrice: 2499, salePrice: 1799, gender: 'WOMEN', sku: 'W-JN-001', isBestSeller: true },
    { name: 'Casual Leggings', description: 'High-waist leggings with tummy control. Moisture-wicking fabric for all-day comfort.', categoryId: womenCat.id, brandId: brands[5].id, basePrice: 999, salePrice: 699, gender: 'WOMEN', sku: 'W-LG-001', isTrending: true },
  ];

  for (const data of productData) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    const discountPercent = data.salePrice ? Math.round(((data.basePrice - data.salePrice) / data.basePrice) * 100) : null;

    const product = await prisma.product.upsert({
      where: { sku: data.sku },
      update: {},
      create: { ...data, slug, discountPercent },
    });

    // Add variants
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const colors = [
      { color: 'Black', colorHex: '#000000' },
      { color: 'White', colorHex: '#FFFFFF' },
      { color: 'Navy', colorHex: '#000080' },
      { color: 'Gray', colorHex: '#808080' },
    ];

    for (const size of sizes.slice(0, 4)) {
      await prisma.productVariant.upsert({
        where: { sku: `${data.sku}-${size}` },
        update: {},
        create: {
          productId: product.id,
          size,
          color: colors[0].color,
          colorHex: colors[0].colorHex,
          sku: `${data.sku}-${size}`,
          price: data.salePrice || data.basePrice,
          stock: Math.floor(Math.random() * 30) + 5,
        },
      });
    }

    // Add images placeholder
    const existingImage = await prisma.productImage.findFirst({ where: { productId: product.id } });
    if (!existingImage) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `https://res.cloudinary.com/demo/image/upload/v1/samples/${data.gender?.toLowerCase()}/${data.sku.toLowerCase()}.jpg`,
          isPrimary: true,
          displayOrder: 0,
        },
      });
    }
  }

  // Banners
  const existingBanners = await prisma.banner.count();
  if (existingBanners === 0) {
    await prisma.banner.createMany({
      data: [
        { title: 'Summer Collection 2026', subtitle: 'New Arrivals', description: 'Discover the latest trends for the season', image: '', buttonText: 'Shop Now', link: '/shop?sort=newest', position: 'hero', displayOrder: 1 },
        { title: 'Up to 50% Off', subtitle: 'Mid-Season Sale', description: 'Limited time offer', image: '', buttonText: 'Shop Sale', link: '/shop?discountPercent=30', position: 'hero', displayOrder: 2 },
        { title: 'Premium Fashion', subtitle: 'Curated Collection', description: 'Elevate your style', image: '', buttonText: 'Explore', link: '/shop', position: 'hero', displayOrder: 3 },
      ],
    });
  }

  // Site Settings
  const settings = [
    { key: 'site_name', value: 'STORE NAME', group: 'general' },
    { key: 'site_description', value: 'Premium Fashion Destination', group: 'general' },
    { key: 'contact_email', value: 'hello@storename.com', group: 'contact' },
    { key: 'contact_phone', value: '+91 98765 43210', group: 'contact' },
    { key: 'contact_address', value: '123 Fashion Street, Mumbai', group: 'contact' },
    { key: 'free_shipping_threshold', value: '499', group: 'shipping' },
    { key: 'shipping_charge', value: '49', group: 'shipping' },
    { key: 'return_period', value: '30', group: 'policy' },
    { key: 'currency', value: 'INR', group: 'general' },
    { key: 'tax_rate', value: '0', group: 'general' },
    { key: 'facebook_url', value: '#', group: 'social' },
    { key: 'instagram_url', value: '#', group: 'social' },
    { key: 'twitter_url', value: '#', group: 'social' },
    { key: 'youtube_url', value: '#', group: 'social' },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  // Policies
  const policies = [
    { type: 'privacy', title: 'Privacy Policy', content: 'Your privacy is important to us. We collect and use your personal information solely for processing orders and improving your shopping experience.' },
    { type: 'terms', title: 'Terms & Conditions', content: 'By using our website, you agree to these terms. We reserve the right to update these terms at any time.' },
    { type: 'shipping', title: 'Shipping Policy', content: 'Free shipping on orders above ₹499. Standard delivery takes 3-5 business days. We ship across India.' },
    { type: 'returns', title: 'Return & Exchange Policy', content: '30-day easy return policy. Items must be unused with tags attached. Refunds are processed within 5-7 business days.' },
    { type: 'refund', title: 'Refund Policy', content: 'Refunds are processed to the original payment method within 5-7 business days after we receive the returned item.' },
  ];

  for (const policy of policies) {
    await prisma.policy.upsert({
      where: { type: policy.type },
      update: { title: policy.title, content: policy.content },
      create: policy,
    });
  }

  // FAQs
  const faqs = [
    { question: 'How do I place an order?', answer: 'Simply browse our collection, add items to your cart, and proceed to checkout. You can pay via credit/debit card, UPI, net banking, or cash on delivery.', category: 'Orders', displayOrder: 1 },
    { question: 'What is the delivery time?', answer: 'Standard delivery takes 3-5 business days. Metro cities usually receive orders within 2-3 business days.', category: 'Shipping', displayOrder: 2 },
    { question: 'What is your return policy?', answer: 'We offer a 30-day return policy. Items must be unused, unworn, and with all tags attached.', category: 'Returns', displayOrder: 3 },
    { question: 'How can I track my order?', answer: 'You can track your order using the tracking number provided in your order confirmation email, or visit our Track Order page.', category: 'Orders', displayOrder: 4 },
    { question: 'Do you ship internationally?', answer: 'Currently, we ship across India only. International shipping will be available soon.', category: 'Shipping', displayOrder: 5 },
    { question: 'How do I use a coupon code?', answer: 'Enter your coupon code at checkout in the "Apply Coupon" section and click Apply.', category: 'Orders', displayOrder: 6 },
  ];

  for (const faq of faqs) {
    const existing = await prisma.fAQ.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.fAQ.create({ data: faq });
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
