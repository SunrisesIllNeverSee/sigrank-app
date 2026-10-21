/**
 * lib/ingest/all-time-guard.ts — all-time totals never shrink (owner 2026-10-21).
 *
 * An all_time upload is whatever the scanner can still see on the submitter's
 * machine. When local logs disappear (cleanup, new machine, reinstall) the next
 * scan reports LESS history, and a blind live-upload UPSERT would shrink the
 * operator's all-time row. This module decides, per (operator, platform), what
 * the all_time board row should hold after a new upload.
 *
 * Rules (no pillar mixing: every row is a real measured state or a sum of them):
 *   - no previous row                     → replace (first all_time upload)
 *   - every pillar ≥ previous             → replace (history grew or held)
 *   - any pillar < previous               → hold (carry the previous row forward)
 *   - 'multi' is the sum of the platforms. When one of the same scan's
 *     platform rows was held, the new multi undercounts it, so multi becomes
 *     the sum of the scan's (guarded) platform rows when that sum covers the
 *     previous multi; otherwise multi is held too.
 *
 * Payloads carry no per-day data, so the newer-than-previous delta of a shrunk
 * scan can't be isolated; a held row stays held until a scan covers it again.
 *
 * Pure + dependency-free so __tests__/ingest/all-time-guard.test.mjs can import it.
 */

export interface Pillars {
  input: number;
  output: number;
  cacheRead: number;
  cacheCreate: number;
}

export type PillarName = keyof Pillars;

const PILLARS: readonly PillarName[] = [
  "input",
  "output",
  "cacheRead",
  "cacheCreate",
];

export type AllTimeDecision =
  | { action: "replace" }
  | { action: "hold"; shrunk: PillarName[] }
  | { action: "platform_sum"; pillars: Pillars; shrunk: PillarName[] };

/** Pillars where `next` is below `previous` (the history shrank there). */
export function shrunkPillars(previous: Pillars, next: Pillars): PillarName[] {
  return PILLARS.filter((k) => next[k] < previous[k]);
}

/** a ≥ b on every pillar. */
export function covers(a: Pillars, b: Pillars): boolean {
  return shrunkPillars(b, a).length === 0;
}

/** Pillar-wise sum (multi = Σ platforms). */
export function sumPillars(rows: readonly Pillars[]): Pillars {
  const out: Pillars = { input: 0, output: 0, cacheRead: 0, cacheCreate: 0 };
  for (const r of rows) for (const k of PILLARS) out[k] += r[k];
  return out;
}

/**
 * decideAllTime — what the all_time row for (operator, platform) holds after
 * this upload.
 *
 * @param previous         the latest existing all_time row for this platform, or null
 * @param scanPlatformSum  multi only: Σ of the operator's per-platform all_time rows
 *                         for the same snapshot_date (after their own guard). Pass it
 *                         only when at least one of those rows was held; otherwise
 *                         null (a raw multi scan drifts slightly from Σ platforms
 *                         because each platform is read at a different moment)
 */
export function decideAllTime(input: {
  platform: string;
  next: Pillars;
  previous: Pillars | null;
  scanPlatformSum?: Pillars | null;
}): AllTimeDecision {
  const { platform, next, previous } = input;
  const shrunk = previous ? shrunkPillars(previous, next) : [];

  if (platform !== "multi") {
    return shrunk.length === 0 ? { action: "replace" } : { action: "hold", shrunk };
  }

  const sum = input.scanPlatformSum ?? null;
  if (sum === null || covers(next, sum)) {
    return shrunk.length === 0 ? { action: "replace" } : { action: "hold", shrunk };
  }
  // The new multi undercounts its own scan's platform rows (one was held).
  const behind = shrunk.length > 0 ? shrunk : shrunkPillars(sum, next);
  if (previous === null || covers(sum, previous)) {
    return { action: "platform_sum", pillars: sum, shrunk: behind };
  }
  return { action: "hold", shrunk: behind };
}
