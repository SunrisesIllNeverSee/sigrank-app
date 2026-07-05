import React from 'react'

/**
 * OperatorAvatar — the per-operator image slot on the leaderboard (replaces the old
 * class-colored species swatch; owner 2026-06-22: "image box they can upload, not
 * trans class colors").
 *
 * Today it renders the uploaded image when present, else a neutral initial-letter
 * placeholder (theme-token chrome, NOT a class/species color). Operators upload their
 * own image on their profile once auth/claiming ships; the board then reads `src` from
 * the profile. Until then every row shows the placeholder. Pure presentational.
 */
interface Props {
  /** Uploaded image URL (from the operator's profile); null/undefined → placeholder. */
  src?: string | null
  /** Accessible label + placeholder seed (operator codename/handle). */
  alt: string
  /** Square size in px (default 22, matching the old swatch footprint). */
  size?: number
}

export function OperatorAvatar({ src, alt, size = 22 }: Props) {
  const initial = (alt?.trim()?.[0] ?? '?').toUpperCase()
  const box: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 5,
    flex: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: 'rgb(var(--bg-elevated))',
    border: '1px solid rgb(var(--bg-border))',
    color: 'rgb(var(--text-muted))',
    fontSize: Math.round(size * 0.48),
    fontWeight: 700,
    lineHeight: 1,
  }
  if (src) {
    return (
      <span style={box}>
        {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar; sizes are tiny + fixed */}
        <img src={src} alt={alt} width={size} height={size} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </span>
    )
  }
  return (
    <span style={box} aria-label={alt} title={alt}>
      {initial}
    </span>
  )
}
