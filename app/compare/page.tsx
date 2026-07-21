/**
 * app/compare/page.tsx — head-to-head operator comparison. The Nav links here.
 *
 * RSC: resolves operators A and B from ?a=&b= codenames (defaulting to the top
 * two on the board), reads through the @/lib/data facade (mock fallback when no
 * creds), and renders the presentational CompareTable (metric table + shape
 * radar + Pro gate). A row of quick-swap links re-targets slot B while keeping A.
 */

import type { Metadata } from "next";
import { withOG, SITE_ORIGIN } from "@/lib/seo";

import { headers } from "next/headers";
import {
  getLeaderboard,
  getOperator,
  getOperatorHistory,
  type LeaderboardRow,
} from "@/lib/board";
import { bumpComparisonsRan } from "@/lib/board/queries";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { WaveHero } from "@/components/ui/WaveHero";
import { CompareMatchup } from "@/components/compare/CompareMatchup";
import { type CompareOption } from "@/components/compare/CompareSelectors";
import { CompareLedger } from "@/components/compare/CompareLedger";
import { CompareRadars } from "@/components/compare/CompareRadars";
import { CompareHistoryChart } from "@/components/compare/CompareHistoryChart";
// CMP redesign (owner 2026-06-22): the matchup box (CompareMatchup) folds the selectors +
// identity + 5 derived facts per operator; CompareLedger is the RAW/METRICS/TOTAL ledger
// (owner's ASCII template); CompareRadars is the dual-layer raw+metrics radar pair.
// Superseded: CompareVersus, CompareBars, CompareTable, CompareTitleCard (files retained,
// just unmounted — not archived).
import { ChallengeBar } from "@/components/compare/ChallengeBar";
import { ChallengeOnX } from "@/components/compare/ChallengeOnX";
import { getChallengeBetween } from "@/lib/identity/challenges-server";
import { GATE_CHALLENGES } from "@/lib/features";
import { TrackCompareView } from "@/components/analytics/TrackCompareView";
import {
  CompareShareCard,
  type CompareOperand,
} from "@/components/share/CompareShareCard";
import dynamic from "next/dynamic";
const CompareMatchupCard = dynamic(
  () => import("@/components/share/CompareMatchupCard").then((m) => m.CompareMatchupCard),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-lg border border-bg-border bg-bg-base/40" /> },
);
import { operatorDisplayName } from "@/lib/identity/operator-name";
import { isOutlierRow } from "@/lib/analytics/outlier-classify";

export const metadata: Metadata = withOG({
  title: "Compare Operators",
  description:
    "Head-to-head operator comparison across the cascade layer — Υ Yield, SNR, Leverage, Velocity, 10xDEV & blended cost — with a shape radar.",
  path: "/compare",
});

// The canonical name rule lives in lib/compare/operator-name.ts so the page, matchup,
// radars, ledger + share card all agree (was duplicated + drifted — components stayed
// claimed-gated and showed raw codenames like "DriftPilgrim" for seed rows).
const nameOf = operatorDisplayName;

/**
 * Build a CompareShareCard operand from a row — the headline metrics with raw
 * values + winner direction, same set the on-page bars use. Cost is lower-wins.
 */
