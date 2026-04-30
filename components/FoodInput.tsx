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
  const [flash, setFlash] = useState<{ calories: number; protein: number; description: string } | null>(null);
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

      // Clear flash after 4s
      setTimeout(() => setFlash(null), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-4 space-y-3">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Log Food with AI</h2>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) analyze(); }}
        placeholder="e.g. 2 scrambled eggs, cup of oats, protein shake..."
        rows={3}
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
      />

      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap gap-x-3 gap-y-1 text-xs p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20"
          >
            <span className="text-purple-300 font-medium truncate flex-1">{flash.description}</span>
            <span className="text-amber-400 font-semibold shrink-0">+{flash.calories} kcal</span>
            <span className="text-emerald-400 font-semibold shrink-0">+{flash.protein}g protein</span>
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
          bg-gradient-to-r from-purple-600 to-purple-700
          hover:from-purple-500 hover:to-purple-600
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
