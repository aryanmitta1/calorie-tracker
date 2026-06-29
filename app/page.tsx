'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNutrition } from '@/hooks/useNutrition';
import NutrientProgress from '@/components/NutrientProgress';
import NutrientInput from '@/components/NutrientInput';
import FoodInput from '@/components/FoodInput';
import FoodSearch from '@/components/FoodSearch';
import CustomFoods from '@/components/CustomFoods';
import BarcodeScanner from '@/components/BarcodeScanner';
import FoodLog from '@/components/FoodLog';
import GoalSettings from '@/components/GoalSettings';
import DataBackup from '@/components/DataBackup';
import InstallBanner from '@/components/InstallBanner';
import HistoryView from '@/components/HistoryView';
import ResetDayDialog from '@/components/ResetDayDialog';
import BottomNav, { type Tab } from '@/components/BottomNav';

export default function Home() {
  const { data, history, goals, customFoods, ready, lastBackupAt, addFood, setCalories, setProtein, setCarbs, keepDay, discardDay, updateGoals, addCustomFood, removeCustomFood, exportData, importData, undoImport } = useNutrition();
  const [tab, setTab] = useState<Tab>('today');
  const [showSettings, setShowSettings] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

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
              onClick={() => { setShowSettings(v => !v); }}
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
              {showSettings && (
                <DataBackup
                  lastBackupAt={lastBackupAt}
                  onExport={exportData}
                  onImport={importData}
                  onUndoImport={undoImport}
                />
              )}
            </AnimatePresence>

            <InstallBanner lastBackupAt={lastBackupAt} onBackupNow={exportData} />

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="col-span-2">
                <NutrientProgress label="Calories" current={data.calories} goal={goals.calories} unit="kcal" color="amber" />
              </div>
              <NutrientProgress label="Protein" current={data.protein} goal={goals.protein} unit="g" color="emerald" />
              <NutrientProgress label="Carbs" current={data.carbs} goal={goals.carbs} unit="g" color="violet" />
            </div>

            <div className="card mb-5 space-y-4">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Manual Adjust</h2>
              <NutrientInput label="Calories" value={data.calories} unit="kcal" color="amber" onChange={setCalories} />
              <NutrientInput label="Protein" value={data.protein} unit="g" color="emerald" onChange={setProtein} />
              <NutrientInput label="Carbs" value={data.carbs} unit="g" color="violet" onChange={setCarbs} />
            </div>

            <FoodLog entries={data.log} />

            <motion.button
              onClick={() => setShowResetDialog(true)}
              whileTap={{ scale: 0.97 }}
              className="w-full mt-5 py-3.5 rounded-2xl border text-sm font-medium transition-all duration-300
                bg-zinc-900 border-zinc-800 text-zinc-600 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
            >
              Reset Day
            </motion.button>
          </>
        )}

        {/* ADD FOOD */}
        {tab === 'add' && (
          <>
            <CustomFoods
              customFoods={customFoods}
              onAdd={addFood}
              onCreate={addCustomFood}
              onRemove={removeCustomFood}
            />
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

      <AnimatePresence>
        {showResetDialog && (
          <ResetDayDialog
            day={data}
            onSave={() => { keepDay(); setShowResetDialog(false); }}
            onDiscard={() => { discardDay(); setShowResetDialog(false); }}
            onCancel={() => setShowResetDialog(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
