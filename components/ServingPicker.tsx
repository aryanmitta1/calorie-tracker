'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { FoodResult } from '@/lib/foodSearch';
import { scaleByGrams } from '@/lib/foodSearch';

interface Props {
  food: FoodResult;
  onConfirm: (calories: number, protein: number, carbs: number, description: string) => void;
  onCancel: () => void;
}

/**
 * Quantity control for a selected food. Lets the user log either by serving
 * count (when the product declares a serving size) or by raw grams, and shows
 * the scaled macros live before confirming.
 */
export default function ServingPicker({ food, onConfirm, onCancel }: Props) {
  const hasServing = food.servingG != null && food.servingG > 0;
  const [mode, setMode] = useState<'serving' | 'grams'>(hasServing ? 'serving' : 'grams');
  const [servings, setServings] = useState(1);
  const [grams, setGrams] = useState(hasServing ? food.servingG! : 100);

  const totalGrams = mode === 'serving' && hasServing ? servings * food.servingG! : grams;
  const macros = scaleByGrams(food.per100, totalGrams);

  function confirm() {
    if (totalGrams <= 0) return;
    const portion = mode === 'serving' && hasServing
      ? `${servings} serving${servings === 1 ? '' : 's'}`
      : `${Math.round(totalGrams)}g`;
    const label = [food.brand, food.name].filter(Boolean).join(' ');
    onConfirm(macros.calories, macros.protein, macros.carbs, `${label} (${portion})`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-3 p-3 rounded-xl bg-zinc-800 border border-zinc-700"
    >
      <div>
        <p className="text-sm text-zinc-100 font-medium leading-snug">{food.name}</p>
        {food.brand && <p className="text-[11px] text-zinc-500">{food.brand}</p>}
      </div>

      {hasServing && (
        <div className="flex gap-1.5">
          <button
            onClick={() => setMode('serving')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'serving' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Servings{food.servingLabel ? ` · ${food.servingLabel}` : ''}
          </button>
          <button
            onClick={() => setMode('grams')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'grams' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Grams
          </button>
        </div>
      )}

      <div>
        <label className="text-[11px] text-zinc-500 mb-1 block">
          {mode === 'serving' ? 'Number of servings' : 'Amount (grams)'}
        </label>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={mode === 'serving' ? 0.5 : 10}
          value={mode === 'serving' ? servings : grams}
          onChange={e => {
            const v = Number(e.target.value);
            if (mode === 'serving') setServings(v);
            else setGrams(v);
          }}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold tabular-nums">
        <span className="text-orange-500">{macros.calories} kcal</span>
        <span className="text-blue-400">{macros.protein}g P</span>
        <span className="text-violet-400">{macros.carbs}g C</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg bg-zinc-900 text-zinc-400 text-xs hover:bg-zinc-700 transition-colors active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          onClick={confirm}
          className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors active:scale-[0.98]"
        >
          Add to diary
        </button>
      </div>
    </motion.div>
  );
}
