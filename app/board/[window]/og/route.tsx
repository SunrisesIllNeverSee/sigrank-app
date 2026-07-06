/**
 * app/board/[window]/og/route.tsx — per-board-window dynamic OG card.
 *
 * Next.js 15 has a known bug where opengraph-image.tsx in dynamic routes
 * 500s on Vercel (github.com/vercel/next.js/issues/57349). This route
 * handler at /board/[window]/og bypasses the file convention entirely.
 * The board page's generateMetadata links to this route via og:image.
 */

import { ImageResponse } from 'next/og'
import { getLeaderboard } from '@/lib/data'
import { toEntry } from '@/lib/leaderboard/to-entry'
import { boardWindowBySlug } from '@/lib/data/windows'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const LABELS: Record<string, string> = {
  '7d': '7 day',
  '30d': '30 day',
  '90d': '90 day',
  all: 'All time',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ window: string }> },
) {
  const { window: slug } = await params
  const win = boardWindowBySlug(slug)
  const label = win?.label ?? LABELS[slug] ?? 'Leaderboard'

  let top3: { codename: string; rank: number; anonId: string; signalClass: string }[] = []
  try {
    const rows = await getLeaderboard(win ? { window: win.enum } : {})
    top3 = rows.slice(0, 3).map(toEntry).map((e) => ({
      codename: e.codename ?? '—',
      rank: e.rank ?? 0,
      anonId: e.anonId ?? e.codename ?? '—',
      signalClass: e.signalClass ?? '—',
    }))
  } catch {
    // Data layer failed — render static fallback.
  }

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Leaderboard
          </div>
          {top3.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {top3.map((e) => (
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
        <div style={{ fontSize: 28, opacity: 0.4 }}>
          signalaf.com/board/{slug}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
