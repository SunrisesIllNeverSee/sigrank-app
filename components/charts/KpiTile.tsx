'use client'

/*
 * KpiTile — a single KPI cell for a tile row. Bone value, muted label, optional
 * gold accent (value rendered in gold, with a gold top rule).
 *
 * Locked theme tokens: bg-bg-surface · border-bg-border · text-text-primary
 * (bone) · text-text-muted · text-gold.
 */

export interface KpiTileProps {
  label: string
  value: string
  /** optional leading glyph / symbol (e.g. "Υ", "↑", "⚡"). */
  glyph?: string
  /** when true, value renders gold with a gold top accent rule. */
  accent?: boolean
}

export default function KpiTile({ label, value, glyph, accent = false }: KpiTileProps) {
  return (
    <div
      className="relative overflow-hidden rounded-md border border-bg-border bg-bg-surface px-4 py-3 font-sans"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {accent && (
        <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gold" />
      )}
      <div className="flex items-baseline gap-1.5">
        {glyph && (
          <span
            className={`text-lg leading-none ${accent ? 'text-gold' : 'text-text-muted'}`}
            aria-hidden
          >
            {glyph}
          </span>
        )}
        <span
          className={`text-2xl font-semibold leading-none ${accent ? 'text-gold' : 'text-text-primary'}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </span>
      </div>
      <div className="mt-1.5 text-xs uppercase tracking-wide text-text-muted">
        {label}
      </div>
    </div>
  )
}
