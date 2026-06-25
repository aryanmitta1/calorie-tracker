'use client';
import { useState, useEffect, useCallback } from 'react';

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

const DEFAULT_GOALS: Goals = { calories: 2150, protein: 155, carbs: 250 };
const HISTORY_KEY = 'nt-history';
const LEGACY_DATA_KEY = 'nt-data';
const GOALS_KEY = 'nt-goals';

export function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

/**
 * Load the full history map, performing a one-time migration of the legacy
 * single-day `nt-data` key into the history map keyed by its own date.
 */
function loadHistory(): History {
  let history: History = {};

  const storedHistory = localStorage.getItem(HISTORY_KEY);
  if (storedHistory) {
    try {
      const parsed = JSON.parse(storedHistory) as History;
      for (const [date, day] of Object.entries(parsed)) {
        history[date] = normalizeDay(day, date);
      }
    } catch {
      history = {};
    }
  }

  // Migrate legacy nt-data (pre-history) into the map, then retire the key.
  const legacy = localStorage.getItem(LEGACY_DATA_KEY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy) as DayData;
      const date = parsed.date || todayString();
      if (!history[date]) history[date] = normalizeDay(parsed, date);
    } catch {
      /* ignore malformed legacy data */
    }
    localStorage.removeItem(LEGACY_DATA_KEY);
  }

  return history;
}

export function useNutrition() {
  const [history, setHistory] = useState<History>({});
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedGoals = localStorage.getItem(GOALS_KEY);
    if (storedGoals) {
      try {
        const parsed = JSON.parse(storedGoals);
        // Keep new defaults for pre-carbs goals; otherwise honor stored goals.
        if (typeof parsed.carbs === 'number') setGoals(parsed);
      } catch {
        /* keep defaults */
      }
    }

    const loaded = loadHistory();
    setHistory(loaded);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(loaded));
    setReady(true);
  }, []);

  const today = todayString();
  const data: DayData = history[today] ?? emptyDay(today);

  const commit = useCallback((updater: (day: DayData) => DayData) => {
    setHistory(prev => {
      const date = todayString();
      const current = prev[date] ?? emptyDay(date);
      const next: History = { ...prev, [date]: updater(current) };
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
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

  const setCalories = useCallback((calories: number) => {
    commit(day => ({ ...day, calories: Math.max(0, calories) }));
  }, [commit]);

  const setProtein = useCallback((protein: number) => {
    commit(day => ({ ...day, protein: Math.max(0, protein) }));
  }, [commit]);

  const setCarbs = useCallback((carbs: number) => {
    commit(day => ({ ...day, carbs: Math.max(0, carbs) }));
  }, [commit]);

  // Reset clears only today; prior days in history are preserved.
  const reset = useCallback(() => {
    commit(() => emptyDay());
  }, [commit]);

  const updateGoals = useCallback((g: Goals) => {
    setGoals(g);
    localStorage.setItem(GOALS_KEY, JSON.stringify(g));
  }, []);

  return { data, history, goals, ready, addFood, setCalories, setProtein, setCarbs, reset, updateGoals };
}
