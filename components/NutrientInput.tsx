'use client';
import { useState, useEffect } from 'react';

interface Props {
  label: string;
  value: number;
  unit: string;
  color: 'amber' | 'emerald' | 'violet';
  onChange: (v: number) => void;
}

const hex = { amber: '#f97316', emerald: '#60a5fa', violet: '#a78bfa' };

export default function NutrientInput({ label, value, unit, color, onChange }: Props) {
  // Local draft lets the user clear the field and type freely without the
  // committed total fighting their keystrokes. Synced when the total changes
  // elsewhere (e.g. logging food).
  const [draft, setDraft] = useState(String(value));
  const h = hex[color];

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit(raw: string) {
    const n = Math.max(0, Math.round(Number(raw) || 0));
    onChange(n);
    setDraft(String(n));
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-zinc-300 font-medium">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          style={{ color: h }}
          className="w-24 text-right bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-2 text-sm font-bold tabular-nums focus:outline-none focus:border-zinc-500 transition-colors"
        />
        <span className="text-xs text-zinc-600 w-8">{unit}</span>
      </div>
    </div>
  );
}
