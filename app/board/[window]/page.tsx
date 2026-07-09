/**
 * app/board/[window]/page.tsx — the 730 per-window leaderboard.
 *
 * One shareable route per window (/board/7d · /board/30d · /board/90d · /board/all).
 * Each is a board hero heading (LB-1) + the window switcher + the full
 * LeaderboardTable (which carries the Metrics ↔ Raw-pillars view toggle). The
 * window slug maps to a DB window_type enum; getLeaderboard applies the window
 * filter + buffer (lib/data/windows.ts). RSC; ISR-cached 300s (D19).
 *
 * LB-2 (owner 2026-06-20): the headline Υ-yield bar chart (BoardYieldBars) was
 * removed — the table already shows Υ with per-row species heat, so the big chart
 * was redundant. LB-1: a real page heading now leads the board (was none).
 *
 * The four windows are statically generated. An unknown slug → 404.
 *
 * CACHING (2026-07-02): the page no longer reads searchParams (which forced
 * dynamic rendering + no-store). Both operatorTotal + perPlatform data variants
 * are pre-fetched on the server; the client wrapper (BoardTableClient) reads
 * useSearchParams and selects/filters the right dataset. This keeps the page
 * static + CDN-cacheable (revalidate=300) while preserving filter functionality.
 */

import { notFound, redirect } from 'next/navigation'
import React, { Suspense } from 'react'
import type { Metadata } from 'next'
import { getLeaderboard } from '@/lib/data'
import { toEntry } from '@/lib/leaderboard/to-entry'
import { boardWindowBySlug, BOARD_WINDOWS } from '@/lib/data/windows'
import { WaveHero } from '@/components/ui/WaveHero'
import { LeaderboardKey } from '@/components/leaderboard/LeaderboardKey'
import { JsonLd } from '@/components/seo/JsonLd'
import { leaderboardItemList, sigrankDataset } from '@/lib/jsonld'
import { withOG } from '@/lib/seo'
import { BoardTableClient } from '@/components/board/BoardTableClient'

// D19: cache leaderboard reads for 300s (Cache-Control max-age=300 equivalent).
export const revalidate = 300

/** Statically render the four known windows + the "off" (filter-off) board. */
export function generateStaticParams() {
  return [...BOARD_WINDOWS.map((w) => ({ window: w.slug })), { window: 'off' }]
}

