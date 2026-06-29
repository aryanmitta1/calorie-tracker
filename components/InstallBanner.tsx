'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const DISMISS_KEY = 'nt-install-dismissed';
const BACKUP_REMINDER_DAYS = 7;

interface Props {
  /** Epoch ms of the last export, or null if never. Drives the stale reminder. */
  lastBackupAt: number | null;
  /** Jump straight to the export action when the user taps the backup reminder. */
  onBackupNow: () => void;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPhone/iPad/iPod, plus iPadOS which reports as Mac but has touch.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS Safari exposes navigator.standalone; others use the display-mode media query.
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const mediaStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  return iosStandalone || mediaStandalone;
}

export default function InstallBanner({ lastBackupAt, onBackupNow }: Props) {
  // 'install' = add-to-home-screen nudge; 'backup' = stale-backup reminder.
  const [mode, setMode] = useState<'install' | 'backup' | null>(null);

  useEffect(() => {
    // Installing to the Home Screen is what stops iOS from evicting storage, so
    // the install nudge takes priority and only shows on iOS in a browser tab.
    if (isIOS() && !isStandalone()) {
      let dismissed = false;
      try {
        dismissed = window.localStorage.getItem(DISMISS_KEY) === '1';
      } catch {
        /* treat as not dismissed */
      }
      if (!dismissed) {
        setMode('install');
        return;
      }
    }

    // Otherwise, if it's been a while since the last backup, gently remind.
    const stale =
      lastBackupAt == null ||
      Date.now() - lastBackupAt > BACKUP_REMINDER_DAYS * 24 * 60 * 60 * 1000;
    if (stale) setMode('backup');
  }, [lastBackupAt]);

  function dismissInstall() {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setMode(null);
  }

  if (!mode) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5"
      >
        {mode === 'install' ? (
          <div className="flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">📲</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Add to your Home Screen</p>
              <p className="text-[11px] text-blue-200/80 mt-0.5 leading-snug">
                Otherwise iOS may delete your data after a week unused. Tap{' '}
                <span className="font-semibold">Share ⬆</span> →{' '}
                <span className="font-semibold">Add to Home Screen</span>.
              </p>
            </div>
            <button
              onClick={dismissInstall}
              aria-label="Dismiss"
              className="shrink-0 text-zinc-400 hover:text-white text-sm px-1"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-lg leading-none">💾</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Back up your data</p>
              <p className="text-[11px] text-blue-200/80 mt-0.5 leading-snug">
                {lastBackupAt ? "It's been over a week since your last backup." : "You haven't backed up yet."}
              </p>
            </div>
            <button
              onClick={() => { onBackupNow(); setMode(null); }}
              className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors active:scale-95"
            >
              Export
            </button>
            <button
              onClick={() => setMode(null)}
              aria-label="Dismiss"
              className="shrink-0 text-zinc-400 hover:text-white text-sm px-1"
            >
              ✕
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
