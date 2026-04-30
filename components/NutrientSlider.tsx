'use client';

interface Props {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: 'amber' | 'emerald';
  onChange: (v: number) => void;
}

const hex = { amber: '#f59e0b', emerald: '#10b981' };

export default function NutrientSlider({ label, value, max, unit, color, onChange }: Props) {
  const capped = Math.min(value, max);
  const pct = max > 0 ? (capped / max) * 100 : 0;
  const h = hex[color];

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-slate-300 font-medium">{label}</span>
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: h }}
        >
          {value.toLocaleString()} {unit}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={Math.round(max)}
        value={capped}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, ${h} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
        }}
        className="w-full"
      />

      <div className="flex justify-between text-[10px] text-slate-600">
        <span>0</span>
        <span>{Math.round(max).toLocaleString()} {unit}</span>
      </div>
    </div>
  );
}
