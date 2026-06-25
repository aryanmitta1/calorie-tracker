import { NextRequest, NextResponse } from 'next/server';

// Proxy to Open Food Facts "Search-a-licious" — the current, reliable search
// service (the legacy cgi/search.pl and v2/search endpoints heavily throttle
// and often return 503). Free, no API key required.
const SEARCH_URL = 'https://search.openfoodfacts.org/search';
const FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json({ products: [] });

  const url = `${SEARCH_URL}?q=${encodeURIComponent(q)}&page_size=20&fields=${FIELDS}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AryanCalorieTracker/1.0' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Search failed' }, { status: 502 });
    }
    const data = await res.json();
    // Normalize Search-a-licious shape (hits[], brands as array) to the same
    // product shape the barcode endpoint returns, so the client stays uniform.
    const products = (data.hits ?? []).map((h: Record<string, unknown>) => ({
      ...h,
      brands: Array.isArray(h.brands) ? h.brands.join(', ') : h.brands,
    }));
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: 'Search request failed' }, { status: 502 });
  }
}
