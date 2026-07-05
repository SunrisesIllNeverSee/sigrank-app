'use client'

/**
 * components/share/CompareShareCard.tsx — the downloadable head-to-head snapshot.
 *
 * Sibling of ProfileShareCard. Owner ask (2026-06-27): at the compare, a button to
 * download a refined A-vs-B card for socials instead of screenshotting. Same
 * approach — a real on-page element (off-screen) captured to PNG via html-to-image,
 * no server route / Satori. Style-A terminal look: two operators, each headline
 * metric shown as paired bars (A accent / B gold) with the leader's value brighter.
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

const GOLD = '#e0b240'
const A_COLOR = '#e8a0d0' // pink — matches the site's compare A
const B_COLOR = '#f0c862' // gold — matches the site's compare B

function row(label: string, av: string, bv: string, aw: number, bw: number, leader: 'a' | 'b' | 'tie') {
  // bar shares split A vs B by their portion of the combined magnitude on this axis.
  const sum = aw + bw || 1
  const aPct = Math.round((aw / sum) * 100)
  return (
    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
        <span style={{ color: leader === 'a' ? A_COLOR : '#bbbbbb', fontWeight: leader === 'a' ? 700 : 400 }}>{av}</span>
        <span style={{ color: '#888', fontSize: 15, letterSpacing: 1.2, alignSelf: 'center' }}>{label.toUpperCase()}</span>
        <span style={{ color: leader === 'b' ? B_COLOR : '#bbbbbb', fontWeight: leader === 'b' ? 700 : 400 }}>{bv}</span>
      </div>
      <div style={{ display: 'flex', width: '100%', height: 10, borderRadius: 5, overflow: 'hidden', background: '#181818' }}>
        <div style={{ width: `${aPct}%`, height: 10, background: A_COLOR, opacity: leader === 'a' ? 1 : 0.55 }} />
        <div style={{ width: `${100 - aPct}%`, height: 10, background: B_COLOR, opacity: leader === 'b' ? 1 : 0.55 }} />
      </div>
    </div>
  )
}

function Card({ cardRef, a, b }: { cardRef: React.RefObject<HTMLDivElement | null> } & Omit<CompareShareCardProps, 'href'>) {
  const leaderOf = (i: number): 'a' | 'b' | 'tie' => {
    const am = a.metrics[i],
      bm = b.metrics[i]
    if (!am || !bm || am.raw === bm.raw) return 'tie'
    return (am.higherWins ? am.raw > bm.raw : am.raw < bm.raw) ? 'a' : 'b'
  }
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
        padding: '48px 70px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 22, color: GOLD, letterSpacing: 4 }}>
        <div style={{ width: 14, height: 14, background: GOLD, transform: 'rotate(45deg)' }} />
        SIGRANK · HEAD TO HEAD
      </div>

      {/* two names */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 460 }}>
          <span style={{ fontSize: 38, fontWeight: 700, color: A_COLOR, lineHeight: 1.05 }}>{a.name}</span>
          <span style={{ fontSize: 18, color: '#888', marginTop: 4 }}>{a.signalClass}</span>
        </div>
        <span style={{ fontSize: 28, color: '#666', alignSelf: 'center' }}>vs</span>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 460, alignItems: 'flex-end' }}>
          <span style={{ fontSize: 38, fontWeight: 700, color: B_COLOR, lineHeight: 1.05, textAlign: 'right' }}>{b.name}</span>
          <span style={{ fontSize: 18, color: '#888', marginTop: 4 }}>{b.signalClass}</span>
        </div>
      </div>

      {/* metric rows */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28, flex: 1 }}>
        {a.metrics.map((m, i) => row(m.label, m.value, b.metrics[i]?.value ?? '—', m.raw, b.metrics[i]?.raw ?? 0, leaderOf(i)))}
      </div>

      {/* footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid #241d08`, paddingTop: 16, fontSize: 20 }}>
        <span style={{ color: GOLD }}>Compare yourself</span>
        <span style={{ color: '#888' }}>signalaf.com/compare</span>
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
