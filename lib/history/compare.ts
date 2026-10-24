/**
 * lib/history/compare.ts — compare two July 31 rows metric by metric. Uses
 * only archived values; a null on either side is not compared.
 */

import type { HistoricalEntry } from "./types.ts";

export type CompareKey =
  | "totalTokens"
  | "yield_"
  | "snr"
  | "velocity"
  | "leverage"
  | "dev10x"
  | "efficiency"
  | "costPerMillion";

export interface CompareRow {
  key: CompareKey;
  a: number | null;
  b: number | null;
  higher: "a" | "b" | "tie" | null;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function compareEntries(a: HistoricalEntry, b: HistoricalEntry, keys: readonly CompareKey[]): CompareRow[] {
  return keys.map((key) => {
    const av = num(a[key]);
    const bv = num(b[key]);
    const higher = av == null || bv == null ? null : av === bv ? "tie" : av > bv ? "a" : "b";
    return { key, a: av, b: bv, higher };
  });
}
