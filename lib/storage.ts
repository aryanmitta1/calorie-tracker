import type { DayData, History, Goals, CustomFood } from '@/hooks/useNutrition';

/**
 * Safe storage layer. Every read/write to localStorage goes through here so a
 * single corrupt read or a quota error can never silently destroy the user's
 * history. The history is always written to TWO keys (primary + mirror) so a
 * torn/partial write to one can be recovered from the other.
 */

export const HISTORY_KEY = 'nt-history';
export const HISTORY_MIRROR_KEY = 'nt-history-bak';
export const LEGACY_DATA_KEY = 'nt-data';
export const GOALS_KEY = 'nt-goals';
export const CUSTOM_FOODS_KEY = 'nt-custom-foods';
export const PREIMPORT_KEY = 'nt-history-preimport';
export const LAST_BACKUP_KEY = 'nt-last-backup';

const CORRUPT_PREFIX = 'nt-history-corrupt-';

export const EXPORT_APP = 'calorie-tracker';
export const EXPORT_VERSION = 1 as const;

export interface ExportPayload {
  app: string;
  version: number;
  exportedAt: string;
  history: History;
  goals: Goals;
  customFoods: CustomFood[];
}

export interface MergeSummary {
  /** Days present in the import but not locally — newly restored. */
  added: number;
  /** Days where the local record was kept over the imported one. */
  kept: number;
  /** Total days after merge. */
  total: number;
}

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

