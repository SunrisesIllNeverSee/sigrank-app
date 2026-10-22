/**
 * app/compare/page.tsx — head-to-head operator comparison. The Nav links here.
 *
 * RSC: resolves operators A and B from ?a=&b= codenames (defaulting to a
 * day-seeded rotating pair of qualified live operators), reads through the
 * @/lib/data facade
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
import { ArtworkShareControls } from "@/components/share/ArtworkShareControls";
import { UnifiedShare } from "@/components/share/UnifiedShare";
import { withOG, SITE_ORIGIN } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";
import { FaqSection } from "@/components/seo/FaqSection";

import {
  getLeaderboard,
  getOperatorHistory,
  type LeaderboardRow,
} from "@/lib/board";
import { CompareMatchup } from "@/components/compare/CompareMatchup";
import {
  CompareSelectors,
  type CompareOption,
} from "@/components/compare/CompareSelectors";
import { CompareLedger } from "@/components/compare/CompareLedger";
import { CompareHistoryChart } from "@/components/compare/CompareHistoryChart";
import { liveCompareCandidates, resolveLiveComparePair } from "@/lib/board/compare-live";
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
import {
  compareTally,
  deriveFacts,
} from "@/lib/analytics/compare-facts";
import { snapshotThroughput } from "@/lib/board/throughput";
import { fmtTokens } from "@/lib/analytics/record-value";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { CompareMobileScore } from "@/components/compare/CompareMobileScore";
import { CompareStage } from "@/components/compare/CompareStage";
import { CompareHeadToHead } from "@/components/compare/CompareRadars";
import { sampleFromRow } from "@/lib/compare/radar-math";
import { COMPARE_OPERAND_COLORS } from "@/components/compare/compare-palette";
import "@/components/compare/compare-workspace.css";

export const metadata: Metadata = withOG({
  title: "Compare AI Operators",
  description:
    "Head-to-head operator comparison across the cascade layer — Υ Yield, SNR, Leverage, Velocity, 10xDEV & blended cost — with a shape radar.",
  path: "/compare",
});

// PERF (2026-08-12): page is ISR. The default view (no ?a= or ?b= params)
// is prerendered with a day-seeded pair of live operators. When ?a= and ?b= are
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

/** Single source for the FAQPage JSON-LD and the visible FAQ section. */
const COMPARE_FAQS = [
  {
    question: "How do I compare two AI operators on SigRank?",
    answer:
      "Visit signalaf.com/compare and select two operators using the dropdown selectors. The comparison shows Yield (Υ), SNR, Leverage, Velocity, 10xDEV, and blended cost side by side, plus each operator's own raw and metric radars and a shared Yield-over-time chart. You can share the comparison via URL.",
  },
  {
    question: "What metrics does the SigRank comparison show?",
    answer:
      "The head-to-head comparison shows six cascade metrics: Yield (Υ = cache_read × output / input²), SNR (signal-to-noise ratio), Leverage (cache reuse efficiency), Velocity (output per token), 10xDEV (log-normalized value above replacement), and blended cost ($/1M tokens). Individual raw and metric radar charts describe each live operator, with their recorded Yield history beneath.",
  },
  {
    question: "Can I compare myself against another AI operator?",
    answer:
      "Yes. If you are enrolled on SigRank, the Compare Against Me feature lets you select yourself as one of the comparison operands. You can compare your cascade metrics against any other operator on the leaderboard to see exactly where and why you differ.",
  },
];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;

  // Exactly the live board's eligible operator field; exclude seed, synthetic
  // field, UR and inactive unclaimed profiles even on explicit ?a/?b= URLs.
  const board = liveCompareCandidates(await getLeaderboard({
    strictLive: true,
    window: "all_time",
    windowFilter: false,
    operatorTotal: true,
    claimedOnly: true,
    mode: "all",
  }).catch(() => []));
  const daySeed = Math.floor(Date.now() / 86_400_000);
  const pair = resolveLiveComparePair(board, a, b, daySeed);
  const rowA = pair?.[0] ?? null;
  const rowB = pair?.[1] ?? null;

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

  if (!rowA || !rowB) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          Compare AI Operators
        </h1>
        <p className="font-sans text-sm text-text-secondary">
          At least two eligible live ranked operators are needed to compare.
        </p>
      </div>
    );
  }

  const aCode = rowA.operator.codename;
  const bCode = rowB.operator.codename;

  // Only active qualified live operators are eligible for both selectors.
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
        xA={rowA.operator.links?.x || rowA.operator.handle}
        xB={rowB.operator.links?.x || rowB.operator.handle}
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
        xA={rowA.operator.links?.x || rowA.operator.handle}
        xB={rowB.operator.links?.x || rowB.operator.handle}
        compareUrl={compareUrl}
      />
    </div>
  );

  // Operator mini-profile module (left rail = A, right rail = B) — real data,
  // same identity treatment as the matchup panels.
  const opMini = (row: LeaderboardRow, side: "a" | "b") => {
    const c = row.snapshot.cascade;
    const live = c && !c.nonCompounding;
    return (
      <div className="ws-kv">
        <div className="row">
          <span className="k">{side === "a" ? "OP·A" : "OP·B"}</span>
          <span className="v" style={{ color: "var(--tx)", fontWeight: 700 }}>
            {nameOf(row)}
          </span>
        </div>
        <div className="row">
          <span className="k">class</span>
          <span className="v">{row.snapshot.class_tier ?? "—"}</span>
        </div>
        <div className="row">
          <span className="k">rank</span>
          <span className="v">#{row.global_rank}</span>
        </div>
        <div className="row">
          <span className="k">Υ yield</span>
          <span className="v acc">{live ? (c.yield_ >= 1000 ? `${(c.yield_ / 1000).toFixed(1)}K` : c.yield_.toFixed(2)) : "—"}</span>
        </div>
        <div className="row">
          <span className="k">platform</span>
          <span className="v">{row.operator.primary_domain ?? "—"}</span>
        </div>
      </div>
    );
  };

  const { aWins, bWins } = compareTally(rowA, rowB);
  const factsA = deriveFacts(rowA, rowB).slice(0, 3);
  const factsB = deriveFacts(rowB, rowA).slice(0, 3);

  // Token Throughput per side — canonical exact-calendar processed tok/day
  // (same source the live board's thpt column + the ledger FLOW row read).
  const thrStr = (r: LeaderboardRow) => {
    const t = r.telemetry;
    const th = t
      ? snapshotThroughput({
          inputTokens: t.fresh_input,
          outputTokens: t.output,
          cacheWriteTokens: t.cache_create,
          cacheReadTokens: t.cache_read,
          windowStart: r.window_start,
          windowEnd: r.window_end,
        })
      : null;
    return th ? `${fmtTokens(th.processedTokensPerDay)}/d` : "—";
  };
  const yStr = (r: LeaderboardRow) => {
    const c = r.snapshot.cascade;
    if (!c || c.nonCompounding) return "—";
    return c.yield_ >= 1000 ? `${(c.yield_ / 1000).toFixed(1)}K` : c.yield_.toFixed(2);
  };
  const aThr = thrStr(rowA);
  const bThr = thrStr(rowB);

  return (
    <div>
      <JsonLd data={[
        breadcrumb([{ name: "Compare", path: "/compare" }]),
        faqPage(COMPARE_FAQS),
      ]} />
      <TrackCompareView isDefault={!(a && b)} />

      {/* One fixed comparison workspace, using the implemented page's data and
          original operator/context sidebars. All stage sections stay visible. */}
      <WorkspaceShell
        active="compare"
        title="COMPARE"
        leftTitle="COMPARE"
        left={
          <>
            <div className="mod">
              <div className="mini-h"><span className="sq"></span>OPERATOR A</div>
              {opMini(rowA, "a")}
              <CompareAgainstMe eligibleCodes={selectorOptions.map(o => o.codename)}
                bCode={bCode} />
            </div>
            <div className="mod">
              <div className="mini-h"><span className="sq"></span>OPERATOR B</div>
              {opMini(rowB, "b")}
            </div>
            <div className="mod">
              <div className="mini-h"><span className="sq"></span>METRIC CONTEXT</div>
              <p className="ws-note">
                Ledger rows: six raw pillars + eight cascade metrics + the{" "}
                <b>FLOW</b> row — Token Throughput, the canonical exact-calendar
                processed-tokens/day rate (not ∑ total tokens). Lower-wins axes
                (cost, $/1M) are inverted so the better side always reads
                outward on the radars.
              </p>
            </div>
          </>
        }
        rightTitle="CONTEXT"
        right={
          <>
            <div className="mod cmp-sidebar-matchup">
              <div className="mini-h"><span className="sq"></span>MATCHUP</div>
              <div className="ws-kv">
                <div className="row">
                  <span className="k">score</span>
                  <span className="v acc">{aWins}–{bWins}</span>
                </div>
                <div className="row">
                  <span className="k">throughput</span>
                  <span className="v">
                    {nameOf(rowA)} {aThr} · {nameOf(rowB)} {bThr}
                  </span>
                </div>
              </div>
              {factsA.length + factsB.length > 0 && (
                <ul className="ws-note" style={{ marginTop: 8, padding: 0, listStyle: "none" }}>
                  {[...factsA.map((f) => [`A·${f.label}`, f.detail] as const),
                    ...factsB.map((f) => [`B·${f.label}`, f.detail] as const)]
                    .slice(0, 4)
                    .map(([k, d], i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
                        <b>{k}</b> — {d}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <div className="mod cmp-sidebar-challenges">{ThrowDownLine}</div>
            <div className="mod">
              <div className="mini-h"><span className="sq"></span>SHARE</div>
              <UnifiedShare title="SignalAF · Operator Matchup" href={`/compare?a=${encodeURIComponent(aCode)}&b=${encodeURIComponent(bCode)}`} screenshotTarget="#compare-vs-artwork" />
              <ArtworkShareControls target="compare-vs-artwork" title="VS matchup"
                filename={`signalaf-vs-${aCode}-${bCode}`}
                href={`/compare?a=${encodeURIComponent(aCode)}&b=${encodeURIComponent(bCode)}`} />
              <div className="ws-share">
                <CompareShareCard
                  a={toOperand(rowA)}
                  b={toOperand(rowB)}
                  href={`/compare?a=${encodeURIComponent(aCode)}&b=${encodeURIComponent(bCode)}`}
                />
              </div>
              <div className="ws-share" style={{ marginTop: 10 }}>
                <DeferredCompareMatchupCard
                  a={rowA}
                  b={rowB}
                  field={board.map(sampleFromRow)}
                  href={`/compare?a=${encodeURIComponent(aCode)}&b=${encodeURIComponent(bCode)}`}
                />
              </div>
            </div>
            <div className="mod">
              <div className="mini-h"><span className="sq"></span>RELATED</div>
              <div className="ws-nav">
                <Link href="/board/all">ALL-TIME LEADERBOARD</Link>
                <Link href="/hall">HALL OF SIGNAL</Link>
                <Link href="/methodology">METHODOLOGY</Link>
                <Link href="/metrics/yield-cascade">YIELD (Υ) CASCADE</Link>
              </div>
            </div>
          </>
        }
        leftWidth={228}
        rightWidth={240}
        status={
          <>
            {nameOf(rowA).toUpperCase()} × {nameOf(rowB).toUpperCase()} · SIGNALAF × SIGRANK · MO§ES™
          </>
        }
      >
        {/* LEDGER — full RAW / METRICS / FLOW / TOTAL head-to-head lives in
            the stage (owner annotation: not a rail module). */}
        <CompareStage>
        <div id="compare-vs-artwork" className="ws-cmp">
          {/* Phone-only score card (hidden above 760px by CSS), owner 2026-10-21. */}
          <CompareMobileScore
            a={{ name: nameOf(rowA), rank: rowA.global_rank, yieldStr: yStr(rowA), thr: aThr }}
            b={{ name: nameOf(rowB), rank: rowB.global_rank, yieldStr: yStr(rowB), thr: bThr }}
            aWins={aWins}
            bWins={bWins}
            href={`/compare?a=${encodeURIComponent(aCode)}&b=${encodeURIComponent(bCode)}`}
          />
          <div className="cmp-title-selectors">
            <CompareSelectors options={selectorOptions} aCode={aCode} bCode={bCode} />
          </div>
          <div className="ws-cmp-match">
            <CompareMatchup a={rowA} b={rowB} options={selectorOptions} hideSelectors field={board.map(sampleFromRow)} />
          </div>
          <div className="ws-cmp-ledger">
            <CompareLedger a={rowA} b={rowB} workspace />
          </div>
          <div className="ws-cmp-h2h">
            <CompareHeadToHead a={rowA} b={rowB} />
          </div>
          <div className="ws-cmp-hist cmp-hist-desk">
            <CompareHistoryChart
              historyA={historyA}
              historyB={historyB}
              nameA={nameOf(rowA)}
              nameB={nameOf(rowB)}
              height={140}
              colorA={COMPARE_OPERAND_COLORS.a}
              colorB={COMPARE_OPERAND_COLORS.b}
            />
          </div>
          <div className="ws-cmp-hist cmp-hist-phone">
            <CompareHistoryChart
              historyA={historyA}
              historyB={historyB}
              nameA={nameOf(rowA)}
              nameB={nameOf(rowB)}
              height={210}
              compact
              colorA={COMPARE_OPERAND_COLORS.a}
              colorB={COMPARE_OPERAND_COLORS.b}
            />
          </div>
        </div>
        </CompareStage>
        {/* Visible FAQ (same array as the FAQPage JSON-LD), collapsed to one
            line at the foot of the stage so the fitted layout is untouched. */}
        <FaqSection faqs={COMPARE_FAQS} id="compare-faq" variant="workspace" collapsed />
      </WorkspaceShell>
    </div>
  );
}
