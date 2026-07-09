/**
 * lib/hall/record-value.ts — the single source for a Hall record's DISPLAYED value.
 *
 * One function (recordValue) resolves the string a Hall card shows for a given
 * canonical id, across BOTH record galleries:
 *  - CASCADE records (Y.xx) — derived from row.snapshot.cascade. Compounding
 *    metrics (yield/leverage/10xDEV/op-ratio) read "—" for non-compounding
 *    operators, matching the live board.
 *  - RAW records (T.xx) — the raw token pillars off row.telemetry. ($/1M reuses
 *    canon id Y.07 — the cascade case handles it; no separate T-case for cost.)
 *
 * Ported verbatim from the old per-card metricValue switch in MetricTopTen.tsx so
 * cascade values stay byte-identical; the T.xx raw cases were ADDED on top.
 */

import type { LeaderboardRow } from "@/lib/data";

/** Compact K-suffix for cascade values (yield/leverage). */
const k = (n: number) =>
  n >= 1000
    ? `${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}K`
    : n.toFixed(2);

/** Integer token formatting: B / M / K suffixes, else a comma-grouped integer. */
export function fmtTokens(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return Math.round(n).toLocaleString("en-US");
}

/** Pull the metric's display value off a row for a given canonical metric id.
 * Y.xx reads the token cascade (derived on read); T.xx reads the raw pillars off
 * telemetry. Compounding metrics (yield/leverage/10xDEV) show "—" for
 * non-compounding operators, matching the board. */
export function recordValue(row: LeaderboardRow, canonId: string): string {
  const s = row.snapshot;
  const c = s.cascade;
  const t = row.telemetry;
  switch (canonId) {
    // ── Token cascade (Y.xx) — the LIVE ranking canon ──
    case "Y.01":
      return c && !c.nonCompounding ? k(c.yield_) : "—";
    case "Y.02":
      return c ? c.snr.toFixed(3) : s.compression_ratio.toFixed(3);
    case "Y.03":
      return c && !c.nonCompounding ? `${k(c.leverage)}×` : "—";
    case "Y.04":
      return c ? c.velocity.toFixed(2) : "—";
    case "Y.05":
      return c && !c.nonCompounding && c.dev10x !== null
        ? c.dev10x.toFixed(2)
        : "—";
    case "Y.06":
      return c ? c.scaleV.toFixed(2) : "—";
    case "Y.07":
      return c ? `$${c.costPerMillion.toFixed(2)}` : "—";
    case "Y.08":
      return c ? c.efficiency.toFixed(2) : "—";
    case "Y.09":
      return c && !c.nonCompounding ? c.opRatio : "—";
    // ── Raw token pillars (T.xx) — read straight off telemetry, integer-formatted ──
    case "T.02":
      return fmtTokens(t.fresh_input);
    case "T.01":
      return fmtTokens(t.output);
    case "T.03":
      return fmtTokens(t.cache_read);
    case "T.04":
      return fmtTokens(t.cache_create);
    case "T.05":
      return fmtTokens(
        t.fresh_input + t.output + t.cache_read + t.cache_create,
      );
    // ── Legacy word-era (M/C/E) — kept for any non-Hall caller ──
    case "M.01":
      return s.compression_ratio.toFixed(4);
    case "M.02":
      return s.prompt_complexity.value.toFixed(0);
    case "M.03":
      return s.cross_thread.toFixed(0);
    case "M.04":
      return s.session_depth.toFixed(1);
    case "M.05":
      return s.token_throughput.toLocaleString("en-US");
    case "C.01":
      return s.signa_rate.toFixed(1);
    case "C.02":
      return s.sdot_score == null ? "—" : s.sdot_score.toFixed(1);
    case "C.03":
      return s.sdrm_score == null ? "—" : s.sdrm_score.toFixed(1);
    case "E.01":
      return s.signal_force.toFixed(1);
    case "E.02":
      return s.drift_ratio == null ? "—" : s.drift_ratio.toFixed(1);
    default:
      return s.signa_rate.toFixed(1);
  }
}
