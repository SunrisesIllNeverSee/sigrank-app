/**
 * components/compare/CompareMatchup.tsx — CMP-MATCHUP (owner 2026-06-22).
 *
 * The combined main highlights box: opponent selectors on top, then two operator
 * panels split A | B. Each panel carries — on its OUTER edge — the identity block
 * (class glyph + name + class·#rank + Υ), and — inboard — that operator's top-5
 * derived facts (strengths △/✦ weaknesses). Each side tinted by its own class
 * color; the leading operator (more axis wins) carries the gold winner-glow.
 *
 * Folds the old CompareSelectors + CompareVersus into one box. Pure presentational
 * server component over two rows + the shared narrate/facts helpers — no fetch.
 */

import type { LeaderboardRow } from '@/lib/data'
import type { SignalClass } from '@/components/sigrank/types'
import { colors } from '@/components/sigrank/tokens'
import { glyphFor } from '@/lib/canon/ids'
import { deriveFacts, type OperatorFact } from '@/lib/compare/facts'
import { CompareSelectors, type CompareOption } from '@/components/compare/CompareSelectors'

function nameOf(row: LeaderboardRow): string {
  return row.operator.claimed && row.operator.display_name
    ? row.operator.display_name
    : row.operator.codename
}

function classColor(cls: SignalClass): string {
  return colors.class[cls] ?? colors.class.BASE
}

/** CSS-var token name for a class (e.g. 'ARCH+' → 'class-archplus'). */
function classVar(cls: SignalClass): string {
  return 'class-' + cls.toLowerCase().replace('+', 'plus')
}

function yieldStr(r: LeaderboardRow): string {
  const c = r.snapshot.cascade
  if (!c || c.nonCompounding) return '—'
  const y = c.yield_
  // Small yields (e.g. The Field, a low-leverage baseline at ~0.36) must show
  // decimals — toFixed(0) rounded them to a misleading "0". ≥1000 → K-form,
  // ≥1 → whole, <1 → 2dp so a real positive yield never displays as zero.
  if (y >= 1000) return `${(y / 1000).toFixed(1)}K`
  if (y >= 1) return y.toFixed(0)
  return y.toFixed(2)
}

/**
 * Count axis wins across the six cascade metrics AND the four raw pillars
 * (owner 2026-06-27: the tally was 6 metrics only; fold in the raw pillars so the
 * head-to-head count reflects raw volume too). Cost = lower wins; everything else
 * higher wins. Max is now 10.
 */
function tally(a: LeaderboardRow, b: LeaderboardRow): { aWins: number; bWins: number } {
  const ca = a.snapshot.cascade
  const cb = b.snapshot.cascade
  const ta = a.telemetry
  const tb = b.telemetry
  const comp = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c && !c.nonCompounding ? pick(c) : 0
  const raw = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) => (c ? pick(c) : 0)
  const tel = (t: typeof ta, pick: (x: NonNullable<typeof ta>) => number) => (t ? pick(t) : 0)
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
  ]
  let aWins = 0
  let bWins = 0
  for (const [av, bv, higherWins] of axes) {
    if (av === bv) continue
    const aBetter = higherWins ? av > bv : av < bv
    if (aBetter) aWins++
    else bWins++
  }
  return { aWins, bWins }
}

/** A single fact line. ✦ strength · △ weakness · · neutral, theme-reactive.
 * Both panels render facts left-aligned (owner 2026-06-22: A + B formatted the same). */
function FactLine({ fact }: { fact: OperatorFact }) {
  const mark = fact.polarity === 'up' ? '✦' : fact.polarity === 'down' ? '△' : '·'
  const markColor =
    fact.polarity === 'up'
      ? 'text-gold'
      : fact.polarity === 'down'
        ? 'text-text-dim'
        : 'text-text-muted'
  return (
    <li className="flex items-baseline gap-1.5 text-left">
      <span className={'font-mono text-[11px] leading-none ' + markColor} aria-hidden>
        {mark}
      </span>
      <span className="min-w-0 font-sans text-[11px] leading-snug text-text-secondary">
        <span className="font-medium text-text-primary">{fact.label}</span>
        <span className="text-text-muted"> · {fact.detail}</span>
      </span>
    </li>
  )
}

