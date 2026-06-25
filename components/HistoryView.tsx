'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { History, Goals } from '@/hooks/useNutrition';
import { recentDays, averages, currentStreak, loggedDaysDescending } from '@/lib/stats';

interface Props {
  history: History;
  goals: Goals;
}

export default function HistoryView({ history, goals }: Props) {
  const [range, setRange] = useState<7 | 30>(7);
  const [expanded, setExpanded] = useState<string | null>(null);

  const days = recentDays(history, range);
  const avg = averages(days);
  const streak = currentStreak(history);
  const loggedDays = loggedDaysDescending(history);

  const maxCal = Math.max(goals.calories, ...days.map(d => d.calories), 1);

  return (
    <div className="space-y-5">
      {/* Streak + range toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-xl font-bold text-white leading-none tabular-nums">{streak}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">day streak</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {([7, 30] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === r ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Calorie bar chart vs goal */}
      <div className="card space-y-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Calories — last {range} days</h2>
        <div className="flex items-end gap-[3px] h-32">
          {days.map(d => {
            const pct = (d.calories / maxCal) * 100;
            const over = d.calories > goals.calories;
            return (
              <div key={d.date} className="flex-1 flex flex-col justify-end h-full" title={`${d.date}: ${d.calories} kcal`}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className={`w-full rounded-t-sm ${d.empty ? 'bg-zinc-800' : over ? 'bg-red-400' : 'bg-orange-500'}`}
                />
              </div>
            );
          })}
        </div>
        {/* Goal reference line note */}
        <p className="text-[10px] text-zinc-600">Goal: {goals.calories.toLocaleString()} kcal/day</p>
      </div>

      {/* Averages across logged days */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Avg kcal" value={avg.calories.toLocaleString()} color="text-orange-500" />
        <Stat label="Avg protein" value={`${avg.protein}g`} color="text-blue-400" />
        <Stat label="Avg carbs" value={`${avg.carbs}g`} color="text-violet-400" />
      </div>
      <p className="text-[10px] text-zinc-600 -mt-3">
        Averaged over {avg.loggedDays} logged day{avg.loggedDays === 1 ? '' : 's'} in this window.
      </p>

      {/* Scrollable list of logged days */}
      <div className="card">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">All logged days</h2>
        {loggedDays.length === 0 ? (
          <p className="text-xs text-zinc-600">No days logged yet.</p>
        ) : (
          <ul className="space-y-1">
            {loggedDays.map(d => {
              const day = history[d.date];
              const isOpen = expanded === d.date;
              return (
                <li key={d.date} className="border-b border-zinc-800 last:border-0">
                  <button
                    onClick={() => setExpanded(isOpen ? null : d.date)}
                    className="w-full flex items-center justify-between py-2.5 text-left"
                  >
                    <div>
                      <p className="text-sm text-zinc-200">{formatDate(d.date)}</p>
                      <p className="text-[10px] text-zinc-600">{d.entries} item{d.entries === 1 ? '' : 's'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-xs font-semibold tabular-nums">
                      <span className="text-orange-500">{d.calories} kcal</span>
                      <span className="text-zinc-500">{d.protein}g P · {d.carbs}g C</span>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isOpen && day && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pb-2 space-y-1.5"
                      >
                        {day.log.map(entry => (
                          <li key={entry.id} className="flex items-start justify-between gap-3 pl-2">
                            <span className="text-xs text-zinc-400 leading-snug flex-1 min-w-0">{entry.description}</span>
                            <span className="text-[11px] text-zinc-500 tabular-nums shrink-0">
                              {entry.calories} kcal
                            </span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function formatDate(s: string): string {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
