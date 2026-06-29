'use client';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { ImportResult } from '@/hooks/useNutrition';

interface Props {
  lastBackupAt: number | null;
  onExport: () => void;
  onImport: (file: File) => Promise<ImportResult>;
  onUndoImport: () => boolean;
}

function timeAgo(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function DataBackup({ lastBackupAt, onExport, onImport, onUndoImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file later.
    e.target.value = '';
    if (!file) return;

    setBusy(true);
    setMsg(null);
    const result = await onImport(file);
    setBusy(false);

    if (result.ok && result.summary) {
      const { added, kept } = result.summary;
      setMsg({
        kind: 'ok',
        text: `Restored ${added} day${added === 1 ? '' : 's'}${kept ? `, kept ${kept} newer` : ''}.`,
      });
      setCanUndo(true);
    } else {
      setMsg({ kind: 'err', text: result.error ?? 'Import failed.' });
    }
  }

  function handleUndo() {
    if (onUndoImport()) {
      setMsg({ kind: 'ok', text: 'Import undone.' });
      setCanUndo(false);
    } else {
      setMsg({ kind: 'err', text: 'Nothing to undo.' });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="card mb-5 border border-zinc-800 space-y-3"
    >
      <div>
        <h2 className="text-sm font-semibold text-white">Backup &amp; Restore</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Your data lives only on this device. Export a backup file so you never lose it.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onExport}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors active:scale-[0.98]"
        >
          Export backup
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? 'Importing…' : 'Import backup'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      <p className="text-[11px] text-zinc-600">
        {lastBackupAt ? `Last backup: ${timeAgo(lastBackupAt)}` : 'No backup exported yet.'}
      </p>

      {msg && (
        <div
          className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs ${
            msg.kind === 'ok'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}
        >
          <span className="min-w-0 flex-1">{msg.text}</span>
          {canUndo && (
            <button
              onClick={handleUndo}
              className="shrink-0 underline underline-offset-2 hover:no-underline font-medium"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
