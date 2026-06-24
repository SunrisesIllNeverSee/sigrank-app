'use client'

import React, { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  PLATFORM_UI,
  PLATFORM_DEFAULT,
  CLASS_FILTER,
  type PlatformUI,
} from '@/lib/constants'
import { BOARD_WINDOWS } from '@/lib/data/windows'

/** The Hall record-state tabs (verification / dispute lifecycle). */
export const HALL_STATE_TABS = ['Verified', 'Personal', 'Disputed', 'Delisted'] as const
export type HallStateTab = (typeof HALL_STATE_TABS)[number]

interface Props {
  /** Resolved from the page's searchParams so the selectors render the active value. */
  platform: PlatformUI
  /** Canonical 730 window slug ('7d' | '30d' | '90d' | 'all'). */
  windowSlug: string
  classScope: string
}

/** One shared label+<select> field so all three Hall filters are identical size/style.
 * URL-param driven (writes ?param=value; the RSC /hall page reads it back). Selecting the
 * `clearValue` (the "all"/default option) removes the param to keep URLs clean. */
function FilterSelect({
  label,
  param,
  value,
  clearValue,
  options,
}: {
  label: string
  param: string
  value: string
  clearValue: string
  options: { value: string; label: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === clearValue) params.delete(param)
      else params.set(param, next)
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams, param, clearValue],
  )

  return (
    <label className="flex flex-col gap-1">
      <span className="font-sans text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <select
        aria-label={`${label} filter`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // w-40 = identical width across all three so the row reads as one uniform set.
        className="w-40 rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-sans text-xs text-text-primary outline-none transition-colors hover:bg-bg-hover focus:border-text-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * HallHeader — the Hall of Signal control bar. Platform / Window / Class are now
 * three UNIFORM <select> dropdowns (owner 2026-06-21: "all supposed to be dropdowns,
 * same sizer button") — same width + style, driven by URL search params (the RSC
 * /hall page reads ?platform=/?window=/?class= and re-queries getLeaderboard).
 * (Previously platform/window reused the leaderboard's SEGMENTED button controls,
 * which didn't match the class dropdown — replaced with Hall-local uniform selects.
 * The leaderboard's segmented selectors are untouched.)
 */
export function HallHeader({ platform, windowSlug, classScope }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Filter order: Window · Class · Platform (owner 2026-06-22). */}
      <div className="flex flex-wrap items-end gap-4">
        <FilterSelect
          label="Window"
          param="window"
          value={windowSlug}
          // Hall defaults to the all-time record book → 'all' clears the param.
          clearValue="all"
          // Canonical 730 windows (same set + labels as the board): 7 day / 30 day / 90 day / All time.
          options={BOARD_WINDOWS.map((w) => ({ value: w.slug, label: w.label }))}
        />
        <FilterSelect
          label="Class"
          param="class"
          value={classScope}
          clearValue="all"
          options={CLASS_FILTER.map((c) => ({ value: c.id, label: c.label }))}
        />
        <FilterSelect
          label="Platform"
          param="platform"
          value={platform}
          clearValue={PLATFORM_DEFAULT}
          options={PLATFORM_UI.map((p) => ({ value: p, label: p }))}
        />
      </div>
    </div>
  )
}
