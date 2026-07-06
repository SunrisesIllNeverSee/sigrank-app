/**
 * app/board/[window]/og/route.tsx — per-board-window dynamic OG card.
 *
 * Next.js 15 has a known bug where opengraph-image.tsx in dynamic routes
 * 500s on Vercel (github.com/vercel/next.js/issues/57349). This route
 * handler at /board/[window]/og bypasses the file convention entirely.
 * The board page's generateMetadata links to this route via og:image.
 */

import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

const LABELS: Record<string, string> = {
  '7d': '7 day',
  '30d': '30 day',
  '90d': '90 day',
  all: 'All time',
  off: 'All-time',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ window: string }> },
) {
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
    { width: 1200, height: 630 },
  )
}
