const API = 'https://ecommerce-backend-ss1r.onrender.com/api/v1';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function imgs(slug: string, count = 7) {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://picsum.photos/seed/${slug}-${i + 1}/600/800`,
    alt: `${slug} image ${i + 1}`,
    isPrimary: i === 0,
    displayOrder: i,
  }));
}

async function login(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rajakajaykumar686@gmail.com', password: '@Kareena.com201522' }),
  });
  const data: any = await res.json();
  if (data.success && data.data?.accessToken) return data.data.accessToken;
  throw new Error('Login failed');
}

async function main() {
  console.log('=== Fixing images (only products with <7 images) ===\n');
  const token = await login();

  let allProducts: any[] = [];
  let page = 1;
  while (true) {
    const res: any = await fetch(`${API}/admin/products?limit=50&page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success && data.data?.length) {
      allProducts.push(...data.data);
      if (data.data.length < 50) break;
      page++;
    } else break;
    await delay(500);
  }

  const needsFix = allProducts.filter((p) => (p.images?.length || 0) < 7);
  console.log(`Total: ${allProducts.length}, Need images: ${needsFix.length}, Already OK: ${allProducts.length - needsFix.length}\n`);

  let updated = 0;
  let failed = 0;

  for (const p of needsFix) {
    const slug = p.sku?.toLowerCase() || p.slug;
    const imageCount = (p.sku?.startsWith('M-BZ') || p.sku?.startsWith('W-KU-708') || p.sku?.startsWith('W-SR-901') || p.sku?.startsWith('A-WT')) ? 8 : 7;

    let ok = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res: any = await fetch(`${API}/admin/products/${p.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ images: imgs(slug, imageCount) }),
        });
        const data = await res.json();
        if (data.success) { ok = true; break; }
        if (data.message?.includes('many requests')) {
          const wait = 20000 + attempt * 10000;
          console.log(`  Rate limited [${p.sku}], waiting ${wait/1000}s (attempt ${attempt+1})...`);
          await delay(wait);
        } else {
          console.log(`  FAIL [${p.sku}]: ${data.message}`);
          break;
        }
      } catch (err: any) {
        console.log(`  ERROR [${p.sku}]: ${err.message}`);
        break;
      }
    }

    if (ok) {
      updated++;
      if (updated % 10 === 0) console.log(`  Updated ${updated}...`);
    } else {
      failed++;
    }

    await delay(3000);
  }

  console.log(`\n=== DONE ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
