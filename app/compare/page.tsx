/**
 * app/compare/page.tsx — head-to-head operator comparison. The Nav links here.
 *
 * RSC: resolves operators A and B from ?a=&b= codenames (defaulting to a
 * day-seeded rotating pick vs "the-field"), reads through the @/lib/data facade
 * (mock fallback when no creds), and renders the presentational CompareTable
 * (metric table + shape radar + Pro gate). A row of quick-swap links re-targets
 * slot B while keeping A.
 *
 * ISR (2026-08-12): page is ISR (revalidate=300). Auth-dependent
 * "compare against me" moved client-side (CompareAgainstMe). The
 * bumpComparisonsRan counter moved to a client-side API call. The page no
 * longer reads cookies or headers, so it can be edge-cached. Each unique
 * ?a=X&b=Y combination is generated on first request then cached.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG, SITE_ORIGIN } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

import {
  getLeaderboard,
  getOperator,
  getOperatorHistory,
  type LeaderboardRow,
} from "@/lib/board";
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
import { CompareAgainstMe } from "@/components/compare/CompareAgainstMe";
import {
  CompareShareCard,
  type CompareOperand,
} from "@/components/share/CompareShareCard";
import { DeferredCompareMatchupCard } from "@/components/share/DeferredCompareMatchupCard";
import { operatorDisplayName } from "@/lib/identity/operator-name";
import { isOutlierRow } from "@/lib/analytics/outlier-classify";

export const metadata: Metadata = withOG({
  title: "Compare Operators",
  description:
    "Head-to-head operator comparison across the cascade layer — Υ Yield, SNR, Leverage, Velocity, 10xDEV & blended cost — with a shape radar.",
  path: "/compare",
});

// PERF (2026-08-12): page is ISR. The default view (no ?a= or ?b= params)
// is prerendered with a day-seeded pick vs the-field. When ?a= and ?b= are
// present, Next.js generates the page on-demand and caches the result for
// `revalidate` seconds (per unique param combo). Auth-dependent "compare
// against me" moved client-side (CompareAgainstMe) so the page no longer
// reads cookies/headers. The bumpComparisonsRan counter moved to a
// client-side API call (TrackCompareView → /api/v1/stats/compare-bump).
//
// FIX (2026-08-28): removed `force-static` — it prerendered the page once at
// build time with empty searchParams, so ?a=&b= were ignored at runtime and
// the page always showed the default matchup. Without force-static, `revalidate`
// alone gives ISR with per-searchParams on-demand generation.
export const revalidate = 300;

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

  // PERF: parallelize independent fetches.
  const [board, operatorA, fieldRow] = await Promise.all([
    getLeaderboard(),
    a ? getOperator(a) : Promise.resolve(null),
    getOperator("the-field"),
  ]);
  const humanBoard = board.filter((r) => !isOutlierRow(r));

  // Default opponent B is "The Field" — the median-Υ baseline operator (owner
  // 2026-06-27, migration 0024) — so the page opens as "you vs. the field median".
  // Note: this is the LIVE field median (computed from real operators' Υ),
  // distinct from the AA-modeled 3.5:1:0.5 baseline in SplitFlapCard/FourDegreesChart.
  //
  // Default side A (owner 2026-06-27): a rotating board pick rather than always
  // #1 (so the matchup isn't the lopsided top-vs-average). The pick is day-seeded,
  // not Math.random() (which would break ISR caching) — stable within a cache
  // window, varies day to day. The Field itself is excluded from the A pool.
  //
  // "Compare yourself" (signed-in operator as side A) is now handled client-side
  // by CompareAgainstMe, which navigates to /compare?a=<codename> — preserving
  // the ISR cache for the default view.
  let defaultA: LeaderboardRow | null = null;
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
    operatorA ?? defaultA ?? board[0] ?? null;
  let rowB: LeaderboardRow | null =
    (b ? await getOperator(b) : null) ??
    fieldRow ??
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
          Compare AI Operators
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
      <JsonLd data={[
        breadcrumb([{ name: "Compare", path: "/compare" }]),
        faqPage([
          {
            question: "How do I compare two AI operators on SigRank?",
            answer:
              "Visit signalaf.com/compare and select two operators using the dropdown selectors. The comparison shows Yield (Υ), SNR, Leverage, Velocity, 10xDEV, and blended cost side by side, plus a shape radar visualizing each operator's cascade profile. You can share the comparison via URL.",
          },
          {
            question: "What metrics does the SigRank comparison show?",
            answer:
              "The head-to-head comparison shows six cascade metrics: Yield (Υ = cache_read × output / input²), SNR (signal-to-noise ratio), Leverage (cache reuse efficiency), Velocity (output per token), 10xDEV (log-normalized value above replacement), and blended cost ($/1M tokens). A dual-layer radar chart visualizes the raw token counts and derived metrics.",
          },
          {
            question: "Can I compare myself against another AI operator?",
            answer:
              "Yes. If you are enrolled on SigRank, the Compare Against Me feature lets you select yourself as one of the comparison operands. You can compare your cascade metrics against any other operator on the leaderboard to see exactly where and why you differ.",
          },
        ]),
      ]} />
      <TrackCompareView isDefault={!(a && b)} />
      <WaveHero
        eyebrow="🤖⚔️🤖 Manus ad Manum"
        terminalText="COMPARE"
        title="Compare AI Operators"
        subtitle={
          <>
            Two operators. One cascade layer. Υ Yield, SNR, Leverage, Velocity,
            10xDEV &amp; blended cost — the data tells you not just who&apos;s
            ahead, but <em>where</em> and why.
          </>
        }
      />

      {/* "Compare yourself" — client-side auth gate (replaces server-side
          getSessionOperator). Shows a button when signed in. */}
      <CompareAgainstMe />

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
      <DeferredCompareMatchupCard
        a={rowA}
        b={rowB}
        href={`/compare?a=${encodeURIComponent(aCode)}&b=${encodeURIComponent(bCode)}`}
      />

      {/* Throw-Downs "coming soon" line — page tail. */}
      {ThrowDownLine}

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            All-Time Leaderboard
          </Link>
          {" · "}
          <Link
            href="/hall"
            className="text-gold underline underline-offset-2"
          >
            Hall of Signal
          </Link>
          {" · "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
          </Link>
          {" · "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield (Υ) Cascade
          </Link>
        </p>
      </section>
    </div>
  );
}
