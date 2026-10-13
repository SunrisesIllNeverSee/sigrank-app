/**
 * lib/compare/facts.ts — CMP-FACTS
 *
 * Derives up to five per-operator "facts" (strengths / weaknesses) for the
 * matchup box, from the operator's cascade + raw telemetry. Each fact is scored
 * by |signal| so the most distinctive traits surface first; the matchup box
 * renders the top five.
 *
 * Two honest fact families, no extra data required:
 *   - ABSOLUTE — true standalone, vs canonical breakpoints ("Cost leader",
 *     "Closed kinetic loop", "Deep reuse"). Reuses regimeOf()'s vocabulary.
 *   - RELATIVE — true only in THIS matchup, vs the opponent ("Out-leverages 3×",
 *     "Slower velocity"). Makes the box a real versus.
 *
 * Pure + deterministic (no fetch, no model) so it runs in a server component and
 * is unit-testable. Polarity: 'up' = strength, 'down' = weakness, 'flat' = neutral.
 *
 * TODO(CMP-FACTS · OPERATOR_OVERRIDE_REQUIRED): the absolute breakpoints below
 * (leverage 100/10, velocity 1.0, cost 2.0, efficiency 2.0) are RS.xx-class
 * tuning constants the owner owns — surface from the ruleset once finalized.
 */

import type { LeaderboardRow } from "@/lib/board";
import { regimeOf } from "@/lib/analytics/compare-narrate";

export type FactPolarity = "up" | "down" | "flat";

export interface OperatorFact {
  /** ✦ strength · △ weakness · · neutral — chosen by polarity at render. */
  polarity: FactPolarity;
  /** Short label, e.g. "Leverage" or "Cost". */
  label: string;
  /** The terse value/claim, e.g. "top reuse · 9×" or "$0.84/1M — cost leader". */
  detail: string;
  /** Ranking weight (|signal|); higher = more distinctive. Internal only. */
  weight: number;
}

// TODO(CMP-FACTS): OPERATOR_OVERRIDE_REQUIRED — proprietary fact breakpoints.
const B = {
  levClosed: 100, // leverage ≥ → "closed loop" reuse
  levDeep: 10, // leverage ≥ → "deep reuse"
  velFast: 1.0, // velocity ≥ → "fast generation"
  velSlow: 0.3, // velocity < → "slow generation"
  costLeader: 2.0, // $/1M ≤ → "cost leader"
  costHeavy: 8.0, // $/1M ≥ → "cost heavy"
  effStrong: 2.0, // efficiency ≥ → "strong efficiency"
};

