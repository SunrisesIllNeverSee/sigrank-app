import Link from 'next/link'

/**
 * Draft2ActionTiles — DRAFT 2 only. The four unified action tiles
 * (Measure · Board · Compare · Info·Wiki), shared by the hero and the closing
 * CTA band so they stay identical. Server component, static.
 *
 * `shine` (owner 2026-06-22): when true, each tile gets the premium-card shine-sweep
 * (a light glint sweeping across, staggered per-tile). Used on the CTA band only —
 * the hero tiles keep just the soft glow.
 */
const TILES: { href: string; glyph: string; label: string }[] = [
  { href: '/score', glyph: 'Υ', label: 'Measure' },
  { href: '/board/all', glyph: '≣', label: 'Board' },
  { href: '/compare', glyph: '⇄', label: 'Compare' },
  { href: '/wiki', glyph: '◧', label: 'Info · Wiki' },
]

export function Draft2ActionTiles({
  className = '',
  shine = false,
}: {
  className?: string
  shine?: boolean
}) {
  return (
    <div
      className={
        'mx-auto grid w-full max-w-2xl grid-cols-2 items-stretch gap-3 sm:grid-cols-4 ' + className
      }
    >
      {TILES.map((b, i) => (
        <Link
          key={b.label}
          href={b.href}
          style={shine ? ({ ['--shine-delay' as string]: `${i * 0.7}s` }) : undefined}
          className={
            'box-glow-soft group relative flex flex-col items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-bg-border bg-bg-surface/80 px-4 py-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-bg-elevated hover:shadow-lg hover:shadow-gold/10' +
            (shine ? ' shine-sweep' : '')
          }
        >
          {/* top accent rail — lights gold on hover */}
          <span className="absolute inset-x-0 top-0 h-[2px] bg-gold/0 transition-colors group-hover:bg-gold" />
          <span className="font-mono text-4xl leading-none text-gold transition-transform duration-200 group-hover:scale-110">
            {b.glyph}
          </span>
          <span className="text-center font-mono text-sm font-semibold uppercase leading-tight tracking-[0.12em] text-text-secondary transition-colors group-hover:text-text-primary">
            {b.label}
          </span>
        </Link>
      ))}
    </div>
  )
}
