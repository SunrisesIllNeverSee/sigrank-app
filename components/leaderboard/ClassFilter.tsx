'use client'

/**
 * components/leaderboard/ClassFilter.tsx
 *
 * Class-tier scope filter (CANON §V). Renders CLASS_FILTER as a <select>:
 * 'All Classes' plus the 9 lowercase tier ids (transmitter … igniter). The
 * lowercase `id` is used as the `classScope` board param; 'all' clears the
 * scope. Selection is driven by props from the RSC page (`searchParams`);
 * changing it pushes a `class=<id>` query param.
 */

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CLASS_FILTER } from '@/lib/constants'

interface Props {
  /** Currently-selected class scope id (lowercase, e.g. 'transmitter' or 'all'). */
  value: string
}

export function ClassFilter({ value }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === 'all') params.delete('class')
      else params.set('class', next)
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams],
  )

  return (
    <label className="flex flex-col gap-1">
      <span className="font-sans text-[10px] uppercase tracking-wider text-text-muted">
        Class
      </span>
      <select
        aria-label="Class filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-sans text-xs text-text-primary outline-none transition-colors hover:bg-bg-hover focus:border-text-accent"
      >
        {CLASS_FILTER.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}
