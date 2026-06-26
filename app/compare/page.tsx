/**
 * app/compare/page.tsx — head-to-head operator comparison. The Nav links here.
 *
 * RSC: resolves operators A and B from ?a=&b= codenames (defaulting to the top
 * two on the board), reads through the @/lib/data facade (mock fallback when no
 * creds), and renders the presentational CompareTable (metric table + shape
 * radar + Pro gate). A row of quick-swap links re-targets slot B while keeping A.
 */

import type { Metadata } from 'next'

import { getLeaderboard, getOperator, type LeaderboardRow } from '@/lib/data'
import { WaveHero } from '@/components/ui/WaveHero'
import { CompareMatchup } from '@/components/compare/CompareMatchup'
import { type CompareOption } from '@/components/compare/CompareSelectors'
import { CompareLedger } from '@/components/compare/CompareLedger'
import { CompareRadars } from '@/components/compare/CompareRadars'
// CMP redesign (owner 2026-06-22): the matchup box (CompareMatchup) folds the selectors +
// identity + 5 derived facts per operator; CompareLedger is the RAW/METRICS/TOTAL ledger
// (owner's ASCII template); CompareRadars is the dual-layer raw+metrics radar pair.
// Superseded: CompareVersus, CompareBars, CompareTable, CompareTitleCard (files retained,
// just unmounted — not archived).
import { ChallengeBar } from '@/components/compare/ChallengeBar'
import { getChallengeBetween } from '@/lib/challenges/server'
import { GATE_CHALLENGES } from '@/lib/features'

export const metadata: Metadata = {
  title: 'Compare Operators · SigRank',
  description:
    'Head-to-head operator comparison across the cascade layer — Υ Yield, SNR, Leverage, Velocity, 10xDEV & blended cost — with a shape radar.',
}

function nameOf(row: LeaderboardRow): string {
  // Prefer the real name whenever present — including unclaimed seeds whose names
  // are backfilled in Supabase (mirror to-entry.ts; the old `claimed &&` gate hid
  // those and surfaced raw codenames). Owner's own 730 window-pulls are staged as
  // mock rows with placeholder codenames ("static seed · 7d ✱mem") and no
  // display_name; render those as a clean window label, never the raw placeholder.
  if (row.operator.display_name) return row.operator.display_name
  const code = row.operator.codename
  const m = code.match(/^static seed · (7d|30d|90d|all)( ✱mem)?/)
  if (m) {
    const win = m[1] === 'all' ? 'all-time' : m[1]
    return m[2] ? `Owner · ${win} (with claude-mem)` : `Owner · ${win}`
  }
  return code
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>
}) {
  const { a, b } = await searchParams
  // Full operator corpus for the opponent pickers (owner 2026-06-22: "do the static
  // seed all") — every seed operator, not just the top 12. board[] (yield-ranked) still
  // supplies the defaults.
  const board = await getLeaderboard({ limit: 500 })

  // Resolve A and B; default to the top two operators, fall back gracefully if a
  // supplied codename doesn't resolve.
  const rowA: LeaderboardRow | null = (a ? await getOperator(a) : null) ?? board[0] ?? null
  let rowB: LeaderboardRow | null = (b ? await getOperator(b) : null) ?? board[1] ?? null
  if (rowA && rowB && rowA.operator.codename === rowB.operator.codename) {
    rowB = board.find((r) => r.operator.codename !== rowA.operator.codename) ?? rowB
  }

  const activeChallenge =
    GATE_CHALLENGES && rowA && rowB
      ? await getChallengeBetween(rowA.operator.codename, rowB.operator.codename)
      : null

  if (!rowA || !rowB) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          ◈ Compare
        </h1>
        <p className="font-sans text-sm text-text-secondary">
          Not enough operators to compare yet.
        </p>
      </div>
    )
  }

  const aCode = rowA.operator.codename
  const bCode = rowB.operator.codename

  // All seed operators for the opponent pickers (owner 2026-06-22). De-dup codenames,
  // sort by display label so the dropdowns read cleanly.
  const seen = new Set<string>()
  const selectorOptions: CompareOption[] = board
    .filter((r) => {
      if (seen.has(r.operator.codename)) return false
      seen.add(r.operator.codename)
      return true
    })
    .map((r) => ({ codename: r.operator.codename, label: nameOf(r) }))
    .sort((x, y) => x.label.localeCompare(y.label))

  const ThrowDownLine = GATE_CHALLENGES ? (
    <ChallengeBar codeA={aCode} codeB={bCode} activeChallenge={activeChallenge} />
  ) : (
    <div className="flex items-center gap-3 rounded-lg border border-bg-border bg-bg-surface px-4 py-3">
      <span className="font-mono text-xs text-text-muted">⚔ Throw-Downs</span>
      <span className="rounded-full border border-bg-border px-2.5 py-0.5 font-mono text-[10px] text-text-muted">
        Coming soon
      </span>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      <WaveHero
        eyebrow="◈ Compare"
        terminalText="HEAD TO HEAD"
        title="Head to Head"
        subtitle={
          <>
            Two operators across the cascade layer — Υ Yield, SNR, Leverage, Velocity,
            10xDEV &amp; blended cost. Two architectures: the data tells you not just
            who&apos;s ahead, but <em>where</em> and why.
          </>
        }
      />

      {/* MAIN MATCHUP BOX — selectors + two operator panels: identity (logo/name/
          class/Υ) outboard, 5 derived facts inboard (owner 2026-06-22). */}
      <CompareMatchup a={rowA} b={rowB} options={selectorOptions} />

      {/* LEDGER — the RAW / METRICS / TOTAL head-to-head table to the owner's ASCII
          template, with diverging bars per row (owner 2026-06-22). */}
      <CompareLedger a={rowA} b={rowB} />

      {/* DUAL-LAYER RADARS — raw shape + metric shape (ghost raw underlay), consuming
          TERM's CascadeRadar variant support (owner 2026-06-22). */}
      <CompareRadars a={rowA} b={rowB} />

      {/* Throw-Downs "coming soon" line — page tail. */}
      {ThrowDownLine}
    </div>
  )
}
