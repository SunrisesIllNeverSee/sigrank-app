/**
 * app/user/[codename]/opengraph-image.tsx — per-operator dynamic OG card.
 *
 * Mirrors the canonical profile card (components/signature/SplitFlapCard.tsx):
 * LEFT gold (#c4923a) identity panel — operator name + identity line, § circle
 * logo with SIGRANK, right-aligned Υ yield hero (label UNDER the number,
 * cascade string beneath), divider, two-series you-vs-field radar, footer url.
 * RIGHT black (#0a0a0a) terminal printout — TELEMETRY | WELCOME OPERATOR |
 * CASCADE | AVERAGE USER rows in phosphor green / gold / bone, OP RATIO footer
 * with the canonical 3.5:1:0.5 average-user baseline.
 *
 * Satori constraints: flexbox only (no CSS grid — the 4-column grid is
 * approximated with flex rows), inline styles, SVG for the radar. Static
 * rest-state of the animated card.
 *
 * File-convention: Next auto-injects the og:image / twitter:image meta for
 * this route segment, overriding the site-wide /og-v2.png.
 */

import { ImageResponse } from 'next/og'
import { getOperator } from '@/lib/data'
import { decodeCodename } from '@/lib/route-params'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// ── Palette (mirrors SplitFlapCard) ─────────────────────────────────────────
const GOLD_BG = '#c4923a'
const INK = '#0a0a0a'
const C_GOLD = '#f0c862'
const C_GREEN = '#8ae89a'
const C_BONE = '#e0e0d0'
const C_DIM = '#5a8a5a'
const C_DULL = '#6e8a6e'
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace'

// AVERAGE USER baseline = the measured average-AI-user operating ratio
// 3.5 : 1 : 0.5 (cache-read : input : output). This is a canonical measured
// population constant — NOT a computed field mean. Do not replace it.
const R_CR = 3.5
const R_OUT = 0.5
const AVG_RATIO = '3.5:1:0.5'

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

// ── Two-series radar (static rest-state of the card's TwoSeriesRadar) ──────
interface RadarRow { glyph: string; frac: number; avgFrac: number | null; you: string }

