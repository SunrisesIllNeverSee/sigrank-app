/**
 * BoardWindowSwitcher — the 730 window selector (dropdown).
 *
 * Owner 2026-06-24: the row of window *pills* is replaced by a single dropdown that
 * also carries the "Everything" view (no window filter — every operator's every
 * window point). Each option navigates to its own shareable route
 * (/board/everything · /board/7d · /board/30d · /board/90d · /board/all), so the
 * windows stay tweetable/crawlable/statically rendered. Client island only for the
 * onChange → router.push; the routes themselves are unchanged.
 */
'use client'

import { useRouter } from 'next/navigation'
import { BOARD_WINDOWS } from '@/lib/data/windows'

// Theme-reactive (L-THEME): the selector sits on the board, follows the active theme.
const T = {
  field: 'rgb(var(--bg-elevated))',
  line: 'rgb(var(--bg-border))',
  ink: 'rgb(var(--text-primary))',
  gold: 'rgb(var(--gold))',
  mut: 'rgb(var(--text-muted))',
}

// Everything leads, then the four windows. label drives the option text.
const OPTIONS = [{ slug: 'everything', label: 'Everything — every window' }, ...BOARD_WINDOWS]

export function BoardWindowSwitcher({ current }: { current: string }) {
  const router = useRouter()
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          fontFamily: 'Roboto, -apple-system, system-ui, sans-serif',
        }}
      >
        <label
          htmlFor="board-window"
          style={{
            color: T.mut,
            fontSize: 11,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
          }}
        >
          View
        </label>
        <select
          id="board-window"
          value={current}
          onChange={(e) => router.push(`/board/${e.target.value}`)}
          style={{
            background: T.field,
            border: `1px solid ${T.line}`,
            color: T.ink,
            padding: '7px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '.02em',
            cursor: 'pointer',
            appearance: 'auto',
          }}
        >
          {OPTIONS.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
