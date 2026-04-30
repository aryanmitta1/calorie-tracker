'use client';

interface Props {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: 'amber' | 'emerald';
  onChange: (v: number) => void;
}

const hex = { amber: '#f97316', emerald: '#60a5fa' };

export default function NutrientSlider({ label, value, max, unit, color, onChange }: Props) {
  const capped = Math.min(value, max);
  const pct = max > 0 ? (capped / max) * 100 : 0;
  const h = hex[color];

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-zinc-300 font-medium">{label}</span>
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
          background: `linear-gradient(to right, ${h} ${pct}%, #27272a ${pct}%)`,
        }}
        className="w-full"
      />

      <div className="flex justify-between text-[10px] text-zinc-600">
        <span>0</span>
        <span>{Math.round(max).toLocaleString()} {unit}</span>
      </div>
    </div>
  );
}