function radarSvg(rows: RadarRow[], svgSize: number) {
  const n = rows.length
  const cx = svgSize / 2, cy = svgSize / 2, radius = svgSize / 2 - 52
  // Satori cannot render SVG <text>; axis labels are absolutely-positioned
  // divs overlaid on the chart instead.
  const labelAt = (i: number): { left: number; top: number } => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return { left: cx + Math.cos(a) * (radius + 30), top: cy + Math.sin(a) * (radius + 26) }
  }
  const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const pt = (i: number, r: number): [number, number] => {
    const a = angleAt(i)
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  }
  const poly = (fracs: (number | null)[]) =>
    fracs
      .map((f, i) => pt(i, Math.max(0.02, f ?? 0) * radius).map((v) => v.toFixed(1)).join(','))
      .join(' ')

  return (
    <div style={{ display: 'flex', position: 'relative', width: svgSize, height: svgSize }}>
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={rows.map((_, i) => pt(i, ring * radius).map((v) => v.toFixed(1)).join(',')).join(' ')}
          fill="none"
          stroke="rgba(10,10,10,0.12)"
          strokeWidth={1}
        />
      ))}
      {rows.map((_, i) => {
        const [x, y] = pt(i, radius)
        return (
          <line key={`sp-${i}`} x1={cx} y1={cy} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="rgba(10,10,10,0.08)" strokeWidth={1} />
        )
      })}
      {/* field average — dashed faint reference */}
      <polygon
        points={poly(rows.map((r) => r.avgFrac))}
        fill="rgba(10,10,10,0.07)"
        stroke={INK}
        strokeWidth={1.5}
        strokeDasharray="5 4"
        opacity={0.5}
      />
      {/* you — solid ink */}
      <polygon points={poly(rows.map((r) => r.frac))} fill="rgba(10,10,10,0.16)" stroke={INK} strokeWidth={3} />
      {rows.map((r, i) => {
        const [x, y] = pt(i, Math.max(0.02, r.frac) * radius)
        return <circle key={`v-${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={5} fill={INK} />
      })}
    </svg>
    {rows.map((r, i) => {
      const { left, top } = labelAt(i)
      return (
        <div
          key={`lb-${i}`}
          style={{
            position: 'absolute',
            left: left - 40,
            top: top - 14,
            width: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', fontSize: 13, fontWeight: 800, color: INK }}>{r.glyph}</div>
          <div style={{ display: 'flex', fontSize: 11, fontWeight: 900, color: INK, opacity: 0.6 }}>{r.you}</div>
        </div>
      )
    })}
    </div>
  )
}

// ── Right-panel row (flex approximation of the card's 4-column grid) ───────
// Column order + weights mirror COLS = '0.6fr 1fr 1.6fr 1fr':
//   TELEMETRY (name) | WELCOME OPERATOR (value) | CASCADE (glyph) | AVERAGE USER
function printRow(
  key: string,
  name: string,
  you: string,
  glyph: string,
  avg: string,
  glyphColor: string,
) {
  return (
    <div
      key={key}
      style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0 18px',
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 24,
      }}
    >
      <div style={{ display: 'flex', width: 130, color: C_GREEN, fontSize: 16, letterSpacing: 0.5 }}>{name}</div>
      <div style={{ display: 'flex', width: 205, justifyContent: 'flex-end', color: C_DULL, fontWeight: 800 }}>{you}</div>
      <div style={{ display: 'flex', width: 220, justifyContent: 'center', paddingLeft: 24, color: glyphColor, fontWeight: 800 }}>{glyph}</div>
      <div style={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end', color: C_DULL }}>{avg}</div>
    </div>
  )
}

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
          <div style={{ display: 'flex', fontSize: 120, fontWeight: 800, letterSpacing: '-0.04em' }}>
            SigRank
          </div>
          <div style={{ display: 'flex', fontSize: 36, opacity: 0.6, marginTop: 16 }}>
            Operator not found
          </div>
        </div>
      ),
      { ...size },
    )
  }

  const { operator, snapshot, telemetry } = row
  const c = snapshot.cascade
  const ranked = c && !c.nonCompounding
  const classTier = snapshot.class_tier
  const name = (operator.display_name ?? operator.codename).toUpperCase()

  const DASH = '—'
  const yieldStr = ranked ? (c.yield_ >= 1000 ? `${(c.yield_ / 1000).toFixed(1)}K` : c.yield_.toFixed(0)) : DASH
  const snrStr = ranked ? `${(c.snr * 100).toFixed(0)}%` : DASH
  const levStr = ranked ? `${c.leverage.toFixed(0)}x` : DASH
  const velStr = ranked ? c.velocity.toFixed(1) : DASH
  const devStr = ranked && c.dev10x != null ? c.dev10x.toFixed(2) : DASH
  const scaleStr = ranked ? c.scaleV.toFixed(2) : DASH
  const effStr = ranked ? `${c.efficiency.toFixed(1)}x` : DASH
  const costStr = ranked && c.costPerMillion != null ? `$${c.costPerMillion.toFixed(2)}` : DASH
  const opStr = (ranked && c.opRatio) || DASH
  const cascadeStr = (ranked && c.cascadeStr) || DASH

  const inputT = telemetry?.fresh_input ?? null
  const outputT = telemetry?.output ?? null
  const cacheR = telemetry?.cache_read ?? null
  const cacheW = telemetry?.cache_create ?? null
  const totalT = inputT != null && outputT != null && cacheR != null && cacheW != null ? inputT + outputT + cacheR + cacheW : null

  // AVERAGE USER token column — anchored on the operator's input, split by the
  // canonical 3.5 : 1 : 0.5 average-user ratio (cache-read : input : output).
  const avgIn = inputT
  const avgOut = avgIn != null ? avgIn * R_OUT : null
  const avgCache = avgIn != null ? avgIn * R_CR : null
  const avgTotal = avgIn != null ? avgIn * (1 + R_OUT + R_CR) : null
  const DOT = '·'
  const avgFmt = (n: number | null) => (n != null ? fmtTokens(n) : DOT)
  const avgScl = avgTotal != null && avgTotal > 0 ? Math.log10(avgTotal).toFixed(2) : DOT

  // ── Radar rows — same per-axis log calibration as SplitFlapCard, with the
  // component's legacy average-operator references (fieldAvg fallbacks).
  const radarRows: RadarRow[] = ranked
    ? [
        { glyph: 'SNR', youV: c.snr, avgV: 0.33, you: snrStr },
        { glyph: 'VEL', youV: c.velocity, avgV: 0.5, you: velStr },
        { glyph: 'LEV', youV: c.leverage, avgV: 3.2, you: levStr },
        { glyph: '10X', youV: c.dev10x ?? 0, avgV: 0.5, you: devStr },
        { glyph: 'SCL', youV: c.scaleV, avgV: null, you: scaleStr },
        { glyph: 'EFF', youV: c.efficiency, avgV: 1.0, you: effStr },
      ].map(({ glyph, youV, avgV, you }) => {
        const axisMax = Math.max(youV ?? 0, avgV ?? 0, 1e-9) * 1.25
        const logN = (v: number) => Math.log1p(Math.max(0, v)) / Math.log1p(axisMax)
        return {
          glyph,
          you,
          frac: Math.max(0.02, Math.min(1, logN(youV ?? 0))),
          avgFrac: avgV != null ? Math.max(0.02, Math.min(1, logN(avgV))) : null,
        }
      })
    : []

  // name | value | glyph | avg — raw token rows + derived cascade rows,
  // matching the card's printout order. Derived AVG references are the card's
  // fixed baselines (not field means).
  const rawLines: [string, string, string, string, string][] = [
    ['INPUT', inputT != null ? fmtTokens(inputT) : DASH, 'IN', avgFmt(avgIn), C_BONE],
    ['OUTPUT', outputT != null ? fmtTokens(outputT) : DASH, 'OUT', avgFmt(avgOut), C_GREEN],
    ['CACHE R', cacheR != null ? fmtTokens(cacheR) : DASH, 'CR', avgFmt(avgCache), C_GREEN],
    ['CACHE W', cacheW != null ? fmtTokens(cacheW) : DASH, 'CW', avgIn != null ? '0' : DOT, C_BONE],
    ['TOTAL', totalT != null ? fmtTokens(totalT) : DASH, 'TOT', avgFmt(avgTotal), C_DIM],
  ]
  const derivedLines: [string, string, string, string, string][] = [
    ['YIELD', yieldStr, 'Υ', '1.57', C_GOLD],
    ['SNR', snrStr, 'SNR', '33%', C_GREEN],
    ['LEVERAGE', levStr, 'LEV', '3.2x', C_GREEN],
    ['VELOCITY', velStr, 'VEL', '0.50', C_BONE],
    ['10X DEV', devStr, '10X', '0.50', C_GOLD],
    ['SCALE V', scaleStr, 'SCL', avgScl, C_BONE],
    ['EFFICIENCY', effStr, 'EFF', '1.0x', C_GREEN],
    ['COST/1M', costStr, '$', '$2.31', C_DIM],
  ]

  const nameSize = name.length <= 12 ? 42 : name.length <= 18 ? 34 : name.length <= 26 ? 28 : 22

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          background: '#050605',
          fontFamily: MONO,
        }}
      >
        {/* ═══ LEFT — gold identity panel ═══ */}
        <div
          style={{
            width: 600,
            height: 630,
            background: GOLD_BG,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 22px',
          }}
        >
          {/* Header zone — fixed 96px: name+identity | § circle | Υ hero */}
          <div style={{ height: 96, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch' }}>
            <div style={{ flexGrow: 1, flexBasis: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', fontSize: nameSize, fontWeight: 900, color: INK, letterSpacing: 1, lineHeight: 1.05, overflow: 'hidden' }}>
                {name}
              </div>
              <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: INK, opacity: 0.85 }}>
                {`${classTier} · ${(operator.primary_domain ?? DASH).toUpperCase()} · ${opStr}`}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 12px' }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  border: `4px solid ${INK}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  fontWeight: 700,
                  color: INK,
                }}
              >
                {'§'}
              </div>
              <div style={{ display: 'flex', fontSize: 9, fontWeight: 800, color: INK, letterSpacing: 3, opacity: 0.7, marginTop: 4 }}>SIGRANK</div>
            </div>
            <div style={{ flexGrow: 1, flexBasis: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', fontSize: 46, fontWeight: 900, color: INK, lineHeight: 1, letterSpacing: -1.5 }}>{yieldStr}</div>
                <div style={{ display: 'flex', fontSize: 11, fontWeight: 800, color: INK, letterSpacing: 1, opacity: 0.7, marginTop: 2 }}>{'Υ YIELD'}</div>
              </div>
              <div style={{ display: 'flex', fontSize: 11, fontWeight: 700, color: INK, opacity: 0.85 }}>{cascadeStr}</div>
            </div>
          </div>

          {/* Divider — diamond + hairline */}
          <div style={{ height: 16, display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <div style={{ display: 'flex', width: 7, height: 7, background: INK, transform: 'rotate(45deg)' }} />
            <div style={{ display: 'flex', flexGrow: 1, height: 2, background: INK, opacity: 0.2, marginLeft: 6 }} />
          </div>

          {/* Two-series radar — you (solid ink) vs the average operator (dashed) */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {radarRows.length >= 3 ? (
              radarSvg(radarRows, 430)
            ) : (
              <div style={{ display: 'flex', fontSize: 28, fontWeight: 800, color: INK, opacity: 0.6 }}>NO CASCADE DATA YET</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', fontSize: 10, fontWeight: 700, color: INK, letterSpacing: 1 }}>
              <div style={{ display: 'flex', width: 16, height: 3, background: INK, marginRight: 5 }} />
              <div style={{ display: 'flex', marginRight: 18 }}>YOU</div>
              <div style={{ display: 'flex', width: 16, height: 0, borderTop: `2px dashed ${INK}`, marginRight: 5, opacity: 0.55 }} />
              <div style={{ display: 'flex', opacity: 0.55 }}>FIELD AVG</div>
            </div>
          </div>

          {/* Footer divider + url */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', flexGrow: 1, height: 2, background: INK, opacity: 0.2, marginRight: 6 }} />
            <div style={{ display: 'flex', width: 7, height: 7, background: INK, transform: 'rotate(45deg)' }} />
          </div>
          <div style={{ display: 'flex', fontSize: 9, color: INK, opacity: 0.3, letterSpacing: 1 }}>
            signalaf.com/user/{operator.codename}
          </div>
        </div>

        {/* ═══ RIGHT — black terminal printout ═══ */}
        <div
          style={{
            width: 600,
            height: 630,
            background: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Column header row — TELEMETRY | WELCOME OPERATOR | CASCADE | AVERAGE USER */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '14px 28px 12px',
              borderBottom: '1px solid #2a5a2a',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: C_DULL,
              fontFamily: MONO,
            }}
          >
            <div style={{ display: 'flex', width: 120, color: C_GREEN }}>TELEMETRY</div>
            <div style={{ display: 'flex', width: 195, justifyContent: 'flex-end' }}>WELCOME OPERATOR</div>
            <div style={{ display: 'flex', width: 200, justifyContent: 'center', paddingLeft: 24, color: C_GREEN }}>CASCADE</div>
            <div style={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end' }}>AVERAGE USER</div>
          </div>

          {rawLines.map(([label, you, glyph, avg, color]) => printRow(`raw-${glyph}`, label, you, glyph, avg, color))}
          {derivedLines.map(([label, you, glyph, avg, color]) => printRow(`der-${glyph}`, label, you, glyph, avg, color))}

          {/* Operating-ratio footer — OP RATIO | value | C:I:O | 3.5:1:0.5 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '10px 18px',
              borderTop: '1px solid #1a3a1a',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 0.5,
              fontFamily: MONO,
            }}
          >
            <div style={{ display: 'flex', width: 130, color: C_DIM }}>OP RATIO</div>
            <div style={{ display: 'flex', width: 205, justifyContent: 'flex-end', color: '#a8ffa8', fontWeight: 800 }}>{opStr}</div>
            <div style={{ display: 'flex', width: 220, justifyContent: 'center', paddingLeft: 24, color: '#4a6a4a', fontSize: 11 }}>C:I:O</div>
            <div style={{ display: 'flex', flexGrow: 1, justifyContent: 'flex-end', color: C_DULL }}>{AVG_RATIO}</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
