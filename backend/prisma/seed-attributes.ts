import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding attributes...');

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
    const group = await prisma.attributeGroup.upsert({
      where: { slug: g.slug },
      update: { name: g.name },
      create: g,
    });
    groupMap[g.slug] = group.id;
  }
  console.log('Attribute groups seeded');

  // ============ ATTRIBUTES ============
  const attributes = [
    // Clothing
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

    // Footwear
    { group: 'footwear', name: 'Upper Material', slug: 'upper-material', fieldType: 'select', options: ['Leather', 'Synthetic', 'Canvas', 'Mesh', 'Suede', 'Textile', 'Patent Leather', 'Rubber'], filterable: true, displayOrder: 1 },
    { group: 'footwear', name: 'Sole Material', slug: 'sole-material', fieldType: 'select', options: ['Rubber', 'EVA', 'PU', 'Leather', 'TPR', 'Vibram', 'Memory Foam'], filterable: true, displayOrder: 2 },
    { group: 'footwear', name: 'Heel Height', slug: 'heel-height', fieldType: 'select', options: ['Flat', 'Low Heel (1-2 inch)', 'Mid Heel (2-3 inch)', 'High Heel (3-4 inch)', 'Stiletto (4+ inch)', 'Wedge', 'Block Heel'], filterable: true, displayOrder: 3 },
    { group: 'footwear', name: 'Toe Shape', slug: 'toe-shape', fieldType: 'select', options: ['Round', 'Pointed', 'Square', 'Open Toe', 'Almond', 'Peep Toe'], displayOrder: 4 },
    { group: 'footwear', name: 'Water Resistant', slug: 'water-resistant', fieldType: 'boolean', displayOrder: 5 },
    { group: 'footwear', name: 'Shoe Size', slug: 'shoe-size', fieldType: 'multiselect', options: ['6', '7', '8', '9', '10', '11', '12', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'], filterable: true, displayOrder: 6 },
    { group: 'footwear', name: 'Footwear Color', slug: 'footwear-color', fieldType: 'multiselect', options: ['Black', 'White', 'Brown', 'Tan', 'Navy', 'Red', 'Gray', 'Beige', 'Pink', 'Green', 'Multi'], filterable: true, displayOrder: 7 },
    { group: 'footwear', name: 'Footwear Occasion', slug: 'footwear-occasion', fieldType: 'select', options: ['Casual', 'Formal', 'Sports', 'Running', 'Walking', 'Party', 'Sandals', 'Flip Flops', 'Boots', 'Slippers'], filterable: true, displayOrder: 8 },

    // Accessories
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
  for (const a of attributes) {
    const attr = await prisma.attribute.upsert({
      where: { slug: a.slug },
      update: { name: a.name, groupId: groupMap[a.group], fieldType: a.fieldType, options: JSON.stringify(a.options || []), filterable: a.filterable || false, searchable: a.searchable || false, displayOrder: a.displayOrder },
      create: {
        groupId: groupMap[a.group],
        name: a.name,
        slug: a.slug,
        fieldType: a.fieldType,
        options: JSON.stringify(a.options || []),
        filterable: a.filterable || false,
        searchable: a.searchable || false,
        displayOrder: a.displayOrder,
      },
    });
    attrMap[a.slug] = attr.id;
  }
  console.log(`${attributes.length} attributes seeded`);

  // ============ SUBCATEGORY MAPPINGS ============
  const cats = await prisma.category.findMany();
  const catMap: Record<string, string> = {};
  cats.forEach(c => { catMap[c.slug] = c.id; });

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
    'women-leggings': ['fit', 'waist-rise', 'stretchable', 'fabric', 'material', 'color', 'clothing-size', 'occasion', 'wash-care', 'opacity'],
    'women-palazzo': ['fit', 'waist-rise', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'closure', 'clothing-length'],
    'women-skirts': ['fit', 'waist-rise', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'occasion', 'wash-care', 'pleats', 'clothing-length'],
    'kids-t-shirts': ['sleeve-type', 'neck-style', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'wash-care', 'graphic-print'],
    'kids-jeans': ['fit', 'waist-rise', 'fabric', 'material', 'color', 'clothing-size', 'wash-care'],
    'kids-dresses': ['sleeve-type', 'neck-style', 'fabric', 'material', 'pattern', 'color', 'clothing-size', 'wash-care', 'clothing-length'],
  };

  let mappingCount = 0;
  for (const [subSlug, attrSlugs] of Object.entries(mappings)) {
    const subId = catMap[subSlug];
    if (!subId) continue;
    for (let i = 0; i < attrSlugs.length; i++) {
      const attrId = attrMap[attrSlugs[i]];
      if (!attrId) continue;
      await prisma.subcategoryAttribute.upsert({
        where: { subcategoryId_attributeId: { subcategoryId: subId, attributeId: attrId } },
        update: { displayOrder: i + 1 },
        create: { subcategoryId: subId, attributeId: attrId, displayOrder: i + 1 },
      });
      mappingCount++;
    }
  }
  console.log(`${mappingCount} subcategory-attribute mappings seeded`);

  console.log('Attribute seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
