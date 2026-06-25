import type { DayData, History } from '@/hooks/useNutrition';

export interface DaySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  entries: number;
  /** True when no data exists for this calendar day (used to render empty bars). */
  empty: boolean;
}

export interface Averages {
  calories: number;
  protein: number;
  carbs: number;
  /** Number of days actually logged (≥1 entry) within the window. */
  loggedDays: number;
}

function toDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function summarize(date: string, day: DayData | undefined): DaySummary {
  if (!day) {
    return { date, calories: 0, protein: 0, carbs: 0, entries: 0, empty: true };
  }
  return {
    date,
    calories: day.calories,
    protein: day.protein,
    carbs: day.carbs,
    entries: day.log.length,
    empty: day.log.length === 0 && day.calories === 0 && day.protein === 0 && day.carbs === 0,
  };
}

/**
 * Returns a contiguous run of the last `days` calendar days ending today,
 * oldest first, with empty placeholders for days that have no data.
 */
export function recentDays(history: History, days: number, today = new Date()): DaySummary[] {
  const out: DaySummary[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toKey(d);
    out.push(summarize(key, history[key]));
  }
  return out;
}

/** Average macros across days that were actually logged within the window. */
export function averages(summaries: DaySummary[]): Averages {
  const logged = summaries.filter(s => !s.empty);
  if (logged.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, loggedDays: 0 };
  }
  const sum = logged.reduce(
    (acc, s) => ({
      calories: acc.calories + s.calories,
      protein: acc.protein + s.protein,
      carbs: acc.carbs + s.carbs,
    }),
    { calories: 0, protein: 0, carbs: 0 },
  );
  return {
    calories: Math.round(sum.calories / logged.length),
    protein: Math.round(sum.protein / logged.length),
    carbs: Math.round(sum.carbs / logged.length),
    loggedDays: logged.length,
  };
}

/**
 * Current logging streak: consecutive days with ≥1 entry, counting back from
 * today. Today not yet logged doesn't break a streak that ran up to yesterday.
 */
export function currentStreak(history: History, today = new Date()): number {
  const logged = (d: Date) => {
    const day = history[toKey(d)];
    return !!day && day.log.length > 0;
  };

  let streak = 0;
  const cursor = new Date(today);

  // If today isn't logged yet, start counting from yesterday.
  if (!logged(cursor)) cursor.setDate(cursor.getDate() - 1);

  while (logged(cursor)) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** All logged days, most recent first — for the scrollable history list. */
export function loggedDaysDescending(history: History): DaySummary[] {
  return Object.keys(history)
    .map(date => summarize(date, history[date]))
    .filter(s => !s.empty)
    .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
}
