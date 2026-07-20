const API = 'https://ecommerce-backend-ss1r.onrender.com/api/v1';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const categoryImages: Record<string, string> = {
  'T-Shirts': 'https://picsum.photos/seed/tshirts-cat/600/400',
  'Trousers': 'https://picsum.photos/seed/trousers-cat/600/400',
  'Jackets': 'https://picsum.photos/seed/jackets-cat/600/400',
  'Baby': 'https://picsum.photos/seed/baby-cat/600/400',
  'Sports Shoes': 'https://picsum.photos/seed/sport-shoes-cat/600/400',
  'Hats': 'https://picsum.photos/seed/hats-cat/600/400',
  'Outerwear': 'https://picsum.photos/seed/outerwear-cat/600/400',
  'Activewear': 'https://picsum.photos/seed/activewear-cat/600/400',
  'Footwear': 'https://picsum.photos/seed/footwear-cat/600/400',
  'Boots': 'https://picsum.photos/seed/boots-cat/600/400',
  'Jeans': 'https://picsum.photos/seed/jeans-cat/600/400',
  'Hoodies': 'https://picsum.photos/seed/hoodies-cat/600/400',
  'Scarves': 'https://picsum.photos/seed/scarves-cat/600/400',
  'Jewellery': 'https://picsum.photos/seed/jewellery-cat/600/400',
  'Flats': 'https://picsum.photos/seed/flats-cat/600/400',
  'Kurtas': 'https://picsum.photos/seed/kurtas-cat/600/400',
  'Traditional': 'https://picsum.photos/seed/traditional-cat/600/400',
  'Leggings': 'https://picsum.photos/seed/leggings-cat/600/400',
  'Palazzo': 'https://picsum.photos/seed/palazzo-cat/600/400',
  'Blazers': 'https://picsum.photos/seed/blazers-cat/600/400',
  'Nightwear': 'https://picsum.photos/seed/nightwear-cat/600/400',
  'Wallets': 'https://picsum.photos/seed/wallets-cat/600/400',
  'Skirts': 'https://picsum.photos/seed/skirts-cat/600/400',
  'Shorts': 'https://picsum.photos/seed/shorts-cat/600/400',
};

async function login(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rajakajaykumar686@gmail.com', password: '@Kareena.com201522' }),
  });
  const data: any = await res.json();
  return data.data.accessToken;
}

async function main() {
  console.log('=== Retrying category images ===\n');
  const token = await login();

  const res = await fetch(`${API}/admin/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const cats: any = await res.json();
  const missing = cats.data.filter((c: any) => !c.image);
  console.log(`Missing: ${missing.length} categories\n`);

  let updated = 0;
  for (const cat of missing) {
    const imgUrl = categoryImages[cat.name];
    if (!imgUrl) { console.log(`  No mapping for: ${cat.name}`); continue; }

    let ok = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const putRes = await fetch(`${API}/admin/categories/${cat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ image: imgUrl }),
        });
        const result: any = await putRes.json();
        if (result.success) { ok = true; break; }
        if (result.message?.includes('many requests')) {
          const wait = 20000 + attempt * 15000;
          console.log(`  Rate limited [${cat.name}], waiting ${wait / 1000}s...`);
          await delay(wait);
        } else {
          console.log(`  FAIL [${cat.name}]: ${result.message}`);
          break;
        }
      } catch (err: any) {
        console.log(`  ERROR [${cat.name}]: ${err.message}`);
        break;
      }
    }
    if (ok) { updated++; console.log(`  OK: ${cat.name}`); }
    await delay(3000);
  }

  console.log(`\n=== DONE === Updated: ${updated}`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
