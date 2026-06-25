import { NextRequest, NextResponse } from 'next/server';

// Proxy to Open Food Facts product lookup (server-side, no API key).
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim() ?? '';
  if (!code) return NextResponse.json({ error: 'No barcode provided' }, { status: 400 });

  const url = `${PRODUCT_URL}/${encodeURIComponent(code)}.json?fields=${FIELDS}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AryanCalorieTracker/1.0' },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Lookup failed' }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ status: data.status, product: data.product ?? null });
  } catch {
    return NextResponse.json({ error: 'Lookup request failed' }, { status: 502 });
  }
}
