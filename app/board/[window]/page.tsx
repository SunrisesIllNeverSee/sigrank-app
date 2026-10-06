/**
 * app/board/[window]/page.tsx — the per-window live leaderboard.
 *
 * One shareable route per window (/board/7d · /board/30d · /board/90d ·
 * /board/all). Phase-2B (WS-3 page integration + WS-6 shell isolation,
 * PHASE2B_IMPLEMENTATION_PLAN.md): the frozen reference workspace
 * (components/live/*, tag reference-v1) is now the rendered surface. Routes,
 * slugs, the everything/off redirects, generateMetadata, JsonLd/AEO output,
 * generateStaticParams, and ISR (revalidate=3600) are preserved unchanged.
 *
 * DATA ARCHITECTURE — first-page SSR + client field fetch:
 *   The server reads ONE ranking scope (getLeaderboard: operatorTotal,
 *   claimedOnly, window-filtered except all_time — identical params to the
 *   pre-2B page) and projects it via getLiveBoardInitialState into the
 *   typed LiveBoardInitialState: operators[] carries the first
 *   LIVE_PAGE_SIZE (200) rows; fieldStats / movers / hall / fieldMax /
 *   population derive from the FULL scope (the live denominator — never a
 *   constant). On mount the client mount (live-board-mount.tsx) fetches the
 *   remaining rows from GET /api/live-board?window&offset&limit — same
 *   projection server-side, capped at 2,000 rows/request matching the
 *   public API ceiling (paged beyond that). This restores the documented
 *   "SSR first page + lazy fetch" contract BoardTableClient describes —
 *   the pre-2B page drifted to serializing slice(0,400) into RSC props on
 *   all_time.
 *
 * A/B REVIEW FLAG — `?v=legacy`:
 *   Renders the pre-workspace board (WaveHero + BoardTableClient +
 *   LeaderboardKey) for visual soak against the new surface. Read
 *   client-side post-mount (live-board-mount.tsx) so this page never
 *   touches searchParams — the route stays static + CDN-cacheable per the
 *   2026-07-02 constraint. SSR always emits the workspace; flagged
 *   sessions swap after hydration. Remove the `legacy` subtree after soak.
 *
 * SHELL OPT-OUT (WS-6):
 *   The workspace is a 100vh self-chromed app shell — its X-rail IS the
 *   nav on this surface. app/globals.css carries the surgical opt-out:
 *   `body:has(.lbw-root)` hides the inherited Nav/DemoBanner/Footer
 *   (display:none = real isolation — layout AND a11y tree) and releases
 *   <main>'s max-width/padding. Chosen over the plan's (site)/(workspace)
 *   route-group split because moving ~40 routes collides with in-flight
 *   app/ work; isolation is equivalent and zero-move. Under ?v=legacy
 *   .lbw-root is absent → the site chrome returns untouched.
 *
 * The trailing "What is this?" explainer renders at page level for both
 *   variants — the workspace is a 100vh shell so the copy sits one scroll
 *   below the app, keeping the SEO/AEO body content live (not hidden).
 */

import { notFound, redirect } from "next/navigation";
import React, { Suspense } from "react";
import type { Metadata } from "next";
import { getLeaderboard, getLiveBoardInitialState } from "@/lib/board";
import { toEntry } from "@/lib/board/to-entry";
import { boardWindowBySlug, BOARD_WINDOWS } from "@/lib/board/windows";
import { WaveHero } from "@/components/ui/WaveHero";
import { VercelMarketplaceBadge } from "@/components/vercel/VercelMarketplaceBadge";
import { LeaderboardKey } from "@/components/leaderboard/LeaderboardKey";
import { JsonLd } from "@/components/seo/JsonLd";
import { leaderboardItemList, sigrankDataset, faqPage } from "@/lib/jsonld";
import { withOG } from "@/lib/seo";
import { BoardTableClient } from "@/components/board/BoardTableClient";
import { LiveBoardMount } from "./live-board-mount";

// D19: cache leaderboard reads for 3600s (1 hour). Board data changes only on
// snapshot submit, which triggers on-demand revalidation via revalidateTouchedWindows.
// The 300s ISR was over-validating — 3600s cuts ~92% of ISR invocations.
export const revalidate = 3600;

/** Statically render the four known windows. "off" board disabled (egress fix). */
export function generateStaticParams() {
  return BOARD_WINDOWS.map((w) => ({ window: w.slug }));
}

/** Legacy surface SSR page depth — the documented BoardTableClient contract
 *  (first page + lazy fetch via /api/v1/leaderboard). */
const LEGACY_SSR_ROWS = 25;

