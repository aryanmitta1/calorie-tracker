'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onAdd: (calories: number, protein: number, description: string) => void;
}

export default function FoodInput({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState<{
    calories: number; caloriesMin: number; caloriesMax: number;
    protein: number; proteinMin: number; proteinMax: number;
    description: string; blurb: string;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function analyze() {
    const food = text.trim();
    if (!food || loading) return;

    setLoading(true);
    setError('');
    setFlash(null);

    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Analysis failed');
      }

      const result = await res.json();
      onAdd(result.calories, result.protein, result.description);
      setFlash(result);
      setText('');
      textareaRef.current?.focus();

      setTimeout(() => setFlash(null), 7000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-4 space-y-3">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Log Food with AI</h2>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) analyze(); }}
        placeholder="e.g. 2 scrambled eggs, cup of oats, protein shake..."
        rows={3}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
      />

      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 space-y-1.5"
          >
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <span>✓</span>
              <span>Logged to diary</span>
            </div>
            <p className="text-zinc-300 leading-snug">{flash.description}</p>
            <div className="flex gap-3">
              <span className="text-orange-500 font-semibold">
                +{flash.calories} kcal
                <span className="text-orange-500/50 font-normal ml-1">({flash.caloriesMin}–{flash.caloriesMax})</span>
              </span>
              <span className="text-blue-400 font-semibold">
                +{flash.protein}g protein
                <span className="text-blue-400/50 font-normal ml-1">({flash.proteinMin}–{flash.proteinMax}g)</span>
              </span>
            </div>
            {flash.blurb && (
              <p className="text-zinc-500 leading-snug pt-0.5 border-t border-zinc-700">{flash.blurb}</p>
            )}
          </motion.div>
        )}
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2.5"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        onClick={analyze}
        disabled={loading || !text.trim()}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
          bg-blue-600 hover:bg-blue-500
          disabled:opacity-40 disabled:cursor-not-allowed
          active:scale-[0.98]"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing…
          </>
        ) : (
          <>✦ Analyze Food</>
        )}
      </button>
    </div>
  );
}
