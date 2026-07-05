'use client'

/**
 * components/share/CompareShareCard.tsx — the downloadable head-to-head snapshot.
 *
 * Sibling of ProfileShareCard. Owner ask (2026-06-27): at the compare, a button to
 * download a refined A-vs-B card for socials instead of screenshotting. Same
 * approach — a real on-page element (off-screen) captured to PNG via html-to-image,
 * no server route / Satori.
 *
 * Design matches ProfileShareCard: two-panel 1200×630 — gold identity panel on the
 * left (A vs B names, classes, § marks, diverging metric bars) + black terminal
 * panel on the right (CRT scanlines, phosphor green, paired metric readout with
 * leader highlighted). Same palette, same fonts, same footer language.
 */

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { track } from '@/lib/posthog/events'

export interface CompareOperand {
  name: string
  signalClass: string
  /** Per-metric raw values, same order/labels as the other operand. */
  metrics: { label: string; value: string; raw: number; higherWins: boolean }[]
}

export interface CompareShareCardProps {
  a: CompareOperand
  b: CompareOperand
  /** URL slug for the shared link (?a=&b=). */
  href: string
}

// ── Palette — mirrors ProfileShareCard exactly ──────────────────────────────
const GOLD_BG = '#c4923a'
const INK = '#0a0a0a'
const C_GREEN = '#8ae89a'
const C_GOLD = '#f0c862'
const C_DULL = '#6e8a6e'
const A_COLOR = '#e8a0d0' // pink — matches the site's compare A
const B_COLOR = '#f0c862' // gold — matches the site's compare B