/** Per-window OG metadata. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ window: string }>
}): Promise<Metadata> {
  const { window: slug } = await params
  const isOff = slug === 'off'
  const win = isOff ? null : boardWindowBySlug(slug)
  if (!isOff && !win) return { title: 'Board not found' }
  const label = isOff ? 'All-time' : win!.label
  return withOG({
    title: `${label} Leaderboard`,
    description: `The SigRank ${label.toLowerCase()} leaderboard — AI operators ranked by Υ Yield (token cascade efficiency).`,
    path: `/board/${slug}`,
    ogImage: { url: `/board/${slug}/og`, width: 1200, height: 630, alt: `SigRank ${label} Leaderboard` },
  })
}

export default async function BoardWindowPage({
  params,
}: {
  params: Promise<{ window: string }>
}) {
  const { window: slug } = await params

  // Legacy alias (owner 2026-06-25): the old "everything" firehose was removed. Any
  // surviving /board/everything link forwards to the new default so it never 404s.
  if (slug === 'everything') redirect('/board/off')

  // "off" board (owner 2026-06-26 — FIX F): filters off shows ALL of an operator's
  // submissions broken out by (platform × window) — every snapshot point, no collapse —
  // each row LABELED (codename · platform · window) so the breakouts read as intentional,
  // not the old unlabeled "everything" firehose. allSnapshots keeps every row; the window
  // label (LeaderboardTable, win==='off') + platform column disambiguate the duplicates.
  const isOff = slug === 'off'
  // The route slug is the primary WINDOW selector (default board = /board/all = all_time).
  const win = isOff ? null : boardWindowBySlug(slug)
  if (!isOff && !win) notFound()

  // Pre-fetch BOTH data variants on the server so the page is fully static
  // (no searchParams access → revalidate=300 takes effect → CDN-cached).
  // The client wrapper (BoardTableClient) selects + filters the right dataset
  // based on useSearchParams. The "off" board only needs allSnapshots.
  let totalEntries: ReturnType<typeof toEntry>[] = []
  let platformEntries: ReturnType<typeof toEntry>[] = []
  let offEntries: ReturnType<typeof toEntry>[] = []

  if (isOff) {
    const rows = await getLeaderboard({ allSnapshots: true })
    offEntries = rows.map(toEntry)
  } else {
    // operatorTotal: one row per operator (the 'multi' roll-up when present).
    const totalRows = await getLeaderboard({
      window: win!.enum,
      windowFilter: true,
      operatorTotal: true,
    })
    totalEntries = totalRows.map(toEntry)

    // perPlatform: one row per (operator, platform) — for ?view=platforms.
    const platformRows = await getLeaderboard({
      window: win!.enum,
      windowFilter: true,
      perPlatform: true,
    })
    platformEntries = platformRows.map(toEntry)
  }

  // JsonLd from the default (operatorTotal) entries — search engines see the
  // default board. Filtered variants are client-side and don't need structured data.
  const jsonLdEntries = isOff ? offEntries : totalEntries

  // Dynamic H1 label: each board window gets a unique page heading (e.g.
  // "30-Day Leaderboard" vs "All-Time Leaderboard") so /board/all and /board/30d
  // don't share the same H1. "Burners, Builders & 10×ers" moves to the eyebrow.
  const boardLabel = isOff
    ? 'All-Time'
    : win!.slug === 'all'
      ? 'All-Time'
      : `${win!.days}-Day`

  return (
    <div className="flex flex-col gap-6">
      {/* LB-1 + shared wave hero (owner 2026-06-21): the board masthead now uses the
          same animated <WaveHero/> as the Hall, with board-specific copy. */}
      <WaveHero
        eyebrow="Burners, Builders & 10×ers"
        terminalText="SIGNALBOARD"
        title={
          <>
            {boardLabel}{' '}
            <span className="bg-gradient-to-r from-gold to-text-accent bg-clip-text text-transparent">
              Leaderboard
            </span>
          </>
        }
        subtitle={
          <>
            Four integers in, full ledger out. Every operator ranked by{' '}
            <strong className="text-text-primary">Υ Yield</strong> — the architecture of the cascade,
            not raw spend. Volume is noise; yield is signal.
          </>
        }
      />

      {/* ── What is this? ── */}
      <section className="mx-auto max-w-2xl px-4 pb-6">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The SigRank leaderboard ranks AI operators by token-cascade efficiency —
          Υ Yield = (cache_read × output) / input². Operators are tiered into
          Burners, Builders, and 10×ers based on how well they compound signal
          across their token cascade. Higher yield means more signal per token
          spent — not more time, not more output, but better architecture.
        </p>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          To get listed, install the SigRank CLI (<code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">npm i -g sigrank</code>),
          enroll, and submit a snapshot. The on-device scanner reads your four
          token pillars and publishes a signed record. No prompt content leaves
          your machine — only the four counts.
        </p>
      </section>

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
        ]}
      />

      {/* Client wrapper: reads useSearchParams for platform/view filter state,
          selects + filters from the pre-fetched datasets. Wrapped in <Suspense>
          so useSearchParams() doesn't force a client-side render bailout during
          static generation — the fallback renders in the static HTML. */}
      <Suspense fallback={
        <div className="animate-pulse rounded-lg border border-bg-border bg-bg-surface p-6">
          <div className="mb-4 h-8 rounded bg-bg-elevated" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-6 rounded bg-bg-elevated" />
            ))}
          </div>
        </div>
      }>
        <BoardTableClient
          totalEntries={totalEntries}
          platformEntries={platformEntries}
          offEntries={offEntries.length > 0 ? offEntries : undefined}
          window={isOff ? 'off' : win!.slug}
        />
      </Suspense>

      {/* Key popup (owner 2026-06-24): metrics + the nine classes — moved to the END
          of the board (after the table) per owner. */}
      <LeaderboardKey />
    </div>
  )
}
