import type { NextConfig } from 'next'

// PostHog reverse proxy target. Defaults to US cloud; set NEXT_PUBLIC_POSTHOG_HOST
// to https://eu.i.posthog.com for an EU project (assets host derives automatically).
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
const POSTHOG_ASSETS = POSTHOG_HOST.includes('eu.')
  ? 'https://eu-assets.i.posthog.com'
  : 'https://us-assets.i.posthog.com'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PPR (Partial Prerendering) — lets routes with <Suspense> boundaries around
  // dynamic APIs (searchParams) keep their static shell CDN-cached while the
  // filter-driven content streams. 'incremental' = opt-in per route via Suspense;
  // routes without Suspense are unaffected. Needed for /hall + /board ISR caching.
  experimental: { ppr: 'incremental' },
  // Don't 308-redirect /ingest → /ingest/ ; PostHog ingestion paths are exact.
  skipTrailingSlashRedirect: true,
  // Analytics reverse proxy: the browser POSTs to signalaf.com/ingest (same origin)
  // and Next forwards to PostHog cloud — survives ad-blockers, no third-party domain.
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: `${POSTHOG_ASSETS}/static/:path*` },
      { source: '/ingest/:path*', destination: `${POSTHOG_HOST}/:path*` },
    ]
  },
  // Note (owner 2026-06-22): the /operators → /leaderboard + /user redirects were REMOVED
  // (owner wants a clean slate — old /operators[...] bookmarks now 404, by design). All
  // internal links already point at the new /leaderboard + /user/<codename> routes.
}

export default nextConfig
