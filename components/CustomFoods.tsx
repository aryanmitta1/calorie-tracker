'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CustomFood } from '@/hooks/useNutrition';

interface Props {
  customFoods: CustomFood[];
  onAdd: (calories: number, protein: number, carbs: number, description: string) => void;
  onCreate: (food: Omit<CustomFood, 'id'>) => void;
  onRemove: (id: string) => void;
}

const EMPTY_DRAFT = { name: '', calories: '', protein: '', carbs: '' };

export default function CustomFoods({ customFoods, onAdd, onCreate, onRemove }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [flashId, setFlashId] = useState<string | null>(null);

  function logFood(food: CustomFood) {
    onAdd(food.calories, food.protein, food.carbs, food.name);
    setFlashId(food.id);
    setTimeout(() => setFlashId(prev => (prev === food.id ? null : prev)), 1500);
  }

  function save() {
    const name = draft.name.trim();
    const calories = Number(draft.calories);
    const protein = Number(draft.protein);
    const carbs = Number(draft.carbs);
    if (!name || !(calories >= 0) || !(protein >= 0) || !(carbs >= 0)) return;

    onCreate({ name, calories, protein, carbs });
    setDraft(EMPTY_DRAFT);
    setShowForm(false);
  }

  return (
    <div className="card mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Custom Foods</h2>
        <button
          onClick={() => { setShowForm(v => !v); setDraft(EMPTY_DRAFT); }}
          className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors active:scale-95"
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <input
                type="text"
                value={draft.name}
                onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
                placeholder="Food name"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 mb-1 block">Calories</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={draft.calories}
                    onChange={e => setDraft(p => ({ ...p, calories: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 mb-1 block">Protein</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={draft.protein}
                    onChange={e => setDraft(p => ({ ...p, protein: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-400/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 mb-1 block">Carbs</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={draft.carbs}
                    onChange={e => setDraft(p => ({ ...p, carbs: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-400/60 transition-colors"
                  />
                </div>
              </div>
              <button
                onClick={save}
                disabled={!draft.name.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Food
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {customFoods.length === 0 ? (
        <p className="text-xs text-zinc-600">No custom foods yet. Tap “+ Add” to create one.</p>
      ) : (
        <ul className="space-y-1.5">
          {customFoods.map(food => (
            <li key={food.id} className="flex items-center gap-2">
              <button
                onClick={() => logFood(food)}
                className={`flex-1 text-left p-2.5 rounded-xl border transition-colors active:scale-[0.99]
                  ${flashId === food.id
                    ? 'bg-blue-500/15 border-blue-500/40'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800'}`}
              >
                <p className="text-sm text-zinc-200 leading-snug">
                  {flashId === food.id ? '✓ Logged' : food.name}
                </p>
                <span className="text-[10px] text-zinc-600 tabular-nums">
                  {food.calories} kcal · {food.protein}g P · {food.carbs}g C
                </span>
              </button>
              <button
                onClick={() => onRemove(food.id)}
                aria-label={`Delete ${food.name}`}
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors active:scale-95"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
