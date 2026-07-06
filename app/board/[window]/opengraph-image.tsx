/**
 * app/board/[window]/opengraph-image.tsx — per-board-window dynamic OG card.
 *
 * Generates a 1200×630 PNG showing the window label + top 3 operators.
 * System font + inline styles only. File-convention: Next auto-injects
 * the og:image / twitter:image meta for this route segment.
 */

import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'nodejs'

const LABELS: Record<string, string> = {
  '7d': '7 day',
  '30d': '30 day',
  '90d': '90 day',
  all: 'All time',
}

export default async function BoardOG({
  params,
}: {
  params: Promise<{ window: string }>
}) {
  const { window: slug } = await params
  const label = LABELS[slug] ?? 'Leaderboard'

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#C4923A' }}>
            ◈ SigRank
          </div>
          <div style={{ fontSize: 36, fontWeight: 600, opacity: 0.8 }}>
            {label}
          </div>
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: '-0.03em' }}>
          Leaderboard
        </div>
        <div style={{ fontSize: 28, opacity: 0.4 }}>
          signalaf.com/board/{slug}
        </div>
      </div>
    ),
    { ...size },
  )
}