function Card({ cardRef, a, b }: { cardRef: React.RefObject<HTMLDivElement | null> } & Omit<CompareShareCardProps, 'href'>) {
  const leaderOf = (i: number): 'a' | 'b' | 'tie' => {
    const am = a.metrics[i],
      bm = b.metrics[i]
    if (!am || !bm || am.raw === bm.raw) return 'tie'
    return (am.higherWins ? am.raw > bm.raw : am.raw < bm.raw) ? 'a' : 'b'
  }

  const aUpper = a.name.toUpperCase()
  const bUpper = b.name.toUpperCase()
  const aNameSize = aUpper.length <= 12 ? 34 : aUpper.length <= 18 ? 28 : aUpper.length <= 26 ? 24 : 20
  const bNameSize = bUpper.length <= 12 ? 34 : bUpper.length <= 18 ? 28 : bUpper.length <= 26 ? 24 : 20

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
      {/* ═══ LEFT — gold identity panel (ProfileShareCard header language) ═══ */}
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
        {/* Header zone — A name+class | § VS § | B name+class */}
        <div style={{ height: 96, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: 10 }}>
          {/* A identity */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: aNameSize, fontWeight: 900, color: INK, letterSpacing: 0.5, lineHeight: 1.05, overflow: 'hidden' }}>
              {aUpper}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: 0.3, whiteSpace: 'nowrap', opacity: 0.85 }}>
              {a.signalClass}
            </span>
          </div>
          {/* § VS § center */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
            <span
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: `3px solid ${INK}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
                color: INK,
                lineHeight: 1,
                boxSizing: 'border-box',
              }}
            >
              {'§'}
            </span>
            <span style={{ fontSize: 14, fontWeight: 900, color: INK, letterSpacing: 2 }}>VS</span>
            <span
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: `3px solid ${INK}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 900,
                color: INK,
                lineHeight: 1,
                boxSizing: 'border-box',
              }}
            >
              {'§'}
            </span>
          </div>
          {/* B identity */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', textAlign: 'right' }}>
            <div style={{ fontSize: bNameSize, fontWeight: 900, color: INK, letterSpacing: 0.5, lineHeight: 1.05, overflow: 'hidden', textAlign: 'right' }}>
              {bUpper}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: 0.3, whiteSpace: 'nowrap', opacity: 0.85 }}>
              {b.signalClass}
            </span>
          </div>
        </div>

        {/* Divider — diamond + hairline */}
        <div style={{ height: 16, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <div style={{ width: 7, height: 7, background: INK, transform: 'rotate(45deg)', flexShrink: 0 }} />
          <div style={{ flex: 1, height: 2, background: INK, opacity: 0.2 }} />
        </div>

        {/* Diverging metric bars — A left / B right, leader brighter */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
          {a.metrics.map((m, i) => {
            const leader = leaderOf(i)
            const bv = b.metrics[i]?.value ?? '—'
            const aw = m.raw
            const bw = b.metrics[i]?.raw ?? 0
            const sum = aw + bw || 1
            const aPct = Math.round((aw / sum) * 100)
            return (
              <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: leader === 'a' ? INK : 'rgba(10,10,10,0.5)' }}>{m.value}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: INK, letterSpacing: 1.2, opacity: 0.7 }}>{m.label.toUpperCase()}</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: leader === 'b' ? INK : 'rgba(10,10,10,0.5)' }}>{bv}</span>
                </div>
                <div style={{ display: 'flex', width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', background: 'rgba(10,10,10,0.12)' }}>
                  <div style={{ width: `${aPct}%`, height: 8, background: INK, opacity: leader === 'a' ? 1 : 0.4 }} />
                  <div style={{ width: `${100 - aPct}%`, height: 8, background: INK, opacity: leader === 'b' ? 1 : 0.4 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer divider + url */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 2, background: INK, opacity: 0.2 }} />
          <div style={{ width: 7, height: 7, background: INK, transform: 'rotate(45deg)' }} />
        </div>
        <div style={{ fontSize: 9, color: INK, opacity: 0.3, letterSpacing: 1 }}>signalaf.com/compare</div>
      </div>

      {/* ═══ RIGHT — black terminal printout (ProfileShareCard right panel) ═══ */}
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
          <span style={{ color: C_GREEN, textShadow: '0 0 8px rgba(138,232,154,0.5)' }}>HEAD TO HEAD</span>
          <span>OPERATOR COMPARISON</span>
        </div>

        {/* Metric printout rows — A value | label | B value, leader glows */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28, padding: '0 28px' }}>
          {a.metrics.map((m, i) => {
            const leader = leaderOf(i)
            const bv = b.metrics[i]?.value ?? '—'
            return (
              <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: leader === 'a' ? A_COLOR : '#666',
                    textShadow: leader === 'a' ? `0 0 8px rgba(232,160,208,0.5)` : 'none',
                  }}
                >
                  {m.value}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: C_DULL, letterSpacing: 1.2 }}>{m.label.toUpperCase()}</span>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: leader === 'b' ? C_GOLD : '#666',
                    textShadow: leader === 'b' ? `0 0 8px rgba(240,200,98,0.5)` : 'none',
                  }}
                >
                  {bv}
                </span>
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: C_DULL, letterSpacing: 1 }}>COMPARE YOURSELF</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#a8ffa8', textShadow: '0 0 8px rgba(168,255,168,0.4)' }}>signalaf.com</span>
          </div>
        </div>

        {/* Footer — A color vs B color legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 18px',
            borderTop: '1px solid #1a3a1a',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          <span style={{ color: A_COLOR }}>{a.name.toUpperCase()}</span>
          <span style={{ color: '#4a6a4a', fontSize: 11 }}>LEADER GLOWS</span>
          <span style={{ color: C_GOLD }}>{b.name.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

export function CompareShareCard({ a, b, href }: CompareShareCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)

  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://signalaf.com${href}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      track.compareShared('copy', { href })
    } catch {
      /* clipboard blocked */
    }
  }

  const download = async () => {
    if (!cardRef.current) return
    setBusy(true)
    try {
      const dataUrl = await toPng(cardRef.current, { width: 1200, height: 630, pixelRatio: 2, cacheBust: true })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `sigrank-compare.png`
      link.click()
      track.compareShared('download')
    } finally {
      setBusy(false)
    }
  }

  const btn =
    'rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover hover:border-gold/50 disabled:opacity-50'

  return (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={shareLink} className={btn}>
        {copied ? 'Copied ✓' : 'Share matchup'}
      </button>
      <button type="button" onClick={() => setPreview(true)} className={btn}>
        Preview
      </button>
      <button type="button" onClick={download} disabled={busy} className={btn}>
        {busy ? 'Rendering…' : 'Download card'}
      </button>

      <div style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }} aria-hidden>
        <Card cardRef={cardRef} a={a} b={b} />
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
              <Card cardRef={cardRef} a={a} b={b} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
