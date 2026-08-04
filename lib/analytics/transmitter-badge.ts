import "server-only";

import { RS08_TRANSMITTER_BADGE } from "@/lib/analytics/secret-config";

/**
 * lib/analytics/transmitter-badge.ts — SERVER-ONLY windowed peak badge.
 *
 * TRANSMITTER is NOT a permanent class — it is a temporary peak state that any
 * experience tier can earn. An operator "transmits" when they hit BOTH:
 *   - High frequency: token throughput (total tokens in window) >= freqMin
 *   - High resonance: SIGNA RATE (composite signal quality) >= signaMin
 *
 * The badge is per-window (daily/weekly). It lapses when the operator's
 * frequency or resonance drops below the floor in subsequent windows.
 *
 * This module is pure and null-safe. It does not touch the DB — callers pass
 * in the per-window signa_rate + token_throughput series.
 */

export type TransmitterWindow = "daily" | "weekly";

export interface TransmitterPeak {
  /** Whether the operator cleared both floors in any window. */
  earned: boolean;
  /** The window type that earned the badge (null if not earned). */
  window: TransmitterWindow | null;
  /** Peak SIGNA RATE across all windows (null if no data). */
  peakSigna: number | null;
  /** Peak token throughput across all windows (null if no data). */
  peakFreq: number | null;
  /** Number of windows where the badge was earned. */
  peakCount: number;
}

export interface TransmitterWindowInput {
  /** SIGNA RATE (resonance) for this window. */
  signaRate: number | null;
  /** Token throughput — total tokens in this window (frequency). */
  tokenThroughput: number | null;
}

/**
 * Evaluate the TRANSMITTER peak badge from a series of per-window inputs.
 *
 * @param windows — array of { signaRate, tokenThroughput }, one per window
 * @returns TransmitterPeak — earned, window, peak values, count
 */
export function evaluateTransmitterBadge(
  windows: ReadonlyArray<TransmitterWindowInput>,
): TransmitterPeak {
  const signaMin = RS08_TRANSMITTER_BADGE.signaMin;
  const freqMin = RS08_TRANSMITTER_BADGE.freqMin;
  const window = RS08_TRANSMITTER_BADGE.window as TransmitterWindow;

  let peakSigna: number | null = null;
  let peakFreq: number | null = null;
  let peakCount = 0;

  for (const w of windows) {
    if (w.signaRate === null || !Number.isFinite(w.signaRate)) continue;
    if (w.tokenThroughput === null || !Number.isFinite(w.tokenThroughput)) continue;

    if (peakSigna === null || w.signaRate > peakSigna) peakSigna = w.signaRate;
    if (peakFreq === null || w.tokenThroughput > peakFreq) peakFreq = w.tokenThroughput;

    if (w.signaRate >= signaMin && w.tokenThroughput >= freqMin) {
      peakCount++;
    }
  }

  return {
    earned: peakCount > 0,
    window: peakCount > 0 ? window : null,
    peakSigna,
    peakFreq,
    peakCount,
  };
}

/**
 * Bucket a timestamp into a daily or ISO-week key.
 * Daily: "YYYY-MM-DD"
 * Weekly: "YYYY-Www" (ISO week)
 */
export function windowKey(
  date: Date,
  window: TransmitterWindow,
): string {
  if (window === "daily") {
    return date.toISOString().slice(0, 10);
  }
  // ISO week number
  const tmp = new Date(date);
  tmp.setUTCHours(0, 0, 0, 0);
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}