/** Per-window OG metadata. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ window: string }>;
}): Promise<Metadata> {
  const { window: slug } = await params;
  const win = boardWindowBySlug(slug);
  if (!win) return { title: "Board not found" };
  const label = win.label;
  const isAllTime = win.slug === "all";
  const titleLabel = isAllTime ? "AI User Leaderboard" : `${label} Leaderboard`;
  return withOG({
    title: titleLabel,
    description: isAllTime
      ? `The SigRank AI user leaderboard — AI users ranked by Υ Yield (token cascade efficiency). See how top AI operators compare all-time.`
      : `The SigRank ${label.toLowerCase()} leaderboard — AI operators ranked by Υ Yield (token cascade efficiency).`,
    path: `/board/${slug}`,
    ogImage: {
      url: `/board/${slug}/og`,
      width: 1200,
      height: 630,
      alt: `SigRank ${titleLabel}`,
    },
  });
}

export default async function BoardWindowPage({
  params,
}: {
  params: Promise<{ window: string }>;
}) {
  const { window: slug } = await params;

  // Legacy alias (owner 2026-06-25): the old "everything" firehose was removed. Any
  // surviving /board/everything link forwards to /board/all so it never 404s.
  if (slug === "everything") redirect("/board/all");

  // "off" board disabled (egress fix 2026-07-31): the allSnapshots path pulled
  // all 2,413 rows on every ISR cycle. Redirect to /board/all (the static
  // all_time board covers the same operators).
  if (slug === "off") redirect("/board/all");

  const win = boardWindowBySlug(slug);
  if (!win) notFound();
  const isAllTime = win.slug === "all";

  // All windows query the DB directly; ISR (revalidate=3600) bounds egress to
  // 1 query/hour. Only claimed/live operators are shown — the full seeded
  // board (including unclaimed seed operators) lives on sigeconomy.com/all-time.
  //
  // ONE ranking scope, two projections. getLiveBoardInitialState issues the
  // SAME getLeaderboard call (identical param literal → identical memo key),
  // so this Promise.all shares a single cached read: the workspace gets the
  // typed LiveBoardInitialState (first page + full-scope aggregates); the
  // raw rows feed the legacy table's SSR page and the JsonLd item list.
  const [initial, liveRows] = await Promise.all([
    getLiveBoardInitialState(win.slug),
    getLeaderboard({
      window: win.enum,
      windowFilter: win.enum !== "all_time",
      operatorTotal: true,
      claimedOnly: true,
      mode: "all",
    }),
  ]);

  const totalCount = liveRows.length;
  // Legacy surface (?v=legacy): restored to the documented contract — first
  // 25 rows SSR'd, deeper pages lazy-fetched client-side (BoardTableClient
  // handlePageChange → /api/v1/leaderboard, 2,000-row cap).
  const legacyEntries = liveRows.slice(0, LEGACY_SSR_ROWS).map(toEntry);
  // JsonLd: all_time keeps the top-100 slice (serialized size bound);
  // bounded windows serialize the whole (small) scope — unchanged.
  const jsonLdEntries = isAllTime
    ? liveRows.slice(0, 100).map(toEntry)
    : liveRows.map(toEntry);

  // Dynamic H1 label: each board window gets a unique page heading (e.g.
  // "30-Day Leaderboard" vs "AI User Leaderboard") so /board/all and /board/30d
  // don't share the same H1.
  const boardLabel = isAllTime
    ? "AI User"
    : `${win.days}-Day`;

  return (
    <>
      <JsonLd
        data={[
          sigrankDataset({ updated: new Date().toISOString() }),
          leaderboardItemList(
            jsonLdEntries.map((e) => ({
              codename: e.codename,
              display_name: e.anonId !== e.codename ? e.anonId : null,
              rank: e.rank,
              classTier: e.signalClass,
            })),
            `/board/${slug}`,
          ),
          // AEO: FAQPage schema targeting "who is the best AI user?" queries
          // on the leaderboard page itself — where the answer lives.
          faqPage([
            {
              question: `Who is the best AI user (${boardLabel.toLowerCase()})?`,
              answer: `The best AI user on the ${boardLabel.toLowerCase()} SigRank leaderboard is the operator ranked #1 by Yield (Υ = cache_read × output / input²). This page shows the live ranking — operators are scored by objective token-cascade efficiency, not subjective voting. The #1 operator has the highest yield, meaning they reuse cached context most efficiently and produce the most output relative to their input.`,
            },
            {
              question: "Who is the most efficient AI coder right now?",
              answer: `The most efficient AI coder right now is the #1 operator on this SigRank ${boardLabel.toLowerCase()} leaderboard. Efficiency is measured by Yield (Υ = cache_read × output / input²) — a composite metric computed from signed token telemetry. The operator at the top maximizes context reuse and output while minimizing wasted input tokens.`,
            },
            {
              question: "How are AI operators ranked on this leaderboard?",
              answer: `AI operators on the SigRank ${boardLabel.toLowerCase()} leaderboard are ranked by Yield (Υ = cache_read × output / input²). Operators run the sigrank CLI locally, which reads four token pillars (cache_read, cache_write, input, output) and submits a signed, server-verifiable snapshot. No prompt content leaves the machine — only the four counts. The leaderboard updates as new snapshots are submitted.`,
            },
            {
              question: "What is a user-based AI leaderboard?",
              answer: `A user-based AI leaderboard ranks the accounts that use AI tools, not the AI models themselves. SigRank (signalaf.com) is the first user-based AI leaderboard — it ranks AI operators by objective token-cascade efficiency (Yield, Υ). This is different from model leaderboards like LMSYS Chatbot Arena, which rank AI models by human voting. SigRank answers "who is the best AI user?" not "which model is best?"`,
            },
            {
              question: "Is SigRank a model leaderboard or a user leaderboard?",
              answer: `SigRank is a user leaderboard. It ranks AI operators (the accounts using AI tools) by token-cascade efficiency, not AI models by benchmark performance. LMSYS Chatbot Arena, LiveBench, and Hugging Face Open LLM Leaderboard rank models. SigRank ranks users. If you want to know which model is best, use LMSYS. If you want to know who is the best AI user, use SigRank.`,
            },
          ]),
        ]}
      />

      {/* The workspace surface (default) vs the pre-2B board (?v=legacy).
          The flag is read client-side in LiveBoardMount so this page stays
          static — SSR always ships the workspace; flagged sessions swap
          post-hydration. */}
      <LiveBoardMount
        key={win.slug}
        initial={initial}
        windowSlug={win.slug}
        legacy={
          <div className="flex flex-col gap-6">
            {/* LB-1 + shared wave hero (owner 2026-06-21): the board masthead
                uses the same animated <WaveHero/> as the Hall, with
                board-specific copy. */}
            <WaveHero
              eyebrow="Burners, Builders & 10×ers"
              terminalText="SIGNALBOARD"
              title={
                <>
                  {boardLabel}{" "}
                  <span className="bg-gradient-to-r from-gold to-text-accent bg-clip-text text-transparent">
                    Leaderboard
                  </span>
                </>
              }
              subtitle={
                <>
                  Four integers in, full ledger out. Every operator ranked by{" "}
                  <strong className="text-text-primary">Υ Yield</strong> — the
                  architecture of the cascade, not raw spend. Volume alone is
                  noise; yield is signal.{" "}
                  <span className="text-text-secondary">
                    See how you rank. Compare against top operators. Beat the
                    average.
                  </span>
                </>
              }
            />

            <VercelMarketplaceBadge />

            {/* Client wrapper: reads useSearchParams for platform/view filter
                state, selects + filters from the pre-fetched datasets. Wrapped
                in <Suspense> so useSearchParams() doesn't force a client-side
                render bailout during static generation. */}
            <Suspense
              fallback={
                <div className="animate-pulse rounded-lg border border-bg-border bg-bg-surface p-6">
                  <div className="mb-4 h-8 rounded bg-bg-elevated" />
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-6 rounded bg-bg-elevated" />
                    ))}
                  </div>
                </div>
              }
            >
              <BoardTableClient
                totalEntries={legacyEntries}
                totalCount={totalCount}
                window={win.slug}
                windowEnum={win.enum}
              />
            </Suspense>

            {/* Key popup (owner 2026-06-24): metrics + the eight experience
                tiers + TRANSMITTER badge — after the table per owner. */}
            <LeaderboardKey />
          </div>
        }
      />

      {/* ── What is this? — page-level so both variants share it (the
          workspace is a 100vh app shell; this sits one scroll below). ── */}
      <section className="mx-auto max-w-2xl px-4 py-8">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The SigRank leaderboard ranks AI operators by token-cascade efficiency
          — Υ Yield = (cache_read × output) / input². Operators are classified
          into 8 experience tiers (ARCH+, ARCH, POWER, BASE, SEEKER, REFINER,
          BEARER, IGNITER) based on accumulated token volume, with the
          TRANSMITTER peak badge for temporary signal highs. Higher yield means
          more signal per token spent — not more time, not more output, but
          better architecture.
        </p>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          The board refreshes every hour during active periods. Operators are
          ranked by yield, not output volume — a high-yield operator produces
          more signal per token than a low-yield one, regardless of how many
          hours they code. Class tiers are yield thresholds, so climbing the
          board means improving your cascade architecture, not just spending
          more time in the editor.
        </p>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          To get listed, install the SigRank CLI (
          <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">
            npm i -g sigrank
          </code>
          ), enroll, and submit a snapshot. The on-device scanner reads your
          four token pillars and publishes a signed record. No prompt content
          leaves your machine — only the four counts.
        </p>
        {win.slug === "all" && (
          <p className="mt-4 border-t border-bg-border-subtle pt-4 font-sans text-xs leading-relaxed text-text-muted">
            This board shows claimed operators with verified submissions. The
            full seeded archive (all operators including the historical seed
            corpus) is at{" "}
            <a
              href="https://sigeconomy.com/all-time"
              className="text-gold underline underline-offset-2 hover:text-text-primary"
              rel="noopener"
            >
              sigeconomy.com/all-time
            </a>
            .
          </p>
        )}
      </section>
    </>
  );
}
