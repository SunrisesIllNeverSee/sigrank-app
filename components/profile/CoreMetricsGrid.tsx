/**
 * components/profile/CoreMetricsGrid.tsx — the operator's metric cards.
 *
 * Server component. Renders the CANONICAL DISPLAY SET (owner 2026-06-22) — two
 * groups in order, RAW (6 pillars) then METRICS (9 cascade) — from one source
 * (lib/canon DISPLAY_RAW / DISPLAY_METRICS) so it matches the leaderboard, wiki,
 * landing, and hall. Values come from the scored snapshot's cascade + telemetry.
 *
 * (Was a word-era Core-5 grid (Compression/PC/CT/SD/TT) — rewired to the token
 * cascade so the profile no longer disagrees with the rest of the site.)
 */

import {
  DISPLAY_RAW,
  DISPLAY_METRICS,
  type DisplayMetric,
} from "@/lib/identity/canon-ids";
import type { ScoredSnapshot } from "@/lib/analytics/scoring-types";
import type { TelemetryRaw } from "@/lib/board/types";

interface Props {
  snapshot: ScoredSnapshot;
  telemetry?: TelemetryRaw | null;
}

const fmtBig = (n: number): string => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
};

/** Resolve a display-set metric to its formatted value off cascade + telemetry.
 * Returns '—' where the value is null/absent (e.g. compounding metrics on a
 * non-compounding operator). One mapping, both groups. */
function valueFor(
  key: string,
  snapshot: ScoredSnapshot,
  t?: TelemetryRaw | null,
): string {
  const c = snapshot.cascade;
  switch (key) {
    // RAW pillars (from telemetry)
    case "input":
      return t ? fmtBig(t.fresh_input) : "—";
    case "output":
      return t ? fmtBig(t.output) : "—";
    case "cacheRead":
      return t ? fmtBig(t.cache_read) : "—";
    case "cacheWrite":
      return t ? fmtBig(t.cache_create) : "—";
    case "totalTokens":
      return t
        ? fmtBig(t.fresh_input + t.output + t.cache_read + t.cache_create)
        : "—";
    // Cascade metrics (derived)
    case "yield_":
      return c && !c.nonCompounding ? fmtBig(c.yield_) : "—";
    case "snr":
      return c ? `${(c.snr * 100).toFixed(1)}%` : "—";
    case "leverage":
      return c && !c.nonCompounding ? `${fmtBig(c.leverage)}×` : "—";
    case "velocity":
      return c ? c.velocity.toFixed(2) : "—";
    case "dev10x":
      return c && !c.nonCompounding && c.dev10x !== null
        ? c.dev10x.toFixed(2)
        : "—";
    case "scaleV":
      return c ? c.scaleV.toFixed(2) : "—";
    case "costPerMillion":
      return c ? `$${c.costPerMillion.toFixed(2)}` : "—";
    case "efficiency":
      return c ? c.efficiency.toFixed(2) : "—";
    case "opRatio":
      return c ? c.opRatio : "—";
    default:
      return "—";
  }
}

function Card({
  m,
  snapshot,
  telemetry,
}: {
  m: DisplayMetric;
  snapshot: ScoredSnapshot;
  telemetry?: TelemetryRaw | null;
}) {
  return (
    <div className="rounded-xl border border-bg-border-subtle bg-bg-surface p-4 transition-colors hover:border-bg-border">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded border border-gold/25 bg-gold/[0.08] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gold">
          {m.ticker}
          <sup className="ml-0.5 text-[8px] text-text-dim">{m.id}</sup>
        </span>
      </div>
      <div className="mb-1.5 text-[12px] font-medium text-text-muted">
        {m.name}
      </div>
      <div className="font-mono text-[26px] font-semibold leading-none tracking-[-0.025em] text-text-primary">
        {valueFor(m.key, snapshot, telemetry)}
      </div>
    </div>
  );
}

export function CoreMetricsGrid({ snapshot, telemetry }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* RAW group (6) */}
      <section className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Raw — the pillars
        </span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {DISPLAY_RAW.map((m) => (
            <Card
              key={m.id + m.key}
              m={m}
              snapshot={snapshot}
              telemetry={telemetry}
            />
          ))}
        </div>
      </section>
      {/* METRICS group (9) */}
      <section className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Metrics — the cascade
        </span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {DISPLAY_METRICS.map((m) => (
            <Card
              key={m.id + m.key}
              m={m}
              snapshot={snapshot}
              telemetry={telemetry}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
