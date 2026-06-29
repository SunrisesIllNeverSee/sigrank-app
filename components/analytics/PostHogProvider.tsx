'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, posthog } from '@/lib/posthog/client'

/**
 * Client island that boots PostHog and emits manual SPA pageviews. The root
 * layout stays a server component; this wraps the body content so every route
 * change is captured and `posthog` is available to downstream client components.
 * Everything no-ops when NEXT_PUBLIC_POSTHOG_KEY is unset.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  return (
    <>
      {children}
      {/* useSearchParams() needs a Suspense boundary to avoid de-opting the whole
          tree to client rendering / failing static generation in Next App Router. */}
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  )
}

function PageViews() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Child effects run before the parent's init effect on first mount, so ensure
    // init here too (idempotent) — otherwise the very first pageview would be lost.
    initPostHog()
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    posthog.capture('$pageview', { $current_url: window.location.href })
  }, [pathname, searchParams])

  return null
}
