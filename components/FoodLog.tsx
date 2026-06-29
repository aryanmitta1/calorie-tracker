'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { FoodEntry } from '@/hooks/useNutrition';

interface Props {
  entries: FoodEntry[];
  onRemove?: (id: string) => void;
}

export default function FoodLog({ entries, onRemove }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="card">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Today's Log</h2>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {entries.map(entry => (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="flex items-start justify-between gap-3 py-2 border-b border-zinc-800 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 leading-snug">{entry.description}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex items-center shrink-0 gap-2">
                <div className="flex flex-col items-end gap-0.5 text-xs font-semibold tabular-nums">
                  <span className="text-orange-500">+{entry.calories} kcal</span>
                  <span className="text-blue-400">+{entry.protein}g P</span>
                  <span className="text-violet-400">+{entry.carbs}g C</span>
                </div>
                {onRemove && (
                  <button
                    onClick={() => onRemove(entry.id)}
                    aria-label={`Remove ${entry.description}`}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:bg-red-500/10 hover:text-red-400 transition-colors active:scale-95 shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
