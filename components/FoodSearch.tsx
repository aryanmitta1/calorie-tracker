'use client';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { searchFoods, type FoodResult } from '@/lib/foodSearch';
import ServingPicker from '@/components/ServingPicker';

interface Props {
  onAdd: (calories: number, protein: number, carbs: number, description: string) => void;
}

export default function FoodSearch({ onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced search as the user types.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const found = await searchFoods(q, controller.signal);
        setResults(found);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError('Search failed — check your connection.');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(handle);
  }, [query]);

  function handleConfirm(calories: number, protein: number, carbs: number, description: string) {
    onAdd(calories, protein, carbs, description);
    setSelected(null);
    setQuery('');
    setResults([]);
  }

  return (
    <div className="card mb-4 space-y-3">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Search Food Database</h2>

      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="e.g. greek yogurt, banana, cheerios..."
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
      />

      <AnimatePresence mode="wait">
        {selected && (
          <ServingPicker
            key="picker"
            food={selected}
            onConfirm={handleConfirm}
            onCancel={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      {loading && <p className="text-xs text-zinc-500">Searching…</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {!selected && results.length > 0 && (
        <ul className="space-y-1 max-h-72 overflow-y-auto">
          {results.map(food => (
            <li key={food.id}>
              <button
                onClick={() => setSelected(food)}
                className="w-full text-left p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors active:scale-[0.99]"
              >
                <p className="text-sm text-zinc-200 leading-snug">{food.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {food.brand && <span className="text-[10px] text-zinc-500">{food.brand}</span>}
                  <span className="text-[10px] text-zinc-600 tabular-nums">
                    {food.per100.calories} kcal · {food.per100.protein}g P · {food.per100.carbs}g C / 100g
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && !selected && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-xs text-zinc-600">No matches found.</p>
      )}
    </div>
  );
}
