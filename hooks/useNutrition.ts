'use client';
import { useState, useEffect, useCallback } from 'react';

export interface FoodEntry {
  id: string;
  description: string;
  calories: number;
  protein: number;
  timestamp: number;
}

interface NutritionData {
  calories: number;
  protein: number;
  log: FoodEntry[];
  date: string;
}

export interface Goals {
  calories: number;
  protein: number;
}

const DEFAULT_GOALS: Goals = { calories: 2000, protein: 150 };

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function emptyDay(): NutritionData {
  return { calories: 0, protein: 0, log: [], date: todayString() };
}

export function useNutrition() {
  const [data, setData] = useState<NutritionData>(emptyDay());
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedGoals = localStorage.getItem('nt-goals');
    if (storedGoals) setGoals(JSON.parse(storedGoals));

    const stored = localStorage.getItem('nt-data');
    if (stored) {
      const parsed: NutritionData = JSON.parse(stored);
      // Auto-reset if it's a new day
      if (parsed.date !== todayString()) {
        localStorage.setItem('nt-data', JSON.stringify(emptyDay()));
      } else {
        setData(parsed);
      }
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: NutritionData) => {
    setData(next);
    localStorage.setItem('nt-data', JSON.stringify(next));
  }, []);

  const addFood = useCallback((calories: number, protein: number, description: string) => {
    setData(prev => {
      const next: NutritionData = {
        ...prev,
        calories: prev.calories + calories,
        protein: prev.protein + protein,
        log: [
          { id: Date.now().toString(), description, calories, protein, timestamp: Date.now() },
          ...prev.log,
        ],
      };
      localStorage.setItem('nt-data', JSON.stringify(next));
      return next;
    });
  }, []);

  const setCalories = useCallback((calories: number) => {
    setData(prev => {
      const next = { ...prev, calories: Math.max(0, calories) };
      localStorage.setItem('nt-data', JSON.stringify(next));
      return next;
    });
  }, []);

  const setProtein = useCallback((protein: number) => {
    setData(prev => {
      const next = { ...prev, protein: Math.max(0, protein) };
      localStorage.setItem('nt-data', JSON.stringify(next));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = emptyDay();
    setData(fresh);
    localStorage.setItem('nt-data', JSON.stringify(fresh));
  }, []);

  const updateGoals = useCallback((g: Goals) => {
    setGoals(g);
    localStorage.setItem('nt-goals', JSON.stringify(g));
  }, []);

  return { data, goals, ready, addFood, setCalories, setProtein, reset, updateGoals };
}
