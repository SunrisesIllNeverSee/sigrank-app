/**
 * lib/og/card.tsx — shared building blocks for the social/OG cards.
 *
 * Rendered by the three `opengraph-image.tsx` routes (rank · stats · compare)
 * via Next.js ImageResponse (Satori). Satori constraints: flexbox only, inline
 * styles, no Tailwind, no external CSS — every element below stays inside that
 * box so the JSX renders identically to a PNG at the edge.
 *
 * Style locked with owner (2026-06-27): terminal look — near-black bg, gold
 * accents, mono, a faint cascade wave along the bottom, and a bottom CTA strip
 * ("Join the board signalaf.com/user/<codename>"). One frame, three cards.
 */
import React from 'react'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

/**
 * Load Geist Mono (the site's mono face) as raw TTF bytes for Satori. Satori has
 * no default font — every ImageResponse must register the families it uses or it
 * 500s. Fetched from the Google Fonts static host at render; cached by the route's
 * own caching. Returns the `fonts` array ImageResponse expects.
 */
export async function ogFonts() {
  // JetBrains Mono from the jsDelivr fontsource mirror — a stable, CORS-open TTF
  // host. (The earlier GeistMono GitHub path 400'd.) A clean monospace face that
  // matches the terminal look; Satori needs the raw bytes, not a CSS @font-face.
  const sources = [
    'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-700-normal.ttf',
    'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.ttf',
  ]
  for (const u of sources) {
    try {
      const res = await fetch(u)
      if (res.ok) {
        const buf = await res.arrayBuffer()
        return [{ name: 'OGMono', data: buf, weight: 400 as const, style: 'normal' as const }]
      }
    } catch {
      /* try next */
    }
  }
  return undefined // ImageResponse falls back to its own default
}

const GOLD = '#e0b240'
const GOLD_HI = '#f0c862'
const INK = '#0a0a0a'
const TEXT = '#f4f4f4'
const DIM = '#888888'

/** The cascade wave that ties the card to the site hero (bottom band). */
function Wave() {
  return (
    <svg
      width={1200}
      height={200}
      viewBox="0 0 1200 200"
      style={{ position: 'absolute', left: 0, bottom: 0, opacity: 0.16 }}
    >
      <path
        d="M0,100 C200,40 400,160 600,100 C800,40 1000,160 1200,100 L1200,200 L0,200 Z"
        fill={GOLD}
      />
    </svg>
  )
}

/** The outer frame + brand mark + CTA strip every card shares. */
export function CardFrame({
  children,
  ctaCodename,
}: {
  children: React.ReactNode
  /** Codename the CTA links to (rendered as text; the link itself is the page URL). */
  ctaCodename?: string
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: INK,
        fontFamily: 'OGMono',
        color: TEXT,
        position: 'relative',
        padding: '54px 70px 0 70px',
      }}
    >
      <Wave />
      {/* brand — ASCII only so Satori never needs a dynamic-font download (the ◈
          glyph 400'd the render). A filled square reads as the mark. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, color: GOLD, letterSpacing: 4 }}>
        <div style={{ width: 16, height: 16, background: GOLD, transform: 'rotate(45deg)' }} />
        SIGRANK
      </div>
      {/* body */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
        {children}
      </div>
      {/* CTA strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid #241d08`,
          padding: '22px 0',
          fontSize: 22,
        }}
      >
        <span style={{ color: GOLD }}>Join the board</span>
        <span style={{ color: DIM }}>
          signalaf.com{ctaCodename ? `/user/${ctaCodename}` : ''}
        </span>
      </div>
    </div>
  )
}

/** A single metric bar: value, gold fill track, label. share = 0..1 of the track. */
export function MetricBar({
  value,
  label,
  share,
  width = 200,
}: {
  value: string
  label: string
  share: number
  width?: number
}) {
  const pct = Math.max(4, Math.min(100, share * 100))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width }}>
      <span style={{ fontSize: 34, color: GOLD_HI, fontWeight: 700 }}>{value}</span>
      <div style={{ display: 'flex', width: '100%', height: 12, background: '#181818', borderRadius: 6, marginTop: 10 }}>
        <div style={{ width: `${pct}%`, height: 12, borderRadius: 6, background: GOLD }} />
      </div>
      <span style={{ fontSize: 15, color: DIM, letterSpacing: 1.4, marginTop: 12 }}>{label.toUpperCase()}</span>
    </div>
  )
}

/** The class chip + identity sub-line shared by rank/stats cards. */
export function Identity({
  name,
  chip,
  sub,
}: {
  name: string
  chip?: string
  sub?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 58, color: TEXT, fontWeight: 700, maxWidth: 780, lineHeight: 1.05 }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, fontSize: 22, color: '#bbbbbb' }}>
        {chip ? (
          <span style={{ background: '#1c1708', color: GOLD, padding: '6px 16px', borderRadius: 8, fontSize: 19, border: '1px solid #3a2f10' }}>
            {chip}
          </span>
        ) : null}
        {sub ? <span>{sub}</span> : null}
      </div>
    </div>
  )
}

export { GOLD, GOLD_HI, INK, TEXT, DIM }