function toOperand(row: LeaderboardRow): CompareOperand {
  const c = row.snapshot.cascade;
  const live = c && !c.nonCompounding;
  const yield_ = live ? c.yield_ : 0;
  const lev = live ? c.leverage : 0;
  const snr = c ? c.snr : 0;
  const vel = c ? c.velocity : 0;
  const cost = c ? c.costPerMillion : 0;
  return {
    name: nameOf(row),
    signalClass: row.snapshot.class_tier,
    metrics: [
      {
        label: "Yield",
        value:
          yield_ >= 1000 ? `${(yield_ / 1000).toFixed(1)}K` : yield_.toFixed(0),
        raw: yield_,
        higherWins: true,
      },
      {
        label: "SNR",
        value: `${(snr * 100).toFixed(0)}%`,
        raw: snr,
        higherWins: true,
      },
      {
        label: "Leverage",
        value: `${lev.toFixed(0)}x`,
        raw: lev,
        higherWins: true,
      },
      { label: "Velocity", value: vel.toFixed(1), raw: vel, higherWins: true },
      {
        label: "$/1M",
        value: `$${cost.toFixed(2)}`,
        raw: cost,
        higherWins: false,
      },
    ],
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;

  // Count a user-specified head-to-head as a "comparison ran" (the fogged homepage
  // stat). Only when BOTH operands are chosen, and skip prefetch so hovering a
  // compare link doesn't inflate it. Fire-and-forget + fully defensive.
  if (a && b) {
    const h = await headers();
    const isPrefetch =
      h.get("next-router-prefetch") === "1" || h.get("purpose") === "prefetch";
    if (!isPrefetch) await bumpComparisonsRan();
  }
  // Full operator corpus for the opponent pickers (owner 2026-06-22: "do the static
  // seed all") — every operator, not just the top 500. Owner 2026-07-16: removed the
  // 500 limit so the searchable combobox can find ANY operator. board[] (yield-ranked)
  // still supplies the defaults. (owner 2026-07-14: outliers/bots filtered from the
  // default A pool + field median, but remain selectable in the dropdown.)
  const board = await getLeaderboard();
  const humanBoard = board.filter((r) => !isOutlierRow(r));

  // Default opponent B is "The Field" — the median-Υ baseline operator (owner
  // 2026-06-27, migration 0024) — so the page opens as "you vs. the field median".
  // Note: this is the LIVE field median (computed from real operators' Υ),
  // distinct from the AA-modeled 3.5:1:0.5 baseline in SplitFlapCard/FourDegreesChart.
  //
  // Default side A (owner 2026-06-27): the SIGNED-IN operator (true "you vs.
  // average"); when signed out, a rotating board pick rather than always #1 (so
  // the matchup isn't the lopsided top-vs-average). The pick is day-seeded, not
  // Math.random() (which would break RSC/ISR caching) — stable within a cache
  // window, varies day to day. The Field itself is excluded from the A pool.
  let defaultA: LeaderboardRow | null = null;
  const session = await getSessionOperator();
  if (session?.codename) defaultA = await getOperator(session.codename);
  if (!defaultA) {
    const pool = humanBoard.filter((r) => r.operator.codename !== "the-field");
    if (pool.length > 0) {
      const daySeed = Math.floor(
        Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`) /
          86_400_000,
      );
      defaultA = pool[daySeed % pool.length] ?? pool[0];
    }
  }

  const rowA: LeaderboardRow | null =
    (a ? await getOperator(a) : null) ?? defaultA ?? board[0] ?? null;
  let rowB: LeaderboardRow | null =
    (b ? await getOperator(b) : null) ??
    (await getOperator("the-field")) ??
    board[1] ??
    null;
  if (rowA && rowB && rowA.operator.codename === rowB.operator.codename) {
    rowB =
      board.find((r) => r.operator.codename !== rowA.operator.codename) ?? rowB;
  }

  const activeChallenge =
    GATE_CHALLENGES && rowA && rowB
      ? await getChallengeBetween(
          rowA.operator.codename,
          rowB.operator.codename,
        )
      : null;

  // Overtime comparison: both operators' SIGNA RATE history (ascending by date).
  // Fire both fetches in parallel; either can be empty (chart degrades gracefully).
  const [historyA, historyB] =
    rowA && rowB
      ? await Promise.all([
          getOperatorHistory(rowA.operator.codename),
          getOperatorHistory(rowB.operator.codename),
        ])
      : [[], []];

  // Field average Υ Yield — mean of all ranked, compounding HUMAN operators
  // (outliers/bots excluded, owner 2026-07-14). Drawn as a horizontal reference
  // line on the overtime chart.
  const fieldYields = humanBoard
    .filter(
      (r) =>
        !r.pending && r.snapshot.cascade && !r.snapshot.cascade.nonCompounding,
    )
    .map((r) => r.snapshot.cascade!.yield_)
    .filter((v) => Number.isFinite(v) && v > 0);
  const fieldAvgYield = fieldYields.length
    ? fieldYields.reduce((a, b) => a + b, 0) / fieldYields.length
    : null;

  if (!rowA || !rowB) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          🤖⚔️🤖 Throw Down
        </h1>
        <p className="font-sans text-sm text-text-secondary">
          Not enough operators to compare yet.
        </p>
      </div>
    );
  }

  const aCode = rowA.operator.codename;
  const bCode = rowB.operator.codename;

  // All seed operators for the opponent pickers (owner 2026-06-22). De-dup codenames,
  // sort by display label so the dropdowns read cleanly.
  const seen = new Set<string>();
  const selectorOptions: CompareOption[] = board
    .filter((r) => {
      if (seen.has(r.operator.codename)) return false;
      seen.add(r.operator.codename);
      return true;
    })
    .map((r) => ({ codename: r.operator.codename, label: nameOf(r) }))
    .sort((x, y) => x.label.localeCompare(y.label));

  const compareUrl = `${SITE_ORIGIN}/compare?a=${encodeURIComponent(aCode)}&b=${encodeURIComponent(bCode)}`;

  const ThrowDownLine = GATE_CHALLENGES ? (
    <div className="flex flex-wrap items-center gap-3">
      <ChallengeBar
        codeA={aCode}
        codeB={bCode}
        nameA={nameOf(rowA)}
        nameB={nameOf(rowB)}
        activeChallenge={activeChallenge}
      />
      <ChallengeOnX
        nameA={nameOf(rowA)}
        nameB={nameOf(rowB)}
        xA={rowA.operator.links?.x}
        xB={rowB.operator.links?.x}
        compareUrl={compareUrl}
      />
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
      <span className="font-mono text-xs text-text-muted">⚔ Throw-Downs</span>
      <span className="rounded-full border border-bg-border px-2.5 py-0.5 font-mono text-[10px] text-text-muted">
        Coming soon
      </span>
      <ChallengeOnX
        nameA={nameOf(rowA)}
        nameB={nameOf(rowB)}
        xA={rowA.operator.links?.x}
        xB={rowB.operator.links?.x}
        compareUrl={compareUrl}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <TrackCompareView isDefault={!(a && b)} />
      <WaveHero
        eyebrow="🤖⚔️🤖 Throw Down"
        terminalText="MANUS AD MANUM"
        title="Manus ad Manum"
        subtitle={
          <>
            Two operators. One cascade layer. Υ Yield, SNR, Leverage, Velocity,
            10xDEV &amp; blended cost — the data tells you not just who&apos;s
            ahead, but <em>where</em> and why.
          </>
        }
      />

      {/* MAIN MATCHUP BOX — selectors + two operator panels: identity (logo/name/
          class/Υ) outboard, 5 derived facts inboard (owner 2026-06-22). */}
      <CompareMatchup a={rowA} b={rowB} options={selectorOptions} />

      {/* DUAL-LAYER RADARS — raw shape + metric shape (ghost raw underlay), consuming
          TERM's CascadeRadar variant support (owner 2026-06-22). */}
      <CompareRadars a={rowA} b={rowB} />

      {/* OVERTIME COMPARISON — dual-line Υ Yield trajectory on a shared timeline
          (owner 2026-07-02). Shows who's climbing, who's flat, who crossed over. */}
      <div className="rounded-xl border border-bg-border bg-bg-surface p-4">
        <CompareHistoryChart
          historyA={historyA}
          historyB={historyB}
          nameA={nameOf(rowA)}
          nameB={nameOf(rowB)}
          fieldAvg={fieldAvgYield}
        />
      </div>

      {/* LEDGER — the RAW / METRICS / TOTAL head-to-head table to the owner's ASCII
          template, with diverging bars per row (owner 2026-06-22). */}
      <CompareLedger a={rowA} b={rowB} />

      {/* Share / download the head-to-head as a card for socials (owner 2026-06-27). */}
      <CompareShareCard
        a={toOperand(rowA)}
        b={toOperand(rowB)}
        href={`/compare?a=${encodeURIComponent(aCode)}&b=${encodeURIComponent(bCode)}`}
      />

      {/* Matchup + radars card — the full visual snapshot (matchup + dual radars). */}
      <CompareMatchupCard
        a={rowA}
        b={rowB}
        href={`/compare?a=${encodeURIComponent(aCode)}&b=${encodeURIComponent(bCode)}`}
      />

      {/* Throw-Downs "coming soon" line — page tail. */}
      {ThrowDownLine}
    </div>
  );
}
