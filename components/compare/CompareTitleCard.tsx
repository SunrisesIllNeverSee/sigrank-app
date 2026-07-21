/**
 * CompareTitleCard — the head-to-head hero (owner spec 2026-06-19: "a title card
 * so both users and stats are all together, focus on charts/metrics/data — a great
 * place for more narrative").
 *
 * Server component, purely additive (sits ABOVE CompareTable; no edits to it).
 * Combines: both operators (name · class · rank · Υ), a deterministic narrative
 * line ("who this matchup favours and why"), and a compact per-axis lead strip
 * across the six cascade metrics. All derived from the same rows — no fetch.
 */

import type { LeaderboardRow } from "@/lib/board";

// canon superscripts reference the Y.xx token cascade (CANON.md §I-b / lib/canon/ids.ts).
interface Axis {
  key: string;
  label: string;
  canon: string;
  a: number;
  b: number;
  fmt: (n: number) => string;
}

/** Build the six cascade axes for A vs B (0 when non-compounding / absent). */
function axesFor(a: LeaderboardRow, b: LeaderboardRow): Axis[] {
  const ca = a.snapshot.cascade;
  const cb = b.snapshot.cascade;
  const comp = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c && !c.nonCompounding ? pick(c) : 0;
  const raw = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c ? pick(c) : 0;
  const k = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(n >= 100 ? 0 : 2);
  return [
    {
      key: "yield",
      label: "Υ Yield",
      canon: "Y.01",
      a: comp(ca, (x) => x.yield_),
      b: comp(cb, (x) => x.yield_),
      fmt: k,
    },
    {
      key: "snr",
      label: "SNR",
      canon: "Y.02",
      a: raw(ca, (x) => x.snr),
      b: raw(cb, (x) => x.snr),
      fmt: (n) => n.toFixed(3),
    },
    {
      key: "lev",
      label: "Leverage",
      canon: "Y.03",
      a: comp(ca, (x) => x.leverage),
      b: comp(cb, (x) => x.leverage),
      fmt: (n) => `${k(n)}×`,
    },
    {
      key: "vel",
      label: "Velocity",
      canon: "Y.04",
      a: raw(ca, (x) => x.velocity),
      b: raw(cb, (x) => x.velocity),
      fmt: (n) => n.toFixed(2),
    },
    {
      key: "dev",
      label: "10xDEV",
      canon: "Y.05",
      a: comp(ca, (x) => x.dev10x ?? 0),
      b: comp(cb, (x) => x.dev10x ?? 0),
      fmt: (n) => n.toFixed(2),
    },
    // cost: lower is better — handled in the lead logic below.
    {
      key: "cost",
      label: "$/1M",
      canon: "Y.07",
      a: raw(ca, (x) => x.costPerMillion),
      b: raw(cb, (x) => x.costPerMillion),
      fmt: (n) => `$${n.toFixed(2)}`,
    },
  ];
}

export function CompareTitleCard({
  a,
  b,
}: {
  a: LeaderboardRow;
  b: LeaderboardRow;
}) {
  const axes = axesFor(a, b);
  const lowerIsBetter = new Set(["cost"]);
  const leads = (ax: Axis): "a" | "b" | "tie" => {
    if (ax.a === ax.b) return "tie";
    const aWins = lowerIsBetter.has(ax.key) ? ax.a < ax.b : ax.a > ax.b;
    return aWins ? "a" : "b";
  };
  // CMP-1/CMP-6: one relative-gap measure (0..1), reused for the 5-highlight
  // ranking and the per-axis heat opacity.
  // TODO(CMP-6): tune the heat curve (currently linear 0.15→1.0 of gap).
  const gapOf = (ax: Axis) =>
    Math.abs(ax.a - ax.b) / (Math.max(Math.abs(ax.a), Math.abs(ax.b)) || 1);
  const ranked = [...axes]
    .filter((ax) => leads(ax) !== "tie")
    .sort((x, y) => gapOf(y) - gapOf(x));
  const highlights = ranked.slice(0, 5); // CMP-1: the 5 biggest differentiators

  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border border-bg-border bg-bg-surface p-5">
      {/* The matchup poster (head + VS + verdict + win-tally) now lives in
          <CompareVersus/> above this card (CMP-SPECIAL). This card keeps the
          analytical layer: the 5-highlights and the per-axis lead strip.
          Owner 2026-06-24: content centered (max-w + mx-auto) to kill the right-side
          dead space the old left-aligned layout left behind. */}

      {/* CMP-1: 5 Highlights — the biggest differentiators, ranked by relative gap */}
      {highlights.length > 0 && (
        <div className="flex w-full max-w-md flex-col gap-2">
          <div className="text-center font-mono text-[10px] uppercase tracking-widest text-text-muted">
            5 Highlights
          </div>
          <div className="flex flex-col gap-1.5">
            {highlights.map((ax) => {
              const w = leads(ax);
              const pct = Math.round(gapOf(ax) * 100);
              return (
                <div
                  key={ax.key}
                  className="flex items-center gap-3 font-mono text-[11px]"
                >
                  <span className="w-24 shrink-0 text-text-secondary">
                    {ax.label}
                    <sup className="ml-0.5 text-[8px] text-text-dim">
                      {ax.canon}
                    </sup>
                  </span>
                  <span
                    className={`shrink-0 tabular-nums ${w === "a" ? "font-bold text-gold" : "text-text-dim"}`}
                  >
                    {ax.fmt(ax.a)}
                  </span>
                  <span className="shrink-0 text-gold">
                    {w === "a" ? "◀" : "▶"}
                  </span>
                  <span
                    className={`shrink-0 tabular-nums ${w === "b" ? "font-bold text-gold" : "text-text-dim"}`}
                  >
                    {ax.fmt(ax.b)}
                  </span>
                  <span className="ml-auto text-text-muted">+{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-axis lead strip — compact visual story across the six metrics */}
      <div className="grid w-full max-w-xl grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {axes.map((ax) => {
          const w = leads(ax);
          return (
            <div key={ax.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-text-muted">
                <span>
                  {ax.label}
                  <sup className="ml-0.5 text-[8px] text-text-dim">
                    {ax.canon}
                  </sup>
                </span>
                <span className={w === "tie" ? "text-text-dim" : "text-gold"}>
                  {w === "tie" ? "tie" : w === "a" ? "◀" : "▶"}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span
                  className={
                    w === "a" ? "font-bold text-text-primary" : "text-text-dim"
                  }
                >
                  {ax.fmt(ax.a)}
                </span>
                <span
                  className={
                    w === "b" ? "font-bold text-text-primary" : "text-text-dim"
                  }
                >
                  {ax.fmt(ax.b)}
                </span>
              </div>
              {/* CMP-6: heat underline — opacity ∝ relative gap (tie = none) */}
              <div className="h-0.5 w-full overflow-hidden rounded-full bg-bg-border">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{
                    opacity:
                      w === "tie" ? 0 : Math.min(1, 0.15 + gapOf(ax) * 0.85),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
