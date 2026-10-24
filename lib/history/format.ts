/**
 * lib/history/format.ts — display helpers for archived values. Values are
 * shown as stored; null renders "—" (never 0).
 */

export function fmtArchived(v: number | null | undefined, key?: string): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const n = v.toLocaleString("en-US", { maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 10 ? 2 : 3 });
  return key === "costPerMillion" ? `$${n}` : n;
}