export function CompareMatchup({
  a,
  b,
  options,
}: {
  a: LeaderboardRow
  b: LeaderboardRow
  options: CompareOption[]
}) {
  const nameA = nameOf(a)
  const nameB = nameOf(b)
  const clsA = a.snapshot.class_tier as SignalClass
  const clsB = b.snapshot.class_tier as SignalClass
  const colA = classColor(clsA)
  const colB = classColor(clsB)

  const { aWins, bWins } = tally(a, b)
  const winner: 'a' | 'b' | null = aWins === bWins ? null : aWins > bWins ? 'a' : 'b'

  const factsA = deriveFacts(a, b)
  const factsB = deriveFacts(b, a)

  const Panel = ({
    r,
    side,
    cls,
    col,
    name,
    facts,
    won,
  }: {
    r: LeaderboardRow
    side: 'a' | 'b'
    cls: SignalClass
    col: string
    name: string
    facts: OperatorFact[]
    won: boolean
  }) => {
    const cvar = classVar(cls)
    const tint = won ? 0.16 : 0.08
    // Both panels formatted the SAME (owner 2026-06-22): identity LEFT, 5 points RIGHT.
    // Class tint still bleeds from each side's outer edge so the matchup stays distinct.
    const bg = `linear-gradient(${side === 'a' ? '105deg' : '255deg'}, rgb(var(--${cvar}) / ${tint}), transparent 72%)`
    const identity = (
      <div className="flex shrink-0 flex-col items-start gap-1 text-left">
        <span className="font-mono text-3xl leading-none" style={{ color: col }} aria-hidden>
          {glyphFor(cls)}
        </span>
        <span className="break-words font-mono text-sm font-bold text-text-primary">{name}</span>
        <span className="font-mono text-[11px] uppercase tracking-wide" style={{ color: col }}>
          {cls} · #{r.global_rank}
        </span>
        <span className="figure-rise mt-1 font-mono text-4xl font-bold leading-none text-gold">
          {yieldStr(r)}
        </span>
        <span className="font-mono text-[10px] text-text-muted">Υ Yield</span>
        {won && (
          <span className="mt-1 rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-gold">
            ◆ Leads {Math.max(aWins, bWins)}–{Math.min(aWins, bWins)}
          </span>
        )}
      </div>
    )
    const factList = (
      <ul className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        {facts.length > 0 ? (
          facts.map((fact, i) => <FactLine key={i} fact={fact} />)
        ) : (
          <li className="font-sans text-[11px] text-text-muted">No cascade data yet.</li>
        )}
      </ul>
    )
    return (
      <div
        className={
          'relative flex min-w-0 flex-1 flex-row items-stretch gap-3 rounded-lg p-4 ' +
          (won ? ' winner-glow' : '')
        }
        style={{ background: bg }}
      >
        {identity}
        {factList}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-bg-border bg-bg-surface p-4">
      <CompareSelectors options={options} aCode={a.operator.codename} bCode={b.operator.codename} />
      <div className="flex items-stretch gap-2 sm:gap-4">
        <Panel r={a} side="a" cls={clsA} col={colA} name={nameA} facts={factsA} won={winner === 'a'} />
        <div className="flex flex-col items-center justify-center gap-1 px-1 sm:px-2">
          <span
            className="font-mono text-3xl font-bold tracking-widest text-text-secondary sm:text-4xl"
            style={{ textShadow: `0 0 26px rgb(var(--gold) / 0.6)` }}
          >
            VS
          </span>
          <span className="font-mono text-base font-bold tabular-nums text-text-muted sm:text-lg">
            {aWins}–{bWins}
          </span>
        </div>
        <Panel r={b} side="b" cls={clsB} col={colB} name={nameB} facts={factsB} won={winner === 'b'} />
      </div>
    </div>
  )
}
