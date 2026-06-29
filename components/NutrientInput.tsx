'use client';
import { useState } from 'react';

interface Props {
  label: string;
  value: number;
  unit: string;
  color: 'amber' | 'emerald' | 'violet';
  onAdjust: (delta: number) => void;
}

const hex = { amber: '#f97316', emerald: '#60a5fa', violet: '#a78bfa' };

export default function NutrientInput({ label, value, unit, color, onAdjust }: Props) {
  // The field holds a delta to add/subtract from the running total, not the
  // total itself. Cleared after each apply so it's ready for the next nudge.
  const [draft, setDraft] = useState('');
  const h = hex[color];

  function apply(sign: 1 | -1) {
    // A typed sign (e.g. "-50") combines with the button: the −/+ button sets
    // the base direction, a leading minus in the field flips it. Empty/zero/junk
    // clears without applying so the field is always ready for the next nudge.
    const magnitude = Math.round(Math.abs(Number(draft) || 0));
    const direction = Number(draft) < 0 ? -sign : sign;
    if (magnitude > 0) onAdjust(direction * magnitude);
    setDraft('');
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-sm text-zinc-300 font-medium">{label}</span>
        <span className="text-[10px] text-zinc-600 tabular-nums">
          {value} {unit}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => apply(-1)}
          aria-label={`Subtract ${label}`}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 text-lg font-bold hover:bg-zinc-800 active:scale-95 transition-colors"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onFocus={e => e.target.select()}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); apply(1); } }}
          style={{ color: h }}
          className="w-16 text-center bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-sm font-bold tabular-nums focus:outline-none focus:border-zinc-500 transition-colors"
        />
        <button
          type="button"
          onClick={() => apply(1)}
          aria-label={`Add ${label}`}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-lg font-bold hover:bg-zinc-800 active:scale-95 transition-colors"
          style={{ color: h }}
        >
          +
        </button>
      </div>
    </div>
  );
}
