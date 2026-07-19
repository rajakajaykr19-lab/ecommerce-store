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

  // Footwear category
  const footwearCat = await prisma.category.upsert({
    where: { slug: 'footwear' },
    update: {},
    create: { name: 'Footwear', slug: 'footwear', gender: 'ACCESSORIES', displayOrder: 6, description: 'Shoes, sandals & more' },
  });

  const footwearSubs = ['Sneakers', 'Formal Shoes', 'Sandals', 'Slippers', 'Sports Shoes', 'Boots', 'Flats'];
  for (const name of footwearSubs) {
    await prisma.category.upsert({
      where: { slug: `footwear-${name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: { name, slug: `footwear-${name.toLowerCase().replace(/\s+/g, '-')}`, parentId: footwearCat.id, gender: 'ACCESSORIES', displayOrder: footwearSubs.indexOf(name) + 1 },
    });
  }

  // Description Templates
  const descTemplates: { categoryId: string; title: string; description: string; displayOrder: number }[] = [
    // Men - Shirts
    ...(await prisma.category.findMany({ where: { slug: 'men-shirts' } })).flatMap((c) => [
      { categoryId: c.id, title: 'Casual Cotton Shirt', description: 'A versatile casual shirt crafted from premium cotton fabric. Features a relaxed fit with spread collar, full button placket, and short sleeves. Perfect for everyday wear, this shirt pairs effortlessly with jeans or chinos for a laid-back look.', displayOrder: 1 },
      { categoryId: c.id, title: 'Formal Office Shirt', description: 'Professional dress shirt designed for the modern workplace. Made from wrinkle-resistant cotton blend with a tailored fit, French placket, and adjustable cuffs. Ideal for boardroom meetings and formal events.', displayOrder: 2 },
      { categoryId: c.id, title: 'Linen Summer Shirt', description: 'Breathable linen shirt perfect for warm weather. Features a camp collar, boxy fit, and natural linen texture. The lightweight fabric keeps you cool while maintaining a stylish, relaxed appearance.', displayOrder: 3 },
    ]),
    // Men - T-Shirts
    ...(await prisma.category.findMany({ where: { slug: 'men-t-shirts' } })).flatMap((c) => [
      { categoryId: c.id, title: 'Classic Round Neck', description: 'Essential crew neck t-shirt made from 100% combed cotton. Pre-shrunk fabric ensures a consistent fit wash after wash. Features reinforced seams and a soft hand feel for all-day comfort.', displayOrder: 1 },
      { categoryId: c.id, title: 'Polo T-Shirt', description: 'Smart-casual polo shirt with ribbed collar and two-button placket. Crafted from pique cotton for a textured finish. Perfect for golf outings, brunch dates, or smart-casual office days.', displayOrder: 2 },
      { categoryId: c.id, title: 'Oversized Graphic Tee', description: 'Trendy oversized t-shirt featuring bold graphic prints. Made from heavyweight cotton with a dropped shoulder silhouette. A streetwear staple that makes a statement.', displayOrder: 3 },
    ]),
    // Men - Jeans
    ...(await prisma.category.findMany({ where: { slug: 'men-jeans' } })).flatMap((c) => [
      { categoryId: c.id, title: 'Slim Fit Stretch Jeans', description: 'Modern slim fit jeans with 4-way stretch denim for maximum comfort. Mid-rise waist, five-pocket styling, and tapered leg. Retains shape throughout the day with premium recovery technology.', displayOrder: 1 },
      { categoryId: c.id, title: 'Regular Fit Classic Jeans', description: 'Timeless regular fit jeans in authentic indigo wash. Made from rigid 12oz denim that softens with wear. Classic five-pocket design with a straight leg for a comfortable, traditional silhouette.', displayOrder: 2 },
      { categoryId: c.id, title: 'Skinny Fit Jeans', description: 'Sleek skinny fit jeans with super-stretch fabric for a body-hugging fit. Low-rise waist with ankle-length hem. Perfect for a contemporary, streamlined look.', displayOrder: 3 },
    ]),
    // Men - Jackets
    ...(await prisma.category.findMany({ where: { slug: 'men-jackets' } })).flatMap((c) => [
      { categoryId: c.id, title: 'Bomber Jacket', description: 'Classic bomber jacket with ribbed collar, cuffs, and hem. Lightweight quilted lining for warmth without bulk. Features zip closure and side pockets. A timeless outerwear piece.', displayOrder: 1 },
      { categoryId: c.id, title: 'Denim Jacket', description: 'Iconic denim jacket in premium cotton twill. Button-front closure with chest and side pockets. A wardrobe essential that layers perfectly over hoodies, t-shirts, and shirts.', displayOrder: 2 },
    ]),
    // Men - Trousers
    ...(await prisma.category.findMany({ where: { slug: 'men-trousers' } })).flatMap((c) => [
      { categoryId: c.id, title: 'Formal Trousers', description: 'Tailored formal trousers in wrinkle-free fabric. Flat-front design with a tapered leg for a sharp, professional look. Features a hook-and-bar closure and belt loops.', displayOrder: 1 },
      { categoryId: c.id, title: 'Chinos', description: 'Versatile chino trousers in a comfortable cotton-stretch blend. Mid-rise with a slim-straight fit. Available in multiple colors, perfect for smart-casual styling.', displayOrder: 2 },
    ]),
    // Women - Dresses
    ...(await prisma.category.findMany({ where: { slug: 'women-dresses' } })).flatMap((c) => [
      { categoryId: c.id, title: 'Casual Day Dress', description: 'Effortlessly stylish day dress in lightweight viscose fabric. Features a flattering A-line silhouette with a V-neckline and short sleeves. Perfect for brunch, shopping, or casual outings.', displayOrder: 1 },
      { categoryId: c.id, title: 'Evening Cocktail Dress', description: 'Elegant cocktail dress in premium satin fabric. Features a fitted bodice with a flared midi skirt. Ideal for dinner parties, date nights, and special occasions.', displayOrder: 2 },
      { categoryId: c.id, title: 'Maxi Dress', description: 'Flowing maxi dress in soft georgette fabric. Features a tiered skirt with subtle pleating and adjustable straps. Perfect for beach vacations and summer events.', displayOrder: 3 },
    ]),
    // Women - Sarees
    ...(await prisma.category.findMany({ where: { slug: 'women-sarees' } })).flatMap((c) => [
      { categoryId: c.id, title: 'Silk Saree', description: 'Luxurious silk saree with intricate zari border and pallu. Comes with matching blouse piece. Perfect for weddings, festivals, and traditional celebrations.', displayOrder: 1 },
      { categoryId: c.id, title: 'Cotton Saree', description: 'Handloom cotton saree with traditional motifs. Lightweight and breathable, ideal for daily wear and office. Comes with running blouse material.', displayOrder: 2 },
      { categoryId: c.id, title: 'Georgette Saree', description: 'Flowy georgette saree with printed design. Easy to drape and maintain. Perfect for parties and semi-formal occasions. Includes matching blouse piece.', displayOrder: 3 },
    ]),
    // Women - Kurtis
    ...(await prisma.category.findMany({ where: { slug: 'women-kurtis' } })).flatMap((c) => [
      { categoryId: c.id, title: 'A-Line Kurti', description: 'Flattering A-line kurti in soft cotton fabric. Features three-quarter sleeves and a round neckline with subtle embroidery. Pair with leggings or palazzo pants for an elegant ethnic look.', displayOrder: 1 },
      { categoryId: c.id, title: 'Anarkali Kurti', description: 'Graceful Anarkali kurti with a flared hemline. Made from rayon with printed design. Perfect for festive occasions and casual gatherings.', displayOrder: 2 },
    ]),
    // Women - Tops
    ...(await prisma.category.findMany({ where: { slug: 'women-tops' } })).flatMap((c) => [
      { categoryId: c.id, title: 'Casual Printed Top', description: 'Trendy printed top in soft rayon fabric. Features a relaxed fit with short sleeves and a round neck. Easy to style with jeans, skirts, or shorts for a chic everyday look.', displayOrder: 1 },
      { categoryId: c.id, title: 'Formal Blouse', description: 'Sophisticated blouse in premium crepe fabric. Features a mandarin collar with front button closure and three-quarter sleeves. Perfect for office and formal events.', displayOrder: 2 },
    ]),
    // Kids
    ...(await prisma.category.findMany({ where: { slug: 'kids' } })).flatMap((c) => [
      { categoryId: c.id, title: 'Everyday Play Wear', description: 'Durable and comfortable clothing designed for active kids. Made from soft cotton fabric that withstands rough play and frequent washing. Bright colors and fun prints kids love.', displayOrder: 1 },
      { categoryId: c.id, title: 'Party Wear', description: 'Special occasion outfit for kids featuring premium fabrics and stylish designs. Perfect for birthday parties, family gatherings, and festive celebrations.', displayOrder: 2 },
    ]),
    // Baby
    ...(await prisma.category.findMany({ where: { slug: 'baby' } })).flatMap((c) => [
      { categoryId: c.id, title: 'Soft Cotton Onesie', description: 'Gentle onesie made from 100% organic cotton for delicate baby skin. Features envelope neckline for easy dressing and snap closure for quick diaper changes. Hypoallergenic and machine washable.', displayOrder: 1 },
      { categoryId: c.id, title: 'Winter Warm Set', description: 'Cozy winter set with fleece-lined jacket and matching pants. Soft ribbed cuffs to keep warmth in. Perfect for stroller walks and outdoor play in cold weather.', displayOrder: 2 },
      { categoryId: c.id, title: 'Summer Romper', description: 'Lightweight romper in breathable cotton muslin. Short sleeves and snap crotch for easy changes. Ideal for warm weather outings and playtime.', displayOrder: 3 },
    ]),
    // Accessories
    ...(await prisma.category.findMany({ where: { slug: 'accessories' } })).flatMap((c) => [
      { categoryId: c.id, title: 'Premium Leather Accessory', description: 'Handcrafted accessory in genuine leather with premium stitching and hardware. Timeless design that complements both casual and formal outfits. Built to last with everyday use.', displayOrder: 1 },
      { categoryId: c.id, title: 'Casual Everyday Accessory', description: 'Versatile everyday accessory in durable materials. Functional design meets modern aesthetics. Perfect for daily use and casual outings.', displayOrder: 2 },
    ]),
  ];

  for (const tmpl of descTemplates) {
    const existing = await prisma.descriptionTemplate.findFirst({ where: { categoryId: tmpl.categoryId, title: tmpl.title } });
    if (!existing) {
      await prisma.descriptionTemplate.create({ data: tmpl });
    }
  }

  // Attribute Groups & Attributes
  const clothingGroup = await prisma.attributeGroup.upsert({ where: { slug: 'clothing' }, update: {}, create: { name: 'Clothing', slug: 'clothing', displayOrder: 1 } });
  const footwearGroup = await prisma.attributeGroup.upsert({ where: { slug: 'footwear-attrs' }, update: {}, create: { name: 'Footwear', slug: 'footwear-attrs', displayOrder: 2 } });
  const accessoryGroup = await prisma.attributeGroup.upsert({ where: { slug: 'accessories-attrs' }, update: {}, create: { name: 'Accessories', slug: 'accessories-attrs', displayOrder: 3 } });
  const babyGroup = await prisma.attributeGroup.upsert({ where: { slug: 'baby-attrs' }, update: {}, create: { name: 'Baby', slug: 'baby-attrs', displayOrder: 4 } });

  const clothingAttrs = [
    { name: 'Sleeve Type', slug: 'sleeve-type', fieldType: 'select', options: '["Full Sleeve","Half Sleeve","Short Sleeve","Sleeveless","Three-Quarter Sleeve"]', filterable: true, displayOrder: 1 },
    { name: 'Neck Type', slug: 'neck-type', fieldType: 'select', options: '["Round Neck","V-Neck","Collared","Mandarin","Hooded","Boat Neck","Square Neck"]', filterable: true, displayOrder: 2 },
    { name: 'Fit', slug: 'fit', fieldType: 'select', options: '["Regular Fit","Slim Fit","Loose Fit","Oversized","Athletic Fit","Tailored"]', filterable: true, displayOrder: 3 },
    { name: 'Pattern', slug: 'pattern', fieldType: 'select', options: '["Solid","Striped","Printed","Checks","Floral","Graphic","Abstract","Camouflage"]', filterable: true, displayOrder: 4 },
    { name: 'Occasion', slug: 'occasion', fieldType: 'select', options: '["Casual","Formal","Party","Sports","Wedding","Festival","Daily Wear"]', filterable: true, displayOrder: 5 },
    { name: 'Season', slug: 'season', fieldType: 'select', options: '["Summer","Winter","Monsoon","All Season","Spring","Autumn"]', filterable: true, displayOrder: 6 },
    { name: 'Stretch', slug: 'stretch', fieldType: 'select', options: '["No Stretch","Medium Stretch","High Stretch","4-Way Stretch"]', displayOrder: 7 },
  ];

  const jeansAttrs = [
    { name: 'Rise', slug: 'rise', fieldType: 'select', options: '["Low Rise","Mid Rise","High Rise","Ultra High Rise"]', filterable: true, displayOrder: 1 },
    { name: 'Closure', slug: 'closure', fieldType: 'select', options: '["Button Fly","Zip Fly","Elastic","Drawstring"]', displayOrder: 2 },
    { name: 'Length', slug: 'jean-length', fieldType: 'select', options: '["Full Length","Ankle Length","Cropped","Capri"]', filterable: true, displayOrder: 3 },
    { name: 'Wash', slug: 'wash', fieldType: 'select', options: '["Raw","Light Wash","Medium Wash","Dark Wash","Black Wash","Acid Wash"]', filterable: true, displayOrder: 4 },
    { name: 'Distressed', slug: 'distressed', fieldType: 'boolean', displayOrder: 5 },
  ];

  const footwearAttrs = [
    { name: 'Shoe Size', slug: 'shoe-size', fieldType: 'select', options: '["6","7","8","9","10","11","12","2","3","4","5"]', filterable: true, displayOrder: 1 },
    { name: 'Sole Material', slug: 'sole-material', fieldType: 'select', options: '["Rubber","EVA","PU Leather","Leather","Foam","TPR"]', filterable: true, displayOrder: 2 },
    { name: 'Upper Material', slug: 'upper-material', fieldType: 'select', options: '["Leather","Canvas","Mesh","Synthetic","Suede","Textile"]', filterable: true, displayOrder: 3 },
    { name: 'Heel Height', slug: 'heel-height', fieldType: 'select', options: '["Flat","Low Heel","Mid Heel","High Heel","Platform"]', displayOrder: 4 },
    { name: 'Closure', slug: 'footwear-closure', fieldType: 'select', options: '["Lace-Up","Slip-On","Velcro","Buckle","Zipper","Elastic"]', displayOrder: 5 },
    { name: 'Waterproof', slug: 'waterproof', fieldType: 'boolean', displayOrder: 6 },
  ];

  const accessoryAttrs = [
    { name: 'Material', slug: 'acc-material', fieldType: 'select', options: '["Leather","PU Leather","Canvas","Nylon","Metal","Plastic","Wood"]', filterable: true, displayOrder: 1 },
    { name: 'Closure', slug: 'acc-closure', fieldType: 'select', options: '["Zipper","Buckle","Snap","Magnetic","Drawstring","Velcro"]', displayOrder: 2 },
    { name: 'Water Resistant', slug: 'water-resistant', fieldType: 'boolean', displayOrder: 3 },
    { name: 'Compartments', slug: 'compartments', fieldType: 'number', displayOrder: 4 },
    { name: 'Laptop Compatible', slug: 'laptop-compatible', fieldType: 'boolean', displayOrder: 5 },
    { name: 'Capacity', slug: 'capacity', fieldType: 'text', displayOrder: 6 },
  ];

  const babyAttrs = [
    { name: 'Age Range', slug: 'age-range', fieldType: 'select', options: '["0-3 Months","3-6 Months","6-12 Months","12-18 Months","18-24 Months","2-3 Years","3-4 Years"]', filterable: true, displayOrder: 1 },
    { name: 'Baby Skin Safe', slug: 'baby-skin-safe', fieldType: 'boolean', displayOrder: 2 },
    { name: 'Hypoallergenic', slug: 'hypoallergenic', fieldType: 'boolean', displayOrder: 3 },
    { name: 'Machine Washable', slug: 'machine-washable', fieldType: 'boolean', displayOrder: 4 },
    { name: 'Organic', slug: 'organic', fieldType: 'boolean', displayOrder: 5 },
  ];

  const allClothingAttrs = [...clothingAttrs, ...jeansAttrs];
  const allAttrsMap: Record<string, { attrs: any[]; groupId: string }> = {
    'men': { attrs: allClothingAttrs, groupId: clothingGroup.id },
    'women': { attrs: allClothingAttrs, groupId: clothingGroup.id },
    'kids': { attrs: [...clothingAttrs.slice(0, 4), ...babyAttrs.slice(0, 3)], groupId: clothingGroup.id },
    'accessories': { attrs: accessoryAttrs, groupId: accessoryGroup.id },
    'baby': { attrs: babyAttrs, groupId: babyGroup.id },
    'footwear': { attrs: footwearAttrs, groupId: footwearGroup.id },
  };

  for (const [catSlug, config] of Object.entries(allAttrsMap)) {
    const cat = await prisma.category.findUnique({ where: { slug: catSlug } });
    if (!cat) continue;

    const childCats = await prisma.category.findMany({ where: { parentId: cat.id } });
    const targetCats = [cat, ...childCats];

    for (const attrDef of config.attrs) {
      let attr = await prisma.attribute.findUnique({ where: { slug: attrDef.slug } });
      if (!attr) {
        attr = await prisma.attribute.create({
          data: { groupId: config.groupId, name: attrDef.name, slug: attrDef.slug, fieldType: attrDef.fieldType, options: attrDef.options || '[]', filterable: attrDef.filterable || false, displayOrder: attrDef.displayOrder },
        });
      }
      for (const targetCat of targetCats) {
        const existing = await prisma.subcategoryAttribute.findFirst({ where: { subcategoryId: targetCat.id, attributeId: attr.id } });
        if (!existing) {
          await prisma.subcategoryAttribute.create({ data: { subcategoryId: targetCat.id, attributeId: attr.id, displayOrder: attrDef.displayOrder } });
        }
      }
    }
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
