/**
 * lib/history/format.ts — display helpers for archived values. Values are
 * shown as stored; null renders "—" (never 0). Yield and Leverage follow the
 * July 31 table cells (fmtY / fmtLev) so the panels read the same as the rows.
 */

export function fmtArchived(v: number | null | undefined, key?: string): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (key === "yield_") return v >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : v.toFixed(2);
  if (key === "leverage") return v >= 1000 ? `${(v / 1000).toFixed(1)}K×` : `${v.toFixed(1)}×`;
  const n = v.toLocaleString("en-US", { maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 10 ? 2 : 3 });
  return key === "costPerMillion" ? `$${n}` : n;
}
