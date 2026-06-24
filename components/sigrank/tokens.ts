/*
 * Inline-style design tokens. These resolve to the SAME CSS variables that
 * Tailwind uses (app/globals.css), so components that style via JS theme-swap
 * with data-theme exactly like the Tailwind-class components. Sharp/modern:
 * no neon glows — glow tokens are intentionally `none`.
 */

const c = (name: string) => `rgb(var(--${name}))`

export const colors = {
  bg: {
    base: c('bg-base'),
    surface: c('bg-surface'),
    elevated: c('bg-elevated'),
    hover: c('bg-hover'),
    border: c('bg-border'),
    borderSubtle: c('bg-border-subtle'),
  },
  text: {
    primary: c('text-primary'),
    secondary: c('text-secondary'),
    muted: c('text-muted'),
    accent: c('accent'),
    gold: c('gold'),
    dim: c('text-dim'),
  },
  class: {
    TRANSMITTER: c('class-transmitter'),
    'ARCH+': c('class-archplus'),
    ARCH: c('class-arch'),
    POWER: c('class-power'),
    BASE: c('class-base'),
    SEEKER: c('class-seeker'),
    REFINER: c('class-refiner'),
    BEARER: c('class-bearer'),
    IGNITER: c('class-igniter'),
  },
  platform: {
    ChatGPT: c('platform-chatgpt'),
    Claude: c('platform-claude'),
    Pi: c('platform-pi'),
    Gemini: c('platform-gemini'),
  },
  rank: {
    1: c('rank-1'),
    2: c('rank-2'),
    3: c('rank-3'),
  },
  bar: {
    high: c('bar-high'),
    mid: c('bar-mid'),
    low: c('bar-low'),
  },
}

export const fonts = {
  mono: "var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace",
  sans: "var(--font-geist-sans), 'Geist', system-ui, sans-serif",
}

export const radius = {
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
}

// Sharp/modern: flat hairline cards, no neon. Glow tokens kept for API
// compatibility but resolve to no shadow.
export const shadow = {
  glow: 'none',
  glowGold: 'none',
  card: 'var(--shadow-card)',
}
