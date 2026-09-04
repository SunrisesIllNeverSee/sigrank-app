import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

// PostHog reverse proxy target. Defaults to US cloud; set NEXT_PUBLIC_POSTHOG_HOST
// to https://eu.i.posthog.com for an EU project (assets host derives automatically).
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const POSTHOG_ASSETS = POSTHOG_HOST.includes("eu.")
  ? "https://eu-assets.i.posthog.com"
  : "https://us-assets.i.posthog.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't 308-redirect /ingest → /ingest/ ; PostHog ingestion paths are exact.
  skipTrailingSlashRedirect: true,
  // Include content/blog/ in serverless function file tracing so ISR
  // revalidation of /blog can read markdown files at runtime.
  outputFileTracingIncludes: {
    "/blog": ["./content/blog/**/*"],
    "/blog/[slug]": ["./content/blog/**/*"],
  },
  // Analytics reverse proxy: the browser POSTs to signalaf.com/ingest (same origin)
  // and Next forwards to PostHog cloud — survives ad-blockers, no third-party domain.
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS}/static/:path*`,
      },
      { source: "/ingest/:path*", destination: `${POSTHOG_HOST}/:path*` },
    ];
  },
  async headers() {
    return [
      // NOTE (2026-08-28): the explicit Cache-Control header for /user/:codename*
      // was REMOVED. It was overriding Vercel's native ISR edge caching, which
      // prevented revalidatePath() from busting the edge CDN cache after a
      // snapshot submit. With native ISR (revalidate=21600 on the page), Vercel
      // edge-caches the page AND respects revalidatePath — so the profile
      // updates immediately after a submission. The original header was added
      // 2026-07-24 because the page was force-dynamic (no edge caching); now
      // that the page is ISR, Vercel handles edge caching natively.
      {
        // Hall of Signal is ISR (force-static + revalidate=300). Edge-cache
        // the prerendered HTML so LCP is instant. s-maxage=300 matches the
        // revalidate window; stale-while-revalidate keeps serving during refresh.
        source: "/hall",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        // /compare is ISR (force-static + revalidate=300). The default view
        // (day-seeded pick vs the-field) is prerendered and edge-cached.
        // Each unique ?a=X&b=Y combination is SSR'd on first request then cached.
        source: "/compare",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.posthog.com https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // Dashboards use Chart.js from CDN — allow jsdelivr in script-src
        source: "/dashboards/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.vercel-scripts.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Note (owner 2026-06-22): the /operators → /leaderboard + /user redirects were REMOVED
  // (owner wants a clean slate — old /operators[...] bookmarks now 404, by design). All
  // internal links already point at the new /leaderboard + /user/<codename> routes.
  //
  // /wiki/three-degrees → /wiki/four-degrees (owner 2026-07-17: renamed after expanding
  // from 3 to 4 columns. Keep the redirect so old bookmarks + search indexes resolve.)
  //
  // /research/q1-2026 + /research/q2-2026 → /research (owner 2026-07-19: Q1/Q2 reports
  // archived, replaced by State of the Index. 301 so old bookmarks + search indexes
  // resolve to the current page instead of a 404 dead end.)
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "/developers",
        permanent: true,
      },
      {
        source: "/documentation",
        destination: "/developers",
        permanent: true,
      },
      {
        source: "/wiki/three-degrees",
        destination: "/wiki/four-degrees",
        permanent: true,
      },
      {
        source: "/research/q1-2026",
        destination: "/research",
        permanent: true,
      },
      {
        source: "/research/q2-2026",
        destination: "/research",
        permanent: true,
      },
      // External links to /blog/volume-isnt-yield sometimes append an em-dash
      // (URL-encoded as %E2%80%94), causing a 404 that PostHog recorded as a
      // 10-second LCP. Redirect to the correct slug.
      {
        source: "/blog/volume-isnt-yield%E2%80%94",
        destination: "/blog/volume-isnt-yield",
        permanent: true,
      },
      // /how-it-works is a wiki section anchor, not a standalone page. Real
      // users hit it directly (3 visitors/30d per PostHog) — redirect to the
      // wiki section instead of 404.
      {
        source: "/how-it-works",
        destination: "/wiki#how-it-works",
        permanent: true,
      },
      // /research/raw and /research/metrics were removed during the Q1/Q2
      // archive. Redirect to /research so old bookmarks resolve.
      {
        source: "/research/raw",
        destination: "/research",
        permanent: true,
      },
      {
        source: "/research/metrics",
        destination: "/research",
        permanent: true,
      },
      // /open-vs-closed is the North Star P0 route name for the open-vs-proprietary
      // boundary page. Content lives at /standard/open-vs-proprietary; redirect so
      // the P0 route resolves instead of 404.
      {
        source: "/open-vs-closed",
        destination: "/standard/open-vs-proprietary",
        permanent: true,
      },
      // The full seeded leaderboard (all operators including unclaimed seed
      // data) moved to sigeconomy.com/all-time. Redirect so old bookmarks +
      // search indexes find the seeded board.
      {
        source: "/board/seeded",
        destination: "https://sigeconomy.com/all-time",
        permanent: true,
        basePath: false,
      },
      // NS-02.04 named category pages — redirect to nearest existing equivalents
      {
        source: "/ai-operator-benchmark",
        destination: "/ai-operator-scoring",
        permanent: true,
      },
      {
        source: "/token-efficiency",
        destination: "/metrics/yield-cascade",
        permanent: true,
      },
      // /privacy-preserving-ai-telemetry is now a real page (NS-02.05 privacy portal)
      {
        source: "/ai-coding-analytics",
        destination: "/ai-coding-metrics",
        permanent: true,
      },
    ];
  },
};

export default withWorkflow(nextConfig);
