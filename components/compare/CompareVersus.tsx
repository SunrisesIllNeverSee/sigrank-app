/**
 * components/compare/CompareVersus.tsx — the cinematic head-to-head poster
 * (CMP-SPECIAL, owner 2026-06-20: "make that compare page better… need it to be special").
 *
 * Replaces CompareTitleCard's plain head + narrative with a matchup poster:
 *   - a split field tinted by each operator's OWN class color (left = A, right = B),
 *     meeting at a glowing "VS" seam — every matchup looks visually unique;
 *   - canonical class glyph + name + class·#rank + a big Υ (rise-in);
 *   - the LEADING operator's side carries a gold winner-glow (owner's "glow on #1");
 *   - a verdict strip on a slow spotlight sweep (owner's "beam/spotlight bg");
 *   - a proportional win-tally bar (◀ aWins | bWins ▶), each side its class color,
 *     grow-in animated (owner's "Framer grow-in").
 *
 * Pure CSS/SVG, theme-reactive (colors resolve rgb(var(--token)) at paint), and
 * reduced-motion-safe (all animations lock static in globals.css). Server component:
 * derives everything from the two rows + the shared narrate helpers — no fetch, no
 * client island. The 5-highlights + per-axis lead strip stay in CompareTitleCard.
 */

import type { LeaderboardRow } from '@/lib/data'
import type { SignalClass } from '@/components/sigrank/types'
import { colors } from '@/components/sigrank/tokens'
import { glyphFor } from '@/lib/canon/ids'
import { regimeOf } from '@/lib/compare/narrate'

function nameOf(row: LeaderboardRow): string {
  return row.operator.claimed && row.operator.display_name
    ? row.operator.display_name
    : row.operator.codename
}

function classColor(cls: SignalClass): string {
  return colors.class[cls] ?? colors.class.BASE
}

/** The CSS-var token name for a class (e.g. 'ARCH+' → 'class-archplus'). */
function classVar(cls: SignalClass): string {
  return 'class-' + cls.toLowerCase().replace('+', 'plus')
}

function yieldStr(r: LeaderboardRow): string {
  const c = r.snapshot.cascade
  if (!c || c.nonCompounding) return '—'
  return c.yield_ >= 1000 ? `${(c.yield_ / 1000).toFixed(1)}K` : c.yield_.toFixed(0)
}