/** Read a key, never throwing. Returns null if missing or storage is unavailable. */
export function safeGet(key: string): string | null {
  if (!hasLocalStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Write a key, never throwing. Returns true on success, false on failure
 * (e.g. QuotaExceededError or storage disabled) so callers can react instead
 * of crashing the app mid-update.
 */
export function safeSet(key: string, value: string): boolean {
  if (!hasLocalStorage()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Remove a key, never throwing. */
export function safeRemove(key: string): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Quarantine a raw string we failed to parse under a timestamped key so it is
 * never thrown away — the user (or a future fix) can still recover from it.
 * Timestamp is passed in because Date.now() is not always available to callers
 * during SSR; falls back to a counter-free static suffix if not provided.
 */
function quarantine(raw: string, stamp: string): void {
  safeSet(`${CORRUPT_PREFIX}${stamp}`, raw);
}

function parseHistory(raw: string): History {
  const parsed = JSON.parse(raw) as History;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('history is not an object');
  }
  return parsed;
}

export interface LoadResult {
  /**
   * Best recovered history. `{}` means a genuinely fresh install (no keys at
   * all). `null` means storage HAD content but every copy was corrupt and
   * unrecoverable — the caller MUST NOT write over storage in that case.
   */
  history: History | null;
  /**
   * True when good data was recovered from the mirror (primary was missing or
   * corrupt). The caller should rewrite both keys to restore redundancy. This
   * is always safe because `history` holds real recovered data.
   */
  needsHeal: boolean;
}

/**
 * Load the raw history map defensively. The caller (useNutrition) is
 * responsible for normalizing day shapes and running the legacy migration.
 *
 * CRITICAL: on a parse failure we NEVER return an empty history that could then
 * be written back over good data. We try the mirror, and if every copy is bad
 * we quarantine the raw bytes and return null so the caller leaves storage
 * untouched rather than overwriting it. This is the core protection against the
 * original "corrupt read → silent total wipe" bug.
 */
export function loadHistoryRaw(stamp: string): LoadResult {
  const primary = safeGet(HISTORY_KEY);
  const mirror = safeGet(HISTORY_MIRROR_KEY);

  // Prefer the primary key.
  if (primary != null) {
    try {
      return { history: parseHistory(primary), needsHeal: false };
    } catch {
      // Primary is corrupt — preserve the raw bytes before falling back.
      quarantine(primary, stamp);
    }
  }

  // Primary missing or corrupt — recover from the mirror if we can.
  if (mirror != null) {
    try {
      return { history: parseHistory(mirror), needsHeal: true };
    } catch {
      quarantine(mirror, `${stamp}-bak`);
    }
  }

  // Both keys absent → genuinely fresh install (safe to treat as empty).
  if (primary == null && mirror == null) {
    return { history: {}, needsHeal: false };
  }

  // Content existed but nothing parsed: unrecoverable. Return null so the
  // caller does NOT clobber the (now quarantined) corrupt data with an empty map.
  return { history: null, needsHeal: false };
}

/**
 * Persist the history to BOTH the primary and mirror keys. Returns true only
 * if the primary write succeeded (the mirror is best-effort redundancy).
 */
export function saveHistorySafe(history: History): boolean {
  const serialized = JSON.stringify(history);
  const ok = safeSet(HISTORY_KEY, serialized);
  // Mirror write is best-effort; never let its failure mask a good primary.
  safeSet(HISTORY_MIRROR_KEY, serialized);
  return ok;
}

export function loadGoalsRaw(): Goals | null {
  const raw = safeGet(GOALS_KEY);
  if (raw == null) return null;
  try {
    const parsed = JSON.parse(raw) as Goals;
    if (typeof parsed?.calories === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveGoalsSafe(goals: Goals): boolean {
  return safeSet(GOALS_KEY, JSON.stringify(goals));
}

export function loadCustomFoodsRaw(): CustomFood[] | null {
  const raw = safeGet(CUSTOM_FOODS_KEY);
  if (raw == null) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomFood[]) : null;
  } catch {
    return null;
  }
}

export function saveCustomFoodsSafe(foods: CustomFood[]): boolean {
  return safeSet(CUSTOM_FOODS_KEY, JSON.stringify(foods));
}

export function getLastBackupAt(): number | null {
  const raw = safeGet(LAST_BACKUP_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function setLastBackupAt(ts: number): void {
  safeSet(LAST_BACKUP_KEY, String(ts));
}

/** Build the export payload object that gets serialized to a download. */
export function serializeExport(
  history: History,
  goals: Goals,
  customFoods: CustomFood[],
  exportedAt: string,
): ExportPayload {
  return { app: EXPORT_APP, version: EXPORT_VERSION, exportedAt, history, goals, customFoods };
}

/** Union two custom-food lists by id, preferring existing entries on conflict. */
export function mergeCustomFoods(current: CustomFood[], imported: CustomFood[]): CustomFood[] {
  const byId = new Map<string, CustomFood>();
  for (const f of imported) if (f && f.id) byId.set(f.id, f);
  for (const f of current) if (f && f.id) byId.set(f.id, f); // current wins
  return Array.from(byId.values());
}

/** A day with more logged entries is "richer"; ties break toward more calories. */
function isRicher(a: DayData | undefined, b: DayData | undefined): boolean {
  if (!a) return false;
  if (!b) return true;
  const al = a.log?.length ?? 0;
  const bl = b.log?.length ?? 0;
  if (al !== bl) return al > bl;
  return (a.calories ?? 0) >= (b.calories ?? 0);
}

/**
 * Lossless union of imported history into the current history, keyed by date.
 *
 * - Dates only in the import are added.
 * - On a date conflict, the RICHER record wins (more log entries, then higher
 *   calories). This guarantees that importing an older/partial backup can never
 *   wipe out newer days that are already on the device.
 */
export function mergeImport(current: History, imported: History): { merged: History; summary: MergeSummary } {
  const merged: History = { ...current };
  let added = 0;
  let kept = 0;

  for (const [date, day] of Object.entries(imported)) {
    const existing = merged[date];
    if (!existing) {
      merged[date] = day;
      added++;
    } else if (isRicher(day, existing)) {
      merged[date] = day;
    } else {
      kept++;
    }
  }

  return { merged, summary: { added, kept, total: Object.keys(merged).length } };
}

/**
 * Validate a parsed import payload. Accepts the versioned wrapper produced by
 * serializeExport, and is lenient enough to accept a bare history map (so a
 * hand-edited or older export still restores).
 */
export function parseImport(text: string): {
  history: History;
  goals: Goals | null;
  customFoods: CustomFood[] | null;
} {
  const parsed = JSON.parse(text);

  // Versioned wrapper.
  if (parsed && typeof parsed === 'object' && parsed.history && typeof parsed.history === 'object') {
    if (parsed.app && parsed.app !== EXPORT_APP) {
      throw new Error('This file is not a calorie-tracker backup.');
    }
    return {
      history: parsed.history as History,
      goals: (parsed.goals as Goals) ?? null,
      customFoods: Array.isArray(parsed.customFoods) ? (parsed.customFoods as CustomFood[]) : null,
    };
  }

  // Bare history map fallback: object of date -> day.
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return { history: parsed as History, goals: null, customFoods: null };
  }

  throw new Error('Unrecognized backup format.');
}
