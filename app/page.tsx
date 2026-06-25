'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNutrition } from '@/hooks/useNutrition';
import NutrientProgress from '@/components/NutrientProgress';
import NutrientSlider from '@/components/NutrientSlider';
import FoodInput from '@/components/FoodInput';
import FoodSearch from '@/components/FoodSearch';
import BarcodeScanner from '@/components/BarcodeScanner';
import FoodLog from '@/components/FoodLog';
import GoalSettings from '@/components/GoalSettings';
import HistoryView from '@/components/HistoryView';
import BottomNav, { type Tab } from '@/components/BottomNav';

export default function Home() {
  const { data, history, goals, ready, addFood, setCalories, setProtein, setCarbs, reset, updateGoals } = useNutrition();
  const [tab, setTab] = useState<Tab>('today');
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  function handleReset() {
    if (confirmReset) {
      reset();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  const title =
    tab === 'today' ? "Aryan's Calorie Tracker" : tab === 'add' ? 'Add Food' : 'History';
  const subtitle = tab === 'history' ? 'Your progress over time' : dateLabel;

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="relative max-w-sm mx-auto px-4 pt-12 pb-28">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            <p className="text-zinc-500 text-xs mt-0.5">{subtitle}</p>
          </div>
          {tab === 'today' && (
            <button
              onClick={() => { setShowSettings(v => !v); setConfirmReset(false); }}
              aria-label="Settings"
              className="mt-0.5 w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-colors active:scale-95 text-zinc-400 text-base"
            >
              ⚙
            </button>
          )}
        </div>

        {/* TODAY */}
        {tab === 'today' && (
          <>
            <AnimatePresence>
              {showSettings && (
                <GoalSettings
                  goals={goals}
                  onUpdate={updateGoals}
                  onClose={() => setShowSettings(false)}
                />
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="col-span-2">
                <NutrientProgress label="Calories" current={data.calories} goal={goals.calories} unit="kcal" color="amber" />
              </div>
              <NutrientProgress label="Protein" current={data.protein} goal={goals.protein} unit="g" color="emerald" />
              <NutrientProgress label="Carbs" current={data.carbs} goal={goals.carbs} unit="g" color="violet" />
            </div>

            <div className="card mb-5 space-y-6">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Manual Adjust</h2>
              <NutrientSlider label="Calories" value={data.calories} max={goals.calories * 1.5} unit="kcal" color="amber" onChange={setCalories} />
              <NutrientSlider label="Protein" value={data.protein} max={goals.protein * 2} unit="g" color="emerald" onChange={setProtein} />
              <NutrientSlider label="Carbs" value={data.carbs} max={goals.carbs * 2} unit="g" color="violet" onChange={setCarbs} />
            </div>

            <FoodLog entries={data.log} />

            <motion.button
              onClick={handleReset}
              whileTap={{ scale: 0.97 }}
              className={`w-full mt-5 py-3.5 rounded-2xl border text-sm font-medium transition-all duration-300
                ${confirmReset
                  ? 'bg-red-500/15 border-red-500/40 text-red-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                }`}
            >
              {confirmReset ? 'Tap again to confirm reset' : 'Reset Day'}
            </motion.button>
          </>
        )}

        {/* ADD FOOD */}
        {tab === 'add' && (
          <>
            <FoodInput onAdd={addFood} />
            <FoodSearch onAdd={addFood} />
            <BarcodeScanner onAdd={addFood} />
            <FoodLog entries={data.log} />
          </>
        )}

        {/* HISTORY */}
        {tab === 'history' && <HistoryView history={history} goals={goals} />}
      </div>

      <BottomNav active={tab} onChange={(t) => { setTab(t); setShowSettings(false); }} />
    </main>
  );
}
