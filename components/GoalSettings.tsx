'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Goals } from '@/hooks/useNutrition';

interface Props {
  goals: Goals;
  onUpdate: (g: Goals) => void;
  onClose: () => void;
}

export default function GoalSettings({ goals, onUpdate, onClose }: Props) {
  const [local, setLocal] = useState(goals);

  function save() {
    if (local.calories > 0 && local.protein > 0) {
      onUpdate(local);
      onClose();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="card mb-5 border border-white/10 space-y-4"
    >
      <h2 className="text-sm font-semibold text-white">Daily Goals</h2>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Calorie goal (kcal)</label>
          <input
            type="number"
            inputMode="numeric"
            value={local.calories}
            onChange={e => setLocal(p => ({ ...p, calories: Number(e.target.value) }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Protein goal (g)</label>
          <input
            type="number"
            inputMode="numeric"
            value={local.protein}
            onChange={e => setLocal(p => ({ ...p, protein: Number(e.target.value) }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-400 text-sm hover:bg-white/10 transition-colors active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          onClick={save}
          className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors active:scale-[0.98]"
        >
          Save
        </button>
      </div>
    </motion.div>
  );
}
