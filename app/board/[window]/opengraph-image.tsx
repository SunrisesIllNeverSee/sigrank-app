/**
 * app/board/[window]/opengraph-image.tsx — per-board-window dynamic OG card.
 *
 * Generates a 1200×630 PNG showing the window label + top 3 operators.
 * System font + inline styles only. File-convention: Next auto-injects
 * the og:image / twitter:image meta for this route segment.
 */

import { ImageResponse } from 'next/og'
import { getLeaderboard } from '@/lib/data'
import { toEntry } from '@/lib/leaderboard/to-entry'
import { boardWindowBySlug } from '@/lib/data/windows'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function BoardOG({
  params,
}: {
  params: Promise<{ window: string }>
}) {
  const { window: slug } = await params
  const win = boardWindowBySlug(slug)

  // Fallback for unknown slugs (the page 404s, but OG route must not throw).
  const label = win?.label ?? 'Leaderboard'

  const rows = await getLeaderboard(
    win ? { window: win.enum } : {},
  )
  const top3 = rows.slice(0, 3).map(toEntry)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: '#0a0a0a',
          color: '#ededed',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: brand + window label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#C4923A' }}>
            ◈ SigRank
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, opacity: 0.8 }}>
            {label}
          </div>
        </div>

        {/* Middle: title + top 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Leaderboard
          </div>
          {top3.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {top3.map((e, i) => (
                <div
                  key={e.codename}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: 32,
                  }}
                >
                  <span style={{ color: '#C4923A', fontWeight: 800, width: 60 }}>
                    #{e.rank}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {e.anonId}
                  </span>
                  <span style={{ opacity: 0.5, fontSize: 24 }}>
                    {e.signalClass}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom: url */}
        <div style={{ fontSize: 28, opacity: 0.4 }}>
          signalaf.com/board/{slug}
        </div>
      </div>
    ),
    { ...size },
  )
}
