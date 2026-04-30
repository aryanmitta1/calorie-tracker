'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { FoodEntry } from '@/hooks/useNutrition';

interface Props {
  entries: FoodEntry[];
}

export default function FoodLog({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="card">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Today's Log</h2>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {entries.map(entry => (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-snug">{entry.description}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-0.5 text-xs font-semibold tabular-nums">
                <span className="text-amber-400">+{entry.calories} kcal</span>
                <span className="text-emerald-400">+{entry.protein}g</span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
