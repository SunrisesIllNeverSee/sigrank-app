/**
 * app/user/[codename]/opengraph-image.tsx — per-operator dynamic OG card.
 *
 * Generates a 1200×630 PNG via next/og showing the operator's codename,
 * rank, class tier, and headline yield. System font + inline styles only
 * (the subset next/og / Satori renders reliably — no remote font fetch).
 * File-convention: Next auto-injects the og:image / twitter:image meta
 * for this route segment, overriding the site-wide /og.png.
 */

import { ImageResponse } from 'next/og'
import { getOperator } from '@/lib/data'
import { decodeCodename } from '@/lib/route-params'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OperatorOG({
  params,
}: {
  params: Promise<{ codename: string }>
}) {
  const { codename: rawCodename } = await params
  const codename = decodeCodename(rawCodename)
  const row = await getOperator(codename)

  // Fallback to a generic card if the operator doesn't exist (shouldn't
  // happen in practice — the page 404s — but the OG route must not throw).
  if (!row) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px',
            background: '#0a0a0a',
            color: '#ededed',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: '-0.04em' }}>
            SigRank
          </div>
          <div style={{ fontSize: 36, opacity: 0.6, marginTop: 16 }}>
            Operator not found
          </div>
        </div>
      ),
      { ...size },
    )
  }

  const { operator, snapshot, global_rank, pending } = row
  const c = snapshot.cascade
  const yieldStr =
    c && !c.nonCompounding && c.yield_ >= 1000
      ? `${(c.yield_ / 1000).toFixed(1)}K`
      : c && !c.nonCompounding
        ? c.yield_.toFixed(0)
        : '—'
  const classTier = snapshot.class_tier
  const displayName = operator.display_name ?? operator.codename

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
        {/* Top: brand + rank */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#C4923A' }}>
            ◈ SigRank
          </div>
          {!pending && (
            <div style={{ fontSize: 48, fontWeight: 800, color: '#C4923A' }}>
              #{global_rank}
            </div>
          )}
        </div>

        {/* Middle: codename + class */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: '-0.03em' }}>
            {displayName}
          </div>
          <div style={{ fontSize: 36, opacity: 0.7 }}>
            {classTier}
            {operator.primary_domain ? ` · ${operator.primary_domain}` : ''}
          </div>
        </div>

        {/* Bottom: yield + url */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 24, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Yield
            </div>
            <div style={{ fontSize: 72, fontWeight: 800, color: '#C4923A' }}>
              {yieldStr}
            </div>
          </div>
          <div style={{ fontSize: 28, opacity: 0.4 }}>
            signalaf.com/user/{rawCodename}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
