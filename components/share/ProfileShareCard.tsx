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

// ── Palette — mirrors the canonical SplitFlapCard design ────────────────────
const GOLD_BG = '#c4923a'
const INK = '#0a0a0a'
const C_GREEN = '#8ae89a'
const C_GOLD = '#f0c862'
const C_DULL = '#6e8a6e'

// Canonical measured average-AI-user operating ratio (cache-read:input:output).
// A population constant, NOT a computed field mean — do not replace it.
const AVG_RATIO = '3.5:1:0.5'

function Card({
  cardRef,
  name,
  handle,
  signalClass,
  rank,
  topPct,
  metrics,
}: { cardRef: React.RefObject<HTMLDivElement | null> } & Omit<ProfileShareCardProps, 'codename'>) {
  const upper = name.toUpperCase()
  const nameSize = upper.length <= 12 ? 42 : upper.length <= 18 ? 34 : upper.length <= 26 ? 28 : 22
  const heroValue = metrics[0]?.value ?? '—'
  const identity = [signalClass, handle ? `@${handle}` : null, topPct != null ? `TOP ${topPct.toFixed(1)}%` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      ref={cardRef}
      style={{
        width: 1200,
        height: 630,
        background: '#050605',
        fontFamily: 'var(--font-geist-mono), ui-monospace, "SF Mono", Menlo, monospace',
        display: 'flex',
        flexDirection: 'row',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ═══ LEFT — gold identity panel (SplitFlapCard header language) ═══ */}
      <div
        style={{
          width: 600,
          height: 630,
          background: GOLD_BG,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 22px',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        {/* Header zone — name+identity | § circle | Υ hero (label UNDER number) */}
        <div style={{ height: 96, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: nameSize, fontWeight: 900, color: INK, letterSpacing: 1, lineHeight: 1.05, overflow: 'hidden' }}>
              {upper}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: 0.3, whiteSpace: 'nowrap', opacity: 0.85 }}>
              {identity}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
            <span
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                border: `4px solid ${INK}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 700,
                color: INK,
                lineHeight: 1,
                boxSizing: 'border-box',
              }}
            >
              {'§'}
            </span>
            <span style={{ fontSize: 9, fontWeight: 800, color: INK, letterSpacing: 3, opacity: 0.7 }}>SIGRANK</span>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', textAlign: 'right' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontSize: 46, fontWeight: 900, color: INK, lineHeight: 1, letterSpacing: -1.5 }}>{heroValue}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: INK, letterSpacing: 1, opacity: 0.7 }}>{'Υ'} YIELD</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: 0.3, whiteSpace: 'nowrap', opacity: 0.85 }}>
              {rank != null ? `GLOBAL RANK #${rank}` : 'UNRANKED'}
            </span>
          </div>
        </div>

        {/* Divider — diamond + hairline */}
        <div style={{ height: 16, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <div style={{ width: 7, height: 7, background: INK, transform: 'rotate(45deg)', flexShrink: 0 }} />
          <div style={{ flex: 1, height: 2, background: INK, opacity: 0.2 }} />
        </div>

        {/* Headline metric meters — ink-on-gold bars */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30 }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: INK, letterSpacing: 1.4 }}>{m.label.toUpperCase()}</span>
                <span style={{ fontSize: 26, fontWeight: 900, color: INK }}>{m.value}</span>
              </div>
              <div style={{ display: 'flex', width: '100%', height: 10, background: 'rgba(10,10,10,0.12)', borderRadius: 5 }}>
                <div style={{ width: `${Math.max(4, Math.min(100, m.share * 100))}%`, height: 10, borderRadius: 5, background: INK }} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer divider + url */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 2, background: INK, opacity: 0.2 }} />
          <div style={{ width: 7, height: 7, background: INK, transform: 'rotate(45deg)' }} />
        </div>
        <div style={{ fontSize: 9, color: INK, opacity: 0.3, letterSpacing: 1 }}>signalaf.com</div>
      </div>

      {/* ═══ RIGHT — black terminal printout ═══ */}
      <div
        style={{
          width: 600,
          height: 630,
          background: INK,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* CRT scanline overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 3px)',
          }}
        />

        {/* Column header row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 28px 12px',
            borderBottom: '1px solid #2a5a2a',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.5,
            color: C_DULL,
          }}
        >
          <span style={{ color: C_GREEN, textShadow: '0 0 8px rgba(138,232,154,0.5)' }}>TELEMETRY</span>
          <span>WELCOME OPERATOR</span>
        </div>

        {/* Metric printout rows — phosphor green terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 34, padding: '0 28px' }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: C_GREEN, letterSpacing: 1, textShadow: '0 0 7px rgba(138,232,154,0.45)' }}>
                {m.label.toUpperCase()}
              </span>
              <span style={{ fontSize: 40, fontWeight: 800, color: C_GOLD, textShadow: '0 0 8px rgba(240,200,98,0.4)' }}>{m.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: C_DULL, letterSpacing: 1 }}>JOIN THE BOARD</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#a8ffa8', textShadow: '0 0 8px rgba(168,255,168,0.4)' }}>signalaf.com</span>
          </div>
        </div>

        {/* Average-user baseline footer — canonical C:I:O ratio */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 18px',
            borderTop: '1px solid #1a3a1a',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          <span style={{ color: '#5a8a5a' }}>AVERAGE USER</span>
          <span style={{ color: '#4a6a4a', fontSize: 11 }}>C:I:O</span>
          <span style={{ color: C_DULL }}>{AVG_RATIO}</span>
        </div>
      </div>
    </div>
  )
}

export function ProfileShareCard(props: ProfileShareCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)

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
      <button type="button" onClick={() => setPreview(true)} className={btn}>
        Preview
      </button>
      <button type="button" onClick={download} disabled={busy} className={btn}>
        {busy ? 'Rendering…' : 'Download card'}
      </button>

      {/* The capture target — rendered off-screen (not display:none, so it still
          lays out for html-to-image), 1200×630, scaled out of view. */}
      <div style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }} aria-hidden>
        <Card cardRef={cardRef} {...props} />
      </div>

      {/* Preview modal — shows the card scaled to fit the viewport */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(false)}
        >
          <div
            className="relative max-h-full max-w-full overflow-auto rounded-lg border border-bg-border"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="absolute right-2 top-2 z-10 rounded-md border border-bg-border bg-bg-surface px-2 py-1 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover"
            >
              Close ✕
            </button>
            <div
              style={{
                transform: 'scale(min(1, calc((100vw - 2rem) / 1200), calc((100vh - 2rem) / 630)))',
                transformOrigin: 'top left',
              }}
            >
              <Card cardRef={cardRef} {...props} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
