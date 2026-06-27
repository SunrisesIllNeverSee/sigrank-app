/**
 * lib/seo.ts — shared SEO + Open Graph metadata helpers.
 *
 * Site-wide OG/Twitter defaults live here so every page gets a preview card
 * when shared on Twitter/Slack/Discord/iMessage. Per-page metadata calls
 * `withOG({ title, description, ... })` to layer page-specific fields on top
 * of the site defaults.
 *
 * The static OG image is /og.png (1200×630, committed to /public). Per-page
 * dynamic images were attempted with Satori and reverted (was 500ing); the
 * static image + dynamic title/description approach is simpler and reliable.
 */

import type { Metadata } from 'next'

/** Canonical production origin (no trailing slash). */
export const SITE_ORIGIN = 'https://signalaf.com'
export const SITE_NAME = 'SigRank'
export const SITE_TAGLINE =
  'Privacy-preserving leaderboard scoring AI operators on canonical token-telemetry metrics.'

/** Static OG image (1200×630 brand card). SVG works on most platforms;
 *  for max compatibility, convert to /og.png (1200×630) when a PNG is available. */
const OG_IMAGE = {
  url: '/og.svg',
  width: 1200,
  height: 630,
  alt: SITE_NAME,
}

/** Twitter card type — summary_large_image shows the full 1200×630 card. */
const TWITTER_CARD = 'summary_large_image' as const

/**
 * Build a Metadata object with site-wide OG/Twitter defaults, optionally
 * overridden by page-specific fields. The `title` and `description` are
 * duplicated into `openGraph` and `twitter` so link previews show them.
 *
 * Usage:
 *   export const metadata = withOG({
 *     title: 'Hall of Signal — SigRank',
 *     description: '...',
 *     path: '/hall',           // optional — for canonical URL
 *   })
 */
export function withOG(opts: {
  title: string
  description: string
  path?: string
  /** Override the OG image (e.g. a per-page image). Defaults to /og.png. */
  ogImage?: { url: string; width?: number; height?: number; alt?: string }
}): Metadata {
  const { title, description, path, ogImage } = opts
  const image = ogImage ?? OG_IMAGE
  const url = path ? `${SITE_ORIGIN}${path}` : SITE_ORIGIN
  return {
    title,
    description,
    alternates: path ? { canonical: path } : undefined,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: 'website',
      url,
      images: [image],
    },
    twitter: {
      card: TWITTER_CARD,
      title,
      description,
      images: [image.url],
    },
  }
}

/**
 * Site-wide default metadata (used in app/layout.tsx). Individual pages
 * override title/description via their own `metadata` or `generateMetadata`.
 * The OG/Twitter fields here are the fallback for pages that don't call
 * `withOG` — but every key page should call it for per-page titles.
 */
export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    url: SITE_ORIGIN,
    images: [OG_IMAGE],
  },
  twitter: {
    card: TWITTER_CARD,
    images: [OG_IMAGE.url],
  },
}