const fmtK = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(0);
const fmtLev = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(1)}K×` : `${v.toFixed(0)}×`;

/**
 * Count axis wins across the six cascade metrics AND the four raw pillars
 * (owner 2026-06-27: the tally was 6 metrics only; fold in the raw pillars so the
 * head-to-head count reflects raw volume too). Cost = lower wins; everything else
 * higher wins. Max is now 10.
 *
 * Exported for the workspace compare page's matchup-summary module — same
 * calculation the CompareMatchup panels use. (Moved verbatim from
 * components/compare/CompareMatchup.tsx.)
 */
export function compareTally(
  a: LeaderboardRow,
  b: LeaderboardRow,
): { aWins: number; bWins: number } {
  const ca = a.snapshot.cascade;
  const cb = b.snapshot.cascade;
  const ta = a.telemetry;
  const tb = b.telemetry;
  const comp = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c && !c.nonCompounding ? pick(c) : 0;
  const raw = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c ? pick(c) : 0;
  const tel = (t: typeof ta, pick: (x: NonNullable<typeof ta>) => number) =>
    t ? pick(t) : 0;
  const axes: Array<[number, number, boolean]> = [
    // 6 derived metrics
    [comp(ca, (x) => x.yield_), comp(cb, (x) => x.yield_), true],
    [raw(ca, (x) => x.snr), raw(cb, (x) => x.snr), true],
    [comp(ca, (x) => x.leverage), comp(cb, (x) => x.leverage), true],
    [raw(ca, (x) => x.velocity), raw(cb, (x) => x.velocity), true],
    [comp(ca, (x) => x.dev10x ?? 0), comp(cb, (x) => x.dev10x ?? 0), true],
    [raw(ca, (x) => x.costPerMillion), raw(cb, (x) => x.costPerMillion), false], // lower wins
    // 4 raw pillars (higher volume wins)
    [tel(ta, (x) => x.fresh_input), tel(tb, (x) => x.fresh_input), true],
    [tel(ta, (x) => x.output), tel(tb, (x) => x.output), true],
    [tel(ta, (x) => x.cache_read), tel(tb, (x) => x.cache_read), true],
    [tel(ta, (x) => x.cache_create), tel(tb, (x) => x.cache_create), true],
  ];
  let aWins = 0;
  let bWins = 0;
  for (const [av, bv, higherWins] of axes) {
    if (av === bv) continue;
    const aBetter = higherWins ? av > bv : av < bv;
    if (aBetter) aWins++;
    else bWins++;
  }
  return { aWins, bWins };
}

/**
 * Derive the top-5 facts for operator `me`, with `foe` as the relative anchor.
 * Returns fewer than 5 only when the cascade is absent.
 */
export function deriveFacts(
  me: LeaderboardRow,
  foe: LeaderboardRow,
): OperatorFact[] {
  const c = me.snapshot.cascade;
  const f = foe.snapshot.cascade;
  if (!c) return [];

  const facts: OperatorFact[] = [];
  const push = (
    polarity: FactPolarity,
    label: string,
    detail: string,
    weight: number,
  ) => facts.push({ polarity, label, detail, weight });

  // ── Regime (absolute, archetype) — always a fact; weight is moderate so a
  //    standout metric can outrank it. ──
  const reg = regimeOf({
    velocity: c.velocity,
    leverage: c.leverage,
    construction: c.construction,
    nonCompounding: c.nonCompounding,
  });
  push(
    reg.key === "input-bound" || reg.key === "priming" || reg.key === "stateless"
      ? "down"
      : "up",
    "Build Archetype",
    reg.word,
    1.5,
  );

  if (c.nonCompounding) {
    // Non-compounding operators have no leverage/yield cascade — say so plainly,
    // then fall through to the raw/velocity/cost facts that still apply.
    push("down", "Cascade", "no cache commits — stateless", 2);
  } else {
    // ── Leverage (absolute) ──
    if (c.leverage >= B.levClosed)
      push("up", "Leverage", `closed loop · ${fmtLev(c.leverage)}`, 4);
    else if (c.leverage >= B.levDeep)
      push("up", "Leverage", `deep reuse · ${fmtLev(c.leverage)}`, 2.5);
    else push("down", "Leverage", `light reuse · ${fmtLev(c.leverage)}`, 1.5);

    // ── Yield (relative — the headline) ──
    if (f && !f.nonCompounding && c.yield_ !== f.yield_) {
      const ratio = f.yield_ > 0 ? c.yield_ / f.yield_ : Infinity;
      if (ratio >= 1.15)
        push(
          "up",
          "Υ Yield",
          `leads ${ratio >= 10 ? fmtK(ratio) : ratio.toFixed(1)}× · ${fmtK(c.yield_)}`,
          3.5,
        );
      else if (ratio <= 0.87)
        push("down", "Υ Yield", `trails · ${fmtK(c.yield_)}`, 3);
    }
  }

  // ── Velocity (absolute) ──
  if (c.velocity >= B.velFast)
    push("up", "Velocity", `fast · ${c.velocity.toFixed(1)} o/i`, 2.5);
  else if (c.velocity < B.velSlow)
    push("down", "Velocity", `slow · ${c.velocity.toFixed(2)} o/i`, 1.5);

  // ── Cost (absolute, lower-is-better) ──
  if (c.costPerMillion <= B.costLeader)
    push("up", "Cost", `cost leader · $${c.costPerMillion.toFixed(2)}/1M`, 3);
  else if (c.costPerMillion >= B.costHeavy)
    push(
      "down",
      "Cost",
      `cost heavy · $${c.costPerMillion.toFixed(2)}/1M`,
      2.5,
    );

  // ── Efficiency (absolute) ──
  if (c.efficiency >= B.effStrong)
    push("up", "Efficacy", `strong · ${c.efficiency.toFixed(2)}`, 2);

  // ── Scale (absolute, from raw total) ──
  const t = me.telemetry;
  const total = t
    ? t.fresh_input + t.output + t.cache_read + t.cache_create
    : 0;
  if (total > 0) {
    if (c.scaleV >= 9)
      push("up", "Scale", `heavyweight · ${fmtK(total)} tok`, 2);
    else if (c.scaleV > 0 && c.scaleV < 6)
      push("flat", "Scale", `lightweight · ${fmtK(total)} tok`, 1);
  }

  // Top 5 by |signal|, stable by insertion for ties.
  return facts
    .map((x, i) => ({ x, i }))
    .sort((p, q) => q.x.weight - p.x.weight || p.i - q.i)
    .slice(0, 5)
    .map(({ x }) => x);
}
