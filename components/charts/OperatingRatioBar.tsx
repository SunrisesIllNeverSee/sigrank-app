'use client'

/*
 * OperatingRatioBar — horizontal stacked bar of cache:input:output composition
 * (the "operating ratio"). Species-tinted segments + legend.
 *
 * Pure inline SVG. Locked theme tokens for chrome; species hex for segments:
 *   cascade #8b5cf6  arch #3b82f6  power #e0a64a  base/thru #5b6472
 */

export interface OperatingRatioBarProps {
  cacheRead: number
  input: number
  output: number
  cacheCreate: number
  /** Bar height in px. Default 26. */
  height?: number
}

const SPECIES = {
  cascade: '#8b5cf6',
  arch: '#3b82f6',
  power: '#e0a64a',
  thru: '#5b6472',
} as const

interface Seg {
  key: string
  label: string
  value: number
  color: string
}

function fmt(n: number): string {
  if (!isFinite(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${Math.round(n)}`
}

export default function OperatingRatioBar({
  cacheRead,
  input,
  output,
  cacheCreate,
  height = 26,
}: OperatingRatioBarProps) {
  const segs: Seg[] = [
    { key: 'cacheRead', label: 'Cache read', value: Math.max(0, cacheRead), color: SPECIES.cascade },
    { key: 'cacheCreate', label: 'Cache create', value: Math.max(0, cacheCreate), color: SPECIES.arch },
    { key: 'input', label: 'Input', value: Math.max(0, input), color: SPECIES.thru },
    { key: 'output', label: 'Output', value: Math.max(0, output), color: SPECIES.power },
  ]
  const total = segs.reduce((s, x) => s + x.value, 0)

  return (
    <div className="font-sans" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {/* stacked bar */}
      <div
        className="flex w-full overflow-hidden rounded-sm border border-bg-border"
        style={{ height }}
        role="img"
        aria-label="Operating ratio: cache, input, output composition"
      >
        {total <= 0 ? (
          <div className="flex w-full items-center justify-center bg-bg-surface text-xs text-text-muted">
            no usage
          </div>
        ) : (
          segs.map((s) =>
            s.value > 0 ? (
              <div
                key={s.key}
                title={`${s.label}: ${fmt(s.value)} (${((s.value / total) * 100).toFixed(1)}%)`}
                style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
              />
            ) : null,
          )
        )}
      </div>

      {/* legend */}
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segs.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="inline-block h-2.5 w-2.5 rounded-[2px]"
              style={{ background: s.color }}
              aria-hidden
            />
            <span className="text-text-muted">{s.label}</span>
            <span className="text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmt(s.value)}
            </span>
            {total > 0 && (
              <span className="text-text-dim" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {((s.value / total) * 100).toFixed(0)}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
