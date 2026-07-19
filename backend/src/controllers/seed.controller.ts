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

    // ============ ATTRIBUTE GROUPS ============
    const groups = [
      { name: 'Clothing', slug: 'clothing', description: 'Apparel & garment attributes', displayOrder: 1 },
      { name: 'Footwear', slug: 'footwear', description: 'Shoes & footwear attributes', displayOrder: 2 },
      { name: 'Accessories', slug: 'accessories', description: 'Watches, bags, belts, etc.', displayOrder: 3 },
      { name: 'Jewellery', slug: 'jewellery', description: 'Jewellery attributes', displayOrder: 4 },
      { name: 'Electronics', slug: 'electronics', description: 'Electronic device attributes', displayOrder: 5 },
      { name: 'Home & Living', slug: 'home-living', description: 'Home decor & living', displayOrder: 6 },
    ];
    const groupMap: Record<string, string> = {};
    for (const g of groups) {
      const existing = await prisma.attributeGroup.findUnique({ where: { slug: g.slug } });
      if (existing) { groupMap[g.slug] = existing.id; continue; }
      const created = await prisma.attributeGroup.create({ data: g });
      groupMap[g.slug] = created.id;
    }
    results.push(`${groups.length} attribute groups ready`);

    // ============ ATTRIBUTES ============
    const attrs = [
      { group: 'clothing', name: 'Fit', slug: 'fit', fieldType: 'select', options: ['Slim Fit', 'Regular Fit', 'Slim Straight', 'Skinny', 'Relaxed Fit', 'Athletic Fit', 'Tailored Fit', 'Oversized'], filterable: true, displayOrder: 1 },
      { group: 'clothing', name: 'Sleeve Type', slug: 'sleeve-type', fieldType: 'select', options: ['Full Sleeve', 'Half Sleeve', 'Short Sleeve', 'Sleeveless', 'Three-Quarter Sleeve', 'Cap Sleeve'], displayOrder: 2 },
      { group: 'clothing', name: 'Neck Style', slug: 'neck-style', fieldType: 'select', options: ['Round Neck', 'V-Neck', 'Collared', 'Henley', 'Mandarin', 'Boat Neck', 'Square Neck', 'Peter Pan', 'Hood'], displayOrder: 3 },
      { group: 'clothing', name: 'Collar', slug: 'collar', fieldType: 'select', options: ['Spread Collar', 'Button-Down', 'Club Collar', 'Pin Collar', 'Wing Collar', 'Stand Collar', 'No Collar'], displayOrder: 4 },
      { group: 'clothing', name: 'Waist Rise', slug: 'waist-rise', fieldType: 'select', options: ['Low Rise', 'Mid Rise', 'High Rise', 'Ultra High Rise'], filterable: true, displayOrder: 5 },
      { group: 'clothing', name: 'Pocket Count', slug: 'pocket-count', fieldType: 'number', displayOrder: 6 },
      { group: 'clothing', name: 'Stretchable', slug: 'stretchable', fieldType: 'boolean', displayOrder: 7 },
      { group: 'clothing', name: 'Fabric', slug: 'fabric', fieldType: 'select', options: ['Cotton', 'Polyester', 'Silk', 'Linen', 'Denim', 'Viscose', 'Nylon', 'Rayon', 'Chiffon', 'Georgette', 'Wool', 'Blend'], filterable: true, searchable: true, displayOrder: 8 },
      { group: 'clothing', name: 'Material', slug: 'material', fieldType: 'select', options: ['Cotton', 'Polyester', 'Silk', 'Linen', 'Denim', 'Leather', 'Suede', 'Nylon', 'Spandex', 'Modal', 'Tencel', 'Bamboo'], filterable: true, searchable: true, displayOrder: 9 },
      { group: 'clothing', name: 'Pattern', slug: 'pattern', fieldType: 'select', options: ['Solid', 'Striped', 'Checked', 'Floral', 'Printed', 'Paisley', 'Polka Dot', 'Abstract', 'Camouflage', 'Animal Print', 'Graphic'], filterable: true, displayOrder: 10 },
      { group: 'clothing', name: 'Length', slug: 'clothing-length', fieldType: 'select', options: ['Regular', 'Long', 'Short', 'Cropped', 'Ankle Length', 'Knee Length', 'Floor Length', 'Mini', 'Midi', 'Maxi'], displayOrder: 11 },
      { group: 'clothing', name: 'Closure', slug: 'closure', fieldType: 'select', options: ['Button', 'Zip', 'Pull-On', 'Snap', 'Tie', 'Velcro', 'Hook & Eye', 'Lace-Up'], displayOrder: 12 },
      { group: 'clothing', name: 'Wash Care', slug: 'wash-care', fieldType: 'select', options: ['Machine Wash', 'Hand Wash', 'Dry Clean Only', 'Do Not Wash', 'Wash With Similar Colors', 'Do Not Bleach'], displayOrder: 13 },
      { group: 'clothing', name: 'Color', slug: 'color', fieldType: 'multiselect', options: ['Black', 'White', 'Navy', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Gray', 'Brown', 'Beige', 'Orange', 'Purple', 'Maroon', 'Teal', 'Olive'], filterable: true, displayOrder: 14 },
      { group: 'clothing', name: 'Size', slug: 'clothing-size', fieldType: 'multiselect', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'], filterable: true, displayOrder: 15 },
      { group: 'clothing', name: 'Occasion', slug: 'occasion', fieldType: 'select', options: ['Casual', 'Formal', 'Party', 'Wedding', 'Festive', 'Work', 'Sports', 'Ethnic', 'Western', 'Traditional'], filterable: true, displayOrder: 16 },
      { group: 'clothing', name: 'Graphic Print', slug: 'graphic-print', fieldType: 'boolean', displayOrder: 17 },
      { group: 'clothing', name: 'Border', slug: 'border', fieldType: 'text', displayOrder: 18 },
      { group: 'clothing', name: 'Blouse Piece', slug: 'blouse-piece', fieldType: 'boolean', displayOrder: 19 },
      { group: 'clothing', name: 'Pleats', slug: 'pleats', fieldType: 'select', options: ['Box Pleats', 'Side Pleats', 'Knife Pleats', 'Inverted Pleats', 'No Pleats'], displayOrder: 20 },
      { group: 'clothing', name: 'Transparency', slug: 'transparency', fieldType: 'select', options: ['Opaque', 'Semi-Transparent', 'Sheer', 'Lined', 'Unlined'], displayOrder: 21 },
      { group: 'footwear', name: 'Upper Material', slug: 'upper-material', fieldType: 'select', options: ['Leather', 'Synthetic', 'Canvas', 'Mesh', 'Suede', 'Textile', 'Patent Leather', 'Rubber'], filterable: true, displayOrder: 1 },
      { group: 'footwear', name: 'Sole Material', slug: 'sole-material', fieldType: 'select', options: ['Rubber', 'EVA', 'PU', 'Leather', 'TPR', 'Vibram', 'Memory Foam'], filterable: true, displayOrder: 2 },
      { group: 'footwear', name: 'Heel Height', slug: 'heel-height', fieldType: 'select', options: ['Flat', 'Low Heel (1-2 inch)', 'Mid Heel (2-3 inch)', 'High Heel (3-4 inch)', 'Stiletto (4+ inch)', 'Wedge', 'Block Heel'], filterable: true, displayOrder: 3 },
      { group: 'footwear', name: 'Toe Shape', slug: 'toe-shape', fieldType: 'select', options: ['Round', 'Pointed', 'Square', 'Open Toe', 'Almond', 'Peep Toe'], displayOrder: 4 },
      { group: 'footwear', name: 'Water Resistant', slug: 'water-resistant', fieldType: 'boolean', displayOrder: 5 },
      { group: 'footwear', name: 'Shoe Size', slug: 'shoe-size', fieldType: 'multiselect', options: ['6', '7', '8', '9', '10', '11', '12', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'], filterable: true, displayOrder: 6 },
      { group: 'footwear', name: 'Footwear Color', slug: 'footwear-color', fieldType: 'multiselect', options: ['Black', 'White', 'Brown', 'Tan', 'Navy', 'Red', 'Gray', 'Beige', 'Pink', 'Green', 'Multi'], filterable: true, displayOrder: 7 },
      { group: 'footwear', name: 'Footwear Occasion', slug: 'footwear-occasion', fieldType: 'select', options: ['Casual', 'Formal', 'Sports', 'Running', 'Walking', 'Party', 'Sandals', 'Flip Flops', 'Boots', 'Slippers'], filterable: true, displayOrder: 8 },
      { group: 'accessories', name: 'Display Type', slug: 'display-type', fieldType: 'select', options: ['Analog', 'Digital', 'Smart', 'Hybrid', 'Chronograph'], filterable: true, displayOrder: 1 },
      { group: 'accessories', name: 'Dial Shape', slug: 'dial-shape', fieldType: 'select', options: ['Round', 'Square', 'Rectangular', 'Oval', 'Tonneau', 'Octagonal'], filterable: true, displayOrder: 2 },
      { group: 'accessories', name: 'Dial Color', slug: 'dial-color', fieldType: 'select', options: ['Black', 'White', 'Blue', 'Silver', 'Gold', 'Rose Gold', 'Green', 'Red'], filterable: true, displayOrder: 3 },
      { group: 'accessories', name: 'Strap Material', slug: 'strap-material', fieldType: 'select', options: ['Leather', 'Stainless Steel', 'Silicone', 'Nylon', 'Ceramic', 'Resin', 'Fabric', 'Rubber'], filterable: true, displayOrder: 4 },
      { group: 'accessories', name: 'Strap Color', slug: 'strap-color', fieldType: 'select', options: ['Black', 'Brown', 'White', 'Silver', 'Gold', 'Rose Gold', 'Blue', 'Red', 'Navy'], filterable: true, displayOrder: 5 },
      { group: 'accessories', name: 'Movement', slug: 'movement', fieldType: 'select', options: ['Quartz', 'Automatic', 'Manual', 'Solar', 'Kinetic'], displayOrder: 6 },
      { group: 'accessories', name: 'Water Resistant', slug: 'acc-water-resistant', fieldType: 'select', options: ['No', '30m', '50m', '100m', '200m', '300m'], displayOrder: 7 },
      { group: 'accessories', name: 'Warranty', slug: 'warranty', fieldType: 'text', displayOrder: 8 },
      { group: 'accessories', name: 'Frame Material', slug: 'frame-material', fieldType: 'select', options: ['Acetate', 'Metal', 'Titanium', 'Wood', 'TR90', 'Stainless Steel', 'Carbon Fiber'], filterable: true, displayOrder: 9 },
      { group: 'accessories', name: 'Lens Type', slug: 'lens-type', fieldType: 'select', options: ['Prescription', 'Polarized', 'UV Protection', 'Blue Light', 'Photochromic', 'Mirror'], displayOrder: 10 },
      { group: 'accessories', name: 'Bag Type', slug: 'bag-type', fieldType: 'select', options: ['Backpack', 'Messenger', 'Tote', 'Clutch', 'Crossbody', 'Shoulder', 'Duffle', 'Laptop Bag', 'Sling'], filterable: true, displayOrder: 11 },
      { group: 'accessories', name: 'Capacity', slug: 'capacity', fieldType: 'text', displayOrder: 12 },
      { group: 'accessories', name: 'Belt Size', slug: 'belt-size', fieldType: 'multiselect', options: ['28', '30', '32', '34', '36', '38', '40', '42', '44', 'S', 'M', 'L', 'XL'], filterable: true, displayOrder: 13 },
    ];
    const attrMap: Record<string, string> = {};
    for (const a of attrs) {
      const existing = await prisma.attribute.findUnique({ where: { slug: a.slug } });
      if (existing) { attrMap[a.slug] = existing.id; continue; }
      const created = await prisma.attribute.create({
        data: { groupId: groupMap[a.group], name: a.name, slug: a.slug, fieldType: a.fieldType, options: JSON.stringify(a.options || []), filterable: a.filterable || false, searchable: a.searchable || false, displayOrder: a.displayOrder },
      });
      attrMap[a.slug] = created.id;
    }
    results.push(`${attrs.length} attributes ready`);

    // ============ SUBCATEGORY ATTRIBUTE MAPPINGS ============
    const allCats = await prisma.category.findMany();
    const catSlugMap: Record<string, string> = {};
    allCats.forEach((c: any) => { catSlugMap[c.slug] = c.id; });

    const mappings: Record<string, string[]> = {
      'men-shirts': ['fit', 'sleeve-type', 'collar', 'pattern', 'fabric', 'material', 'closure', 'color', 'clothing-size', 'occasion', 'wash-care', 'clothing-length', 'pocket-count'],
      'men-t-shirts': ['fit', 'sleeve-type', 'neck-style', 'pattern', 'fabric', 'material', 'graphic-print', 'color', 'clothing-size', 'occasion', 'wash-care', 'stretchable'],
      'men-jeans': ['fit', 'waist-rise', 'stretchable', 'pocket-count', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'clothing-length', 'closure'],
      'men-trousers': ['fit', 'waist-rise', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'closure', 'pleats'],
      'men-jackets': ['fit', 'sleeve-type', 'collar', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'closure', 'clothing-length'],
      'men-hoodies': ['fit', 'sleeve-type', 'neck-style', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'graphic-print', 'stretchable'],
      'men-kurtas': ['fit', 'sleeve-type', 'collar', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'clothing-length', 'closure', 'border'],
      'men-shorts': ['fit', 'waist-rise', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'closure', 'pocket-count', 'clothing-length'],
      'men-blazers': ['fit', 'sleeve-type', 'collar', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'closure', 'pocket-count'],
      'women-sarees': ['fabric', 'material', 'pattern', 'color', 'border', 'blouse-piece', 'length', 'occasion', 'transparency', 'wash-care'],
      'women-kurtis': ['fit', 'sleeve-type', 'neck-style', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'clothing-length', 'closure'],
      'women-dresses': ['fit', 'sleeve-type', 'neck-style', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'clothing-length', 'closure', 'waist-rise'],
      'women-tops': ['fit', 'sleeve-type', 'neck-style', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'graphic-print'],
      'women-jeans': ['fit', 'waist-rise', 'stretchable', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'closure', 'clothing-length'],
      'women-leggings': ['fit', 'waist-rise', 'stretchable', 'fabric', 'material', 'color', 'clothing-size', 'occasion', 'wash-care'],
      'women-palazzo': ['fit', 'waist-rise', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'closure', 'clothing-length'],
      'women-skirts': ['fit', 'waist-rise', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'pleats', 'clothing-length'],
      'kids-t-shirts': ['sleeve-type', 'neck-style', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'wash-care', 'graphic-print'],
      'kids-jeans': ['fit', 'waist-rise', 'fabric', 'material', 'color', 'clothing-size', 'wash-care'],
      'kids-dresses': ['sleeve-type', 'neck-style', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'wash-care', 'clothing-length'],
    };

    let mappingCount = 0;
    for (const [subSlug, attrSlugs] of Object.entries(mappings)) {
      const subId = catSlugMap[subSlug];
      if (!subId) continue;
      for (let i = 0; i < attrSlugs.length; i++) {
        const attrId = attrMap[attrSlugs[i]];
        if (!attrId) continue;
        const existing = await prisma.subcategoryAttribute.findUnique({
          where: { subcategoryId_attributeId: { subcategoryId: subId, attributeId: attrId } },
        });
        if (!existing) {
          await prisma.subcategoryAttribute.create({ data: { subcategoryId: subId, attributeId: attrId, displayOrder: i + 1 } });
          mappingCount++;
        }
      }
    }
    results.push(`${mappingCount} subcategory-attribute mappings ready`);

    res.json({ success: true, message: 'Database seeded successfully!', data: results });
  } catch (error) {
    next(error);
  }
};
