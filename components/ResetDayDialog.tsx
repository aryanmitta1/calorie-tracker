'use client';
import { motion } from 'framer-motion';
import type { DayData } from '@/hooks/useNutrition';

interface Props {
  day: DayData;
  /** Keep today in the long-term log (counts toward stats). */
  onSave: () => void;
  /** Discard today entirely — remove it from history, board returns to 0. */
  onDiscard: () => void;
  onCancel: () => void;
}

export default function ResetDayDialog({ day, onSave, onDiscard, onCancel }: Props) {
  const empty = day.calories === 0 && day.protein === 0 && day.carbs === 0 && day.log.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-6 pt-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm card border border-zinc-700 space-y-4"
      >
        <div>
          <h2 className="text-base font-bold text-white">End today?</h2>
          <p className="text-xs text-zinc-500 mt-1 leading-snug">
            Today isn&apos;t counted yet. Log it to add it to your averages, streak, and
            history — or discard it to clear today without saving. Nothing is logged
            unless you choose &ldquo;Log this day.&rdquo;
          </p>
        </div>

        {/* Today's totals so the choice is informed */}
        <div className="grid grid-cols-3 gap-2">
          <Total label="kcal" value={day.calories} color="text-orange-500" />
          <Total label="protein" value={`${day.protein}g`} color="text-blue-400" />
          <Total label="carbs" value={`${day.carbs}g`} color="text-violet-400" />
        </div>
        {empty && (
          <p className="text-[11px] text-zinc-600 -mt-1">Nothing logged today yet.</p>
        )}

        <div className="space-y-2 pt-1">
          <button
            onClick={onSave}
            disabled={empty}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 text-white text-sm font-semibold transition-colors active:scale-[0.98]"
          >
            Log this day
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 text-sm font-medium transition-colors active:scale-[0.98]"
          >
            Discard day
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl bg-transparent text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Total({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 px-2 py-2.5 text-center">
      <p className={`text-base font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-zinc-600 mt-0.5">{label}</p>
    </div>
  );
}
