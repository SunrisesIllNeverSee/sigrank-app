/**
 * lib/data/sort-value.ts — extracted from fallback.ts so client components
 * can import sortValue without pulling in 60KB of mock data + cold store.
 *
 * Pure function: maps a LeaderboardRow + sort key to a numeric sort value.
 * Shared by the server (fallback path) and the client (hall board sorting).
 */

import type { LeaderboardRow } from "@/lib/data/types";

export function sortValue(row: LeaderboardRow, key: string): number {
  const s = row.snapshot;
  const c = s.cascade;
  const t = row.telemetry;
  switch (key) {
    // ── Raw token pillars (T.xx) — sort straight off telemetry. ──
    case "input":
      return t.fresh_input;
    case "output":
      return t.output;
    case "cacheRead":
      return t.cache_read;
    case "cacheWrite":
      return t.cache_create;
    case "totalTokens":
    case "total":
      return t.fresh_input + t.output + t.cache_read + t.cache_create;
    case "yield_":
    case "yield":
      // Non-compounding operators sort below compounding ones (yield treated as 0)
      return c && !c.nonCompounding ? c.yield_ : -1;
    case "leverage":
      return c && !c.nonCompounding ? c.leverage : -1;
    case "opRatio":
      // Op Ratio = leverage:1:velocity → its magnitude is the lead term (leverage).
      // Sort on leverage so the ratio ranks honestly; non-compounding sort last.
      return c && !c.nonCompounding ? c.leverage : -1;
    case "opBest":
    case "opCache":
      // Best overall / best cache op ratio — both rank on the leverage (cache) term.
      // Non-compounding operators sort last.
      return c && !c.nonCompounding ? c.leverage : -1;
    case "opOutput":
      // Best output op ratio — ranks on the velocity (output) term.
      return c ? c.velocity : -1;
    case "snr":
      return c ? c.snr : s.compression_ratio;
    case "dev10x":
      return c && !c.nonCompounding && c.dev10x !== null ? c.dev10x : -999;
    case "velocity":
      return c ? c.velocity : -1;
    case "scaleV":
      return c ? c.scaleV : -1;
    case "efficiency":
      return c ? c.efficiency : -1;
    case "costPerMillion":
      // Lower $/1M is better → negate so the cheapest sorts to the TOP (desc order).
      return c ? -c.costPerMillion : -Infinity;
    case "compression_ratio":
      return s.compression_ratio;
    case "prompt_complexity":
      return s.prompt_complexity.value;
    case "cross_thread":
      return s.cross_thread;
    case "session_depth":
      return s.session_depth;
    case "token_throughput":
      return s.token_throughput;
    case "message_volume":
      return s.token_throughput;
    case "signal_force":
      return s.signal_force;
    case "signa_rate":
    default:
      return s.signa_rate;
  }
}
