'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  loadHistoryRaw,
  saveHistorySafe,
  loadGoalsRaw,
  saveGoalsSafe,
  loadCustomFoodsRaw,
  saveCustomFoodsSafe,
  safeGet,
  safeRemove,
  serializeExport,
  parseImport,
  mergeImport,
  mergeCustomFoods,
  getLastBackupAt,
  setLastBackupAt,
  LEGACY_DATA_KEY,
  PREIMPORT_KEY,
  type MergeSummary,
} from '@/lib/storage';

export interface FoodEntry {
  id: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  timestamp: number;
}

export interface DayData {
  calories: number;
  protein: number;
  carbs: number;
  log: FoodEntry[];
  date: string;
}

export type History = Record<string, DayData>;

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
}

export interface CustomFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
}

const DEFAULT_GOALS: Goals = { calories: 2150, protein: 155, carbs: 250 };
const DEFAULT_CUSTOM_FOODS: CustomFood[] = [
  { id: 'office-yogurt', name: 'Office Yogurt', calories: 60, protein: 12, carbs: 5 },
];

export function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function stamp(): string {
  // Filesystem/key-safe timestamp for quarantine + export filenames.
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function emptyDay(date = todayString()): DayData {
  return { calories: 0, protein: 0, carbs: 0, log: [], date };
}

function normalizeDay(raw: Partial<DayData> | undefined, date: string): DayData {
  if (!raw) return emptyDay(date);
  return {
    date,
    calories: raw.calories ?? 0,
    protein: raw.protein ?? 0,
    carbs: raw.carbs ?? 0,
    log: (raw.log ?? []).map(e => ({ ...e, carbs: e.carbs ?? 0 })),
  };
}

function normalizeHistory(raw: History): History {
  const out: History = {};
  for (const [date, day] of Object.entries(raw)) {
    out[date] = normalizeDay(day, date);
  }
  return out;
}

export interface ImportResult {
  ok: boolean;
  summary?: MergeSummary;
  error?: string;
}

export function useNutrition() {
  const [history, setHistory] = useState<History>({});
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>(DEFAULT_CUSTOM_FOODS);
  const [ready, setReady] = useState(false);
  const [lastBackupAt, setLastBackupState] = useState<number | null>(null);

  useEffect(() => {
    // Best-effort: ask the browser to make our storage persistent so it isn't
    // evicted under storage pressure. Works on Chrome/Firefox/Android/desktop;
    // a harmless no-op on iOS Safari (there, Home-Screen install is what helps).
    try {
      navigator.storage?.persist?.().catch(() => {});
    } catch {
      /* ignore */
    }

    // Goals: keep defaults for pre-carbs goals; otherwise honor stored.
    const storedGoals = loadGoalsRaw();
    if (storedGoals && typeof storedGoals.carbs === 'number') {
      setGoals(storedGoals);
    }

    // Custom foods.
    const storedCustom = loadCustomFoodsRaw();
    if (storedCustom) setCustomFoods(storedCustom);

    // History: defensive load. NEVER overwrite storage on a failed read — this
    // is the core fix for the original "corrupt read → silent total wipe" bug.
    const { history: loaded, needsHeal } = loadHistoryRaw(stamp());

    if (loaded == null) {
      // Unrecoverable corruption: run this session with an empty in-memory map
      // but do NOT persist it. The corrupt bytes are already quarantined and
      // the real keys are left untouched so manual recovery stays possible.
      setHistory({});
      setLastBackupState(getLastBackupAt());
      setReady(true);
      return;
    }

    let next = normalizeHistory(loaded);
    let mutated = false;

    // One-time migration of legacy single-day `nt-data` into the map.
    const legacy = safeGet(LEGACY_DATA_KEY);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy) as DayData;
        const date = parsed.date || todayString();
        if (!next[date]) {
          next = { ...next, [date]: normalizeDay(parsed, date) };
          mutated = true;
        }
      } catch {
        /* ignore malformed legacy data */
      }
      safeRemove(LEGACY_DATA_KEY);
    }

    setHistory(next);
    setLastBackupState(getLastBackupAt());

    // Only write back when we actually changed something (migration) or when we
    // recovered from the mirror and need to restore primary+mirror redundancy.
    if (mutated || needsHeal) {
      saveHistorySafe(next);
    }

    setReady(true);
  }, []);

  const today = todayString();
  const data: DayData = history[today] ?? emptyDay(today);

  const commit = useCallback((updater: (day: DayData) => DayData) => {
    setHistory(prev => {
      const date = todayString();
      const current = prev[date] ?? emptyDay(date);
      const next: History = { ...prev, [date]: updater(current) };
      saveHistorySafe(next);
      return next;
    });
  }, []);

  const addFood = useCallback((calories: number, protein: number, carbs: number, description: string) => {
    commit(day => ({
      ...day,
      calories: day.calories + calories,
      protein: day.protein + protein,
      carbs: day.carbs + carbs,
      log: [
        { id: Date.now().toString(), description, calories, protein, carbs, timestamp: Date.now() },
        ...day.log,
      ],
    }));
  }, [commit]);

  /**
   * Remove a single logged entry (e.g. one added by accident) and subtract its
   * macros from the day's running totals. Totals are floored at 0 so a stale or
   * out-of-sync entry can never push a total negative.
   */
  const removeFood = useCallback((id: string) => {
    commit(day => {
      const entry = day.log.find(e => e.id === id);
      if (!entry) return day;
      return {
        ...day,
        calories: Math.max(0, day.calories - entry.calories),
        protein: Math.max(0, day.protein - entry.protein),
        carbs: Math.max(0, day.carbs - entry.carbs),
        log: day.log.filter(e => e.id !== id),
      };
    });
  }, [commit]);

  // Manual adjust applies a signed delta to a running total (e.g. +20, -50)
  // rather than overwriting it. Totals are floored at 0.
  const adjustCalories = useCallback((delta: number) => {
    commit(day => ({ ...day, calories: Math.max(0, day.calories + delta) }));
  }, [commit]);

  const adjustProtein = useCallback((delta: number) => {
    commit(day => ({ ...day, protein: Math.max(0, day.protein + delta) }));
  }, [commit]);

  const adjustCarbs = useCallback((delta: number) => {
    commit(day => ({ ...day, carbs: Math.max(0, day.carbs + delta) }));
  }, [commit]);

  // Reset clears only today; prior days in history are preserved.
  const reset = useCallback(() => {
    commit(() => emptyDay());
  }, [commit]);

  /**
   * Keep today in the long-term log. Today is already auto-saved under its date
   * key, so this is a no-op for storage — it exists for an explicit, readable
   * call site at the "Save to log" choice.
   */
  const keepDay = useCallback(() => {
    /* already persisted by commit() on every edit */
  }, []);

  /**
   * Discard today entirely: remove its record from history so it does not count
   * toward stats/averages/streak, and the board returns to 0. Prior days are
   * untouched. If today has no record yet, this is a harmless no-op.
   */
  const discardDay = useCallback(() => {
    setHistory(prev => {
      const date = todayString();
      if (!(date in prev)) return prev;
      const next: History = { ...prev };
      delete next[date];
      saveHistorySafe(next);
      return next;
    });
  }, []);

  const updateGoals = useCallback((g: Goals) => {
    setGoals(g);
    saveGoalsSafe(g);
  }, []);

  const addCustomFood = useCallback((food: Omit<CustomFood, 'id'>) => {
    setCustomFoods(prev => {
      const next = [...prev, { ...food, id: Date.now().toString() }];
      saveCustomFoodsSafe(next);
      return next;
    });
  }, []);

  const removeCustomFood = useCallback((id: string) => {
    setCustomFoods(prev => {
      const next = prev.filter(f => f.id !== id);
      saveCustomFoodsSafe(next);
      return next;
    });
  }, []);

  /** Download a full JSON backup (history + goals + custom foods) to the device. */
  const exportData = useCallback(() => {
    const now = Date.now();
    const payload = serializeExport(history, goals, customFoods, new Date(now).toISOString());
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calorie-tracker-backup-${stamp()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke on the next tick so the download has a chance to start.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setLastBackupAt(now);
    setLastBackupState(now);
  }, [history, goals, customFoods]);

  /**
   * Import a backup file and LOSSLESSLY merge it into the current data. Never
   * overwrites newer local days with older imported ones. Snapshots the
   * pre-import state so the merge can be undone.
   */
  const importData = useCallback(async (file: File): Promise<ImportResult> => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      return { ok: false, error: 'Could not read that file.' };
    }

    let parsed: { history: History; goals: Goals | null; customFoods: CustomFood[] | null };
    try {
      parsed = parseImport(text);
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Invalid backup file.' };
    }

    const imported = normalizeHistory(parsed.history);

    const result = await new Promise<ImportResult>(resolve => {
      setHistory(prev => {
        // Snapshot current state so the import can be undone.
        try {
          window.localStorage.setItem(PREIMPORT_KEY, JSON.stringify(prev));
        } catch {
          /* non-fatal */
        }
        const { merged, summary } = mergeImport(prev, imported);
        saveHistorySafe(merged);
        resolve({ ok: true, summary });
        return merged;
      });
    });

    // Goals only fill in if they look valid; never clobber with junk.
    if (parsed.goals && typeof parsed.goals.calories === 'number') {
      setGoals(parsed.goals);
      saveGoalsSafe(parsed.goals);
    }

    // Custom foods union (existing entries win on id conflict).
    if (parsed.customFoods) {
      setCustomFoods(prev => {
        const next = mergeCustomFoods(prev, parsed.customFoods as CustomFood[]);
        saveCustomFoodsSafe(next);
        return next;
      });
    }

    return result;
  }, []);

  /** Roll back the most recent import using the pre-import snapshot. */
  const undoImport = useCallback((): boolean => {
    const snap = safeGet(PREIMPORT_KEY);
    if (!snap) return false;
    try {
      const restored = normalizeHistory(JSON.parse(snap) as History);
      setHistory(restored);
      saveHistorySafe(restored);
      safeRemove(PREIMPORT_KEY);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    data,
    history,
    goals,
    customFoods,
    ready,
    lastBackupAt,
    addFood,
    adjustCalories,
    adjustProtein,
    adjustCarbs,
    removeFood,
    reset,
    keepDay,
    discardDay,
    updateGoals,
    addCustomFood,
    removeCustomFood,
    exportData,
    importData,
    undoImport,
  };
}