/** Count axis wins across the six cascade metrics (cost = lower wins). */
function tally(a: LeaderboardRow, b: LeaderboardRow): { aWins: number; bWins: number } {
  const ca = a.snapshot.cascade
  const cb = b.snapshot.cascade
  const comp = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c && !c.nonCompounding ? pick(c) : 0
  const raw = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) => (c ? pick(c) : 0)
  const axes: Array<[number, number, boolean]> = [
    [comp(ca, (x) => x.yield_), comp(cb, (x) => x.yield_), true],
    [raw(ca, (x) => x.snr), raw(cb, (x) => x.snr), true],
    [comp(ca, (x) => x.leverage), comp(cb, (x) => x.leverage), true],
    [raw(ca, (x) => x.velocity), raw(cb, (x) => x.velocity), true],
    [comp(ca, (x) => x.dev10x ?? 0), comp(cb, (x) => x.dev10x ?? 0), true],
    [raw(ca, (x) => x.costPerMillion), raw(cb, (x) => x.costPerMillion), false], // lower wins
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

export function CompareVersus({ a, b }: { a: LeaderboardRow; b: LeaderboardRow }) {
  const nameA = nameOf(a)
  const nameB = nameOf(b)
  const clsA = a.snapshot.class_tier as SignalClass
  const clsB = b.snapshot.class_tier as SignalClass
  const colA = classColor(clsA)
  const colB = classColor(clsB)

  const { aWins, bWins } = tally(a, b)
  const decided = aWins + bWins
  const aShare = decided > 0 ? aWins / decided : 0.5
  const winner: 'a' | 'b' | null = aWins === bWins ? null : aWins > bWins ? 'a' : 'b'

  const regOf = (r: LeaderboardRow) =>
    regimeOf({
      velocity: r.snapshot.cascade?.velocity ?? 0,
      leverage: r.snapshot.cascade?.leverage ?? 0,
      nonCompounding: r.snapshot.cascade?.nonCompounding,
    })
  const regA = regOf(a)
  const regB = regOf(b)

  const verdict = winner
    ? `${winner === 'a' ? nameA : nameB} takes the cascade, ${Math.max(aWins, bWins)}–${Math.min(aWins, bWins)} — ${nameA} runs a ${regA.word}, ${nameB} a ${regB.word}.`
    : `Dead heat, ${aWins}–${bWins} — ${nameA} a ${regA.word}, ${nameB} a ${regB.word}. Two architectures, not a better operator.`

  const Side = ({ r, side, cls, col, name, won }: {
    r: LeaderboardRow; side: 'a' | 'b'; cls: SignalClass; col: string; name: string; won: boolean
  }) => {
    const cvar = classVar(cls)
    const tint = won ? 0.16 : 0.08
    // Operator's class color bleeds in from their own edge; winner reads brighter.
    const bg = `linear-gradient(${side === 'a' ? '105deg' : '255deg'}, rgb(var(--${cvar}) / ${tint}), transparent 70%)`
    return (
    <div
      className={
        'relative flex min-w-0 flex-1 flex-col gap-1.5 rounded-lg p-4 ' +
        (side === 'a' ? 'items-start text-left' : 'items-end text-right') +
        (won ? ' winner-glow' : '')
      }
      style={{ background: bg }}
    >
      <span className="flex items-center gap-2 font-mono text-2xl" style={{ color: col }} aria-hidden>
        {glyphFor(cls)}
      </span>
      <span className="break-words font-mono text-sm font-bold text-text-primary">{name}</span>
      <span className="font-mono text-[11px] uppercase tracking-wide" style={{ color: col }}>
        {cls} · #{r.global_rank}
      </span>
      <span className="figure-rise font-mono text-4xl font-bold leading-none text-gold">
        {yieldStr(r)}
      </span>
      <span className="font-mono text-[10px] text-text-muted">Υ Yield</span>
      {won && (
        <span className="mt-0.5 rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-gold">
          ◆ Leads {Math.max(aWins, bWins)}–{Math.min(aWins, bWins)}
        </span>
      )}
    </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-xl border border-bg-border bg-bg-surface">
      {/* Poster: A | VS | B, each side tinted by its class color */}
      <div className="flex items-stretch gap-2 p-2 sm:gap-4 sm:p-3">
        <Side r={a} side="a" cls={clsA} col={colA} name={nameA} won={winner === 'a'} />
        <div className="flex flex-col items-center justify-center gap-1 px-1">
          <span
            className="font-mono text-lg font-bold tracking-widest text-text-dim"
            style={{ textShadow: `0 0 18px rgb(var(--gold) / 0.5)` }}
          >
            VS
          </span>
          <span className="font-mono text-[10px] text-text-muted">{aWins}–{bWins}</span>
        </div>
        <Side r={b} side="b" cls={clsB} col={colB} name={nameB} won={winner === 'b'} />
      </div>

      {/* Win-tally bar — proportional, each side its class color, grow-in */}
      <div className="flex h-1.5 w-full overflow-hidden bg-bg-base" aria-hidden>
        <div
          className="tally-grow h-full"
          style={{ width: `${aShare * 100}%`, background: colA, ['--grow-origin' as string]: 'left' }}
        />
        <div
          className="tally-grow h-full"
          style={{ width: `${(1 - aShare) * 100}%`, background: colB, ['--grow-origin' as string]: 'right' }}
        />
      </div>

      {/* Verdict on a slow spotlight sweep */}
      <p className="verdict-sweep px-5 py-3 text-center font-sans text-sm font-medium leading-snug text-text-secondary">
        {verdict}
      </p>
    </section>
  )
}
