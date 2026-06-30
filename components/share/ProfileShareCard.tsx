'use client'

/**
 * components/share/ProfileShareCard.tsx — the downloadable profile snapshot.
 *
 * Owner ask (2026-06-27): a refined card a user can DOWNLOAD and post to socials
 * themselves — instead of taking a half-screenshot. NOT an OG/link-preview image
 * (that path was overbuilt + reverted); this is a real on-page element captured
 * to PNG client-side via html-to-image. No server route, no Satori, no fonts to
 * fetch — what you see is what downloads.
 *
 * Two affordances:
 *   - Share  → copies the profile link to the clipboard ("Copied ✓").
 *   - Download card → renders the Style-A card to a PNG and saves it.
 *
 * The card itself (the `Card` below) is the terminal-look design owner approved:
 * near-black, gold accents, #rank, class chip, a mini bar chart of the headline
 * metrics, and a "signalaf.com" footer. It lives in the DOM (off to the side,
 * fixed 1200×630) so html-to-image can capture it at full fidelity.
 */

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { track } from '@/lib/posthog/events'

export interface ProfileShareCardProps {
  codename: string
  name: string
  handle: string | null | undefined
  signalClass: string
  rank: number | null
  topPct: number | null
  /** Headline metrics already formatted + with a 0..1 share for the bar fill. */
  metrics: { label: string; value: string; share: number }[]
}

const GOLD = '#e0b240'
const GOLD_HI = '#f0c862'

function Card({
  cardRef,
  name,
  handle,
  signalClass,
  rank,
  topPct,
  metrics,
}: { cardRef: React.RefObject<HTMLDivElement | null> } & Omit<ProfileShareCardProps, 'codename'>) {
  return (
    <div
      ref={cardRef}
      style={{
        width: 1200,
        height: 630,
        background: '#0a0a0a',
        color: '#f4f4f4',
        fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
        display: 'flex',
        flexDirection: 'column',
        padding: '54px 70px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* cascade wave backdrop */}
      <svg width={1200} height={200} viewBox="0 0 1200 200" style={{ position: 'absolute', left: 0, bottom: 0, opacity: 0.16 }}>
        <path d="M0,100 C200,40 400,160 600,100 C800,40 1000,160 1200,100 L1200,200 L0,200 Z" fill={GOLD} />
      </svg>

      {/* brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, color: GOLD, letterSpacing: 4 }}>
        <div style={{ width: 16, height: 16, background: GOLD, transform: 'rotate(45deg)' }} />
        SIGRANK
      </div>

      {/* identity + rank */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 34 }}>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.05 }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, fontSize: 22, color: '#bbbbbb' }}>
            <span style={{ background: '#1c1708', color: GOLD, padding: '6px 16px', borderRadius: 8, fontSize: 19, border: `1px solid #3a2f10` }}>
              {signalClass}
            </span>
            <span>{[handle ? `@${handle}` : null, topPct != null ? `Top ${topPct.toFixed(1)}%` : null].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
        {rank != null ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 92, color: GOLD, fontWeight: 800, lineHeight: 0.9 }}>#{rank}</div>
            <div style={{ fontSize: 15, color: '#888', letterSpacing: 2.4, marginTop: 6 }}>GLOBAL RANK</div>
          </div>
        ) : (
          <div style={{ fontSize: 22, color: '#888' }}>not ranked yet</div>
        )}
      </div>

      {/* metric bars */}
      <div style={{ display: 'flex', gap: 34, marginTop: 'auto', marginBottom: 26 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ display: 'flex', flexDirection: 'column', width: 200 }}>
            <span style={{ fontSize: 34, color: GOLD_HI, fontWeight: 700 }}>{m.value}</span>
            <div style={{ display: 'flex', width: '100%', height: 12, background: '#181818', borderRadius: 6, marginTop: 10 }}>
              <div style={{ width: `${Math.max(4, Math.min(100, m.share * 100))}%`, height: 12, borderRadius: 6, background: GOLD }} />
            </div>
            <span style={{ fontSize: 15, color: '#888', letterSpacing: 1.4, marginTop: 12 }}>{m.label.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid #241d08`, paddingTop: 20, fontSize: 22 }}>
        <span style={{ color: GOLD }}>Join the board</span>
        <span style={{ color: '#888' }}>signalaf.com</span>
      </div>
    </div>
  )
}

export function ProfileShareCard(props: ProfileShareCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const shareLink = async () => {
    const url = `https://signalaf.com/user/${props.codename}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      track.profileShared('copy', { codename: props.codename })
    } catch {
      /* clipboard blocked — no-op; the URL is in the address bar anyway */
    }
  }

  const download = async () => {
    if (!cardRef.current) return
    setBusy(true)
    try {
      const dataUrl = await toPng(cardRef.current, { width: 1200, height: 630, pixelRatio: 2, cacheBust: true })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `sigrank-${props.codename}.png`
      a.click()
      track.profileShared('download', { codename: props.codename })
    } finally {
      setBusy(false)
    }
  }

  const btn =
    'rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover hover:border-gold/50 disabled:opacity-50'

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={shareLink} className={btn}>
        {copied ? 'Copied ✓' : 'Share'}
      </button>
      <button type="button" onClick={download} disabled={busy} className={btn}>
        {busy ? 'Rendering…' : 'Download card'}
      </button>

      {/* The capture target — rendered off-screen (not display:none, so it still
          lays out for html-to-image), 1200×630, scaled out of view. */}
      <div style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }} aria-hidden>
        <Card cardRef={cardRef} {...props} />
      </div>
    </div>
  )
}
