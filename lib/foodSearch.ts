// Open Food Facts integration — free, no API key required.
// Requests go through our own /api proxy routes (server-side) to avoid
// browser CORS/connectivity issues. Docs:
// https://openfoodfacts.github.io/openfoodfacts-server/api/

export interface FoodResult {
  id: string;
  name: string;
  brand: string;
  /** Macros per 100g of the product. */
  per100: { calories: number; protein: number; carbs: number };
  /** Serving size in grams, if the product declares one. */
  servingG: number | null;
  /** Human label for the serving, e.g. "30 g" or "1 cup (240 ml)". */
  servingLabel: string | null;
}

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  'energy_100g'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
}

interface OFFProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: OFFNutriments;
  serving_size?: string;
  serving_quantity?: number | string;
}

function kcalPer100(n: OFFNutriments | undefined): number {
  if (!n) return 0;
  if (typeof n['energy-kcal_100g'] === 'number') return Math.round(n['energy-kcal_100g']);
  // Some products only report kilojoules; convert (1 kcal ≈ 4.184 kJ).
  if (typeof n['energy_100g'] === 'number') return Math.round(n['energy_100g'] / 4.184);
  return 0;
}

function normalize(p: OFFProduct): FoodResult | null {
  const name = (p.product_name ?? '').trim();
  if (!name) return null;

  const per100 = {
    calories: kcalPer100(p.nutriments),
    protein: Math.round((p.nutriments?.proteins_100g ?? 0) * 10) / 10,
    carbs: Math.round((p.nutriments?.carbohydrates_100g ?? 0) * 10) / 10,
  };

  // Skip products with no usable calorie data — they can't be logged meaningfully.
  if (per100.calories === 0 && per100.protein === 0 && per100.carbs === 0) return null;

  const servingQ = typeof p.serving_quantity === 'string'
    ? parseFloat(p.serving_quantity)
    : p.serving_quantity;

  return {
    id: p.code ?? name,
    name,
    brand: (p.brands ?? '').split(',')[0].trim(),
    per100,
    servingG: servingQ && !Number.isNaN(servingQ) ? servingQ : null,
    servingLabel: p.serving_size?.trim() || null,
  };
}

export async function searchFoods(query: string, signal?: AbortSignal): Promise<FoodResult[]> {
  const q = query.trim();
  if (!q) return [];

  const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) throw new Error('Search failed');

  const data = (await res.json()) as { products?: OFFProduct[] };
  return (data.products ?? [])
    .map(normalize)
    .filter((r): r is FoodResult => r !== null);
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<FoodResult | null> {
  const clean = code.trim();
  if (!clean) return null;

  const res = await fetch(`/api/barcode?code=${encodeURIComponent(clean)}`, { signal });
  if (!res.ok) throw new Error('Lookup failed');

  const data = (await res.json()) as { status?: number; product?: OFFProduct };
  if (data.status !== 1 || !data.product) return null;
  return normalize(data.product);
}

/** Scale a product's per-100g macros to the given gram amount, rounded. */
export function scaleByGrams(per100: FoodResult['per100'], grams: number) {
  const factor = grams / 100;
  return {
    calories: Math.round(per100.calories * factor),
    protein: Math.round(per100.protein * factor),
    carbs: Math.round(per100.carbs * factor),
  };
}
