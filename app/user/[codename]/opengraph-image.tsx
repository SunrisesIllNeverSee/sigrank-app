/**
 * app/user/[codename]/opengraph-image.tsx — the RANK card.
 *
 * The OG/social preview for an operator's profile: about their RANK — big
 * #position + percentile, name + class, and a mini bar chart of the headline
 * metrics. Rendered to PNG via ImageResponse (Satori) at 1200×630. Pasting a
 * signalaf.com/user/<codename> link into X/Discord/iMessage shows this card.
 *
 * Sibling cards: the stats card (full signature) and the compare card live at
 * their own routes; this one is rank-first per owner (2026-06-27).
 */
import { ImageResponse } from 'next/og'
import { getOperator, getLeaderboard } from '@/lib/data'
import { CardFrame, MetricBar, GOLD, DIM, TEXT, ogFonts } from '@/lib/og/card'

export const runtime = 'nodejs'
export const alt = 'SigRank operator rank card'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function decode(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

const fmtYield = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0))

export default async function Image({ params }: { params: Promise<{ codename: string }> }) {
  const { codename: raw } = await params
  const row = await getOperator(decode(raw))
  const fonts = await ogFonts()

  // Unknown / pending operators still get a clean card (no fabricated stats).
  if (!row) {
    return new ImageResponse(
      (
        <CardFrame>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', fontSize: 48, color: TEXT }}>
            Operator not found
          </div>
        </CardFrame>
      ),
      { ...size, fonts },
    )
  }

  const name = row.operator.display_name ?? row.operator.codename
  const handle = row.operator.handle ? `@${row.operator.handle}` : null
  const cls = row.snapshot.class_tier
  const c = row.snapshot.cascade
  const ranked = !row.pending && c && !c.nonCompounding

  // Percentile from the operator's rank against the full board size.
  const board = await getLeaderboard({ limit: 500 })
  const total = Math.max(board.length, 1)
  const pct = ranked ? Math.round((1 - (row.global_rank - 1) / total) * 100) : null

  // Bar shares: each metric relative to the board max on that axis (so a bar
  // reads as "where this operator sits", honest and bounded 0..1).
  const maxOf = (sel: (r: (typeof board)[number]) => number) =>
    Math.max(...board.map(sel), 1)
  const yMax = maxOf((r) => (r.snapshot.cascade && !r.snapshot.cascade.nonCompounding ? r.snapshot.cascade.yield_ : 0))
  const snrMax = maxOf((r) => r.snapshot.cascade?.snr ?? 0)
  const levMax = maxOf((r) => (r.snapshot.cascade && !r.snapshot.cascade.nonCompounding ? r.snapshot.cascade.leverage : 0))
  const velMax = maxOf((r) => r.snapshot.cascade?.velocity ?? 0)

  const subParts = [handle, cls, pct != null ? `${pct}th pct` : null].filter(Boolean)

  return new ImageResponse(
    (
      <CardFrame ctaCodename={row.operator.codename}>
        {/* rank pill, top-right of the body */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
            <div style={{ fontSize: 58, color: TEXT, fontWeight: 700, lineHeight: 1.05 }}>{name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, fontSize: 22, color: '#bbbbbb' }}>
              {cls ? (
                <span style={{ background: '#1c1708', color: GOLD, padding: '6px 16px', borderRadius: 8, fontSize: 19, border: '1px solid #3a2f10' }}>
                  {cls}
                </span>
              ) : null}
              <span>{subParts.join(' · ')}</span>
            </div>
          </div>
          {ranked ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{ fontSize: 92, color: GOLD, fontWeight: 800, lineHeight: 0.9 }}>#{row.global_rank}</div>
              <div style={{ fontSize: 15, color: DIM, letterSpacing: 2.4, marginTop: 6 }}>GLOBAL RANK</div>
            </div>
          ) : (
            <div style={{ fontSize: 22, color: DIM }}>not ranked yet</div>
          )}
        </div>

        {/* metric bars */}
        {ranked && c ? (
          <div style={{ display: 'flex', gap: 34, marginTop: 'auto', marginBottom: 30 }}>
            <MetricBar value={fmtYield(c.yield_)} label="Υ Yield" share={c.yield_ / yMax} />
            <MetricBar value={`${(c.snr * 100).toFixed(0)}%`} label="SNR" share={c.snr / snrMax} />
            <MetricBar value={`${c.leverage.toFixed(0)}×`} label="Leverage" share={c.leverage / levMax} />
            <MetricBar value={c.velocity.toFixed(1)} label="Velocity" share={c.velocity / velMax} />
          </div>
        ) : null}
      </CardFrame>
    ),
    { ...size, fonts },
  )
}
