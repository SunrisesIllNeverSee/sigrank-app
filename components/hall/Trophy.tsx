import React from 'react'

/** Rank tier → metal color token. 1 = gold, 2 = silver, 3 = bronze. */
const TIER_COLOR: Record<1 | 2 | 3, string> = {
  1: 'text-rank-1',
  2: 'text-rank-2',
  3: 'text-rank-3',
}

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: '1st place',
  2: '2nd place',
  3: '3rd place',
}

interface Props {
  /** Podium tier — 1 (gold) · 2 (silver) · 3 (bronze). */
  tier: 1 | 2 | 3
}

/**
 * Trophy — a small inline trophy silhouette tinted by podium tier via the
 * existing rank metal tokens (gold/silver/bronze). Server component (no
 * interactivity). Deliberately a CUP silhouette so it stays visually distinct
 * from the geometric class glyphs (◈ ▲ ▽) used elsewhere in the same row.
 * Inherits color via currentColor; sizes to ~1em so it tracks the text it sits in.
 */
export function Trophy({ tier }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1em"
      height="1em"
      role="img"
      aria-hidden="false"
      className={TIER_COLOR[tier]}
    >
      <title>{TIER_LABEL[tier]}</title>
      {/* cup bowl + side handles */}
      <path d="M6 3h12v2a6 6 0 0 1-12 0V3Z" />
      <path d="M5 4H3v2a4 4 0 0 0 4 4V8a2 2 0 0 1-2-2V4Zm14 0h2v2a4 4 0 0 1-4 4V8a2 2 0 0 0 2-2V4Z" />
      {/* stem + base */}
      <path d="M11 10h2v5h-2v-5Zm-3 7h8v2H8v-2Zm-1 2h10v2H7v-2Z" />
    </svg>
  )
}
