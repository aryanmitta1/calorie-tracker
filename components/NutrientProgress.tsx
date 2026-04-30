'use client';
import { motion } from 'framer-motion';

interface Props {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: 'amber' | 'emerald';
}

const palette = {
  amber: {
    text: 'text-orange-500',
    bar: 'bg-orange-500',
    glow: '',
    border: 'border-zinc-800',
    subtext: 'text-zinc-500',
  },
  emerald: {
    text: 'text-blue-400',
    bar: 'bg-blue-400',
    glow: '',
    border: 'border-zinc-800',
    subtext: 'text-zinc-500',
  },
};

export default function NutrientProgress({ label, current, goal, unit, color }: Props) {
  const pct = Math.min(100, (current / goal) * 100);
  const over = current > goal;
  const c = palette[color];

  return (
    <div className={`card border ${c.border} flex flex-col gap-2`}>
      <p className={`text-[10px] font-semibold uppercase tracking-widest ${c.subtext}`}>{label}</p>

      <div>
        <span className={`text-3xl font-bold tabular-nums ${c.text}`}>
          {current.toLocaleString()}
        </span>
        <span className="text-xs text-zinc-600 ml-1">{unit}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${over ? 'bg-red-400' : c.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <p className="text-[10px] text-zinc-600">
        {over
          ? `+${(current - goal).toLocaleString()} over goal`
          : `${(goal - current).toLocaleString()} ${unit} left`}
      </p>
    </div>
  );
}
