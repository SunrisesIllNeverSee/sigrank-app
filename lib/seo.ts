/**
 * lib/seo.ts — shared SEO + Open Graph metadata helpers.
 *
 * Site-wide OG/Twitter defaults live here so every page gets a preview card
 * when shared on Twitter/Slack/Discord/iMessage. Per-page metadata calls
 * `withOG({ title, description, ... })` to layer page-specific fields on top
 * of the site defaults.
 *
 * The static OG image is /og-v2.png (1200×630, committed to /public). Per-page
 * dynamic images were attempted with Satori and reverted (was 500ing); the
 * static image + dynamic title/description approach is simpler and reliable.
 */

import type { Metadata } from "next";

/** Canonical production origin (no trailing slash).
 *  Env-configurable so the same codebase can deploy to signalaf.com or
 *  sigeconomy.com. Defaults to signalaf.com for backward compatibility. */
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://signalaf.com").replace(/\/$/, "");
export const SITE_NAME = "SigRank SignalAF";
/** Byline used for article:author on posts and reports. */
export const AUTHOR_NAME = "Deric J. McHenry";
export const SITE_TAGLINE =
  "The evaluation platform for AI operators. Models are benchmarked constantly. The people operating them are not. SigRank turns privacy-preserving token telemetry into a repeatable performance evaluation: your Yield, workflow signature, benchmark, and progress over time.";

/** Static OG image (1200×630 brand card). MUST be a raster PNG/JPG — X, LinkedIn,
 *  Facebook, iMessage, Slack, and Discord all reject SVG for link-preview cards, so
 *  an SVG og:image renders blank everywhere. /og-v2.png is generated from /og-v2.svg
 *  (rsvg-convert -w 1200 -h 630). Keep the .png as the og:image source of truth.
 *  NOTE: versioned filename (og-v2) busts the GitHub/social OG cache — bump the suffix
 *  when the image changes so platforms re-fetch instead of serving a stale preview. */
const OG_IMAGE = {
  url: "/og-v2.png",
  width: 1200,
  height: 630,
  alt: SITE_NAME,
};

/** Twitter card type — summary_large_image shows the full 1200×630 card. */
const TWITTER_CARD = "summary_large_image" as const;

/**
 * Build a Metadata object with site-wide OG/Twitter defaults, optionally
 * overridden by page-specific fields. The `title` and `description` are
 * duplicated into `openGraph` and `twitter` so link previews show them.
 *
 * Usage:
 *   export const metadata = withOG({
 *     title: 'Hall of Signal',  // template appends ' · SignalAF'
 *     description: '...',
 *     path: '/hall',           // optional — for canonical URL
 *   })
 */
export function withOG(opts: {
  title: string;
  description: string;
  path?: string;
  /** Override the OG image (e.g. a per-page image). Defaults to /og-v2.png. */
  ogImage?: { url: string; width?: number; height?: number; alt?: string };
  /** Emit og:type=article with article:* fields (posts, research reports).
   *  Dates must be real (git history / frontmatter), never request-time. */
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    authors?: string[];
    section?: string;
    tags?: string[];
  };
  /** Exact <title> override (skips the " · SigRank SignalAF" template) —
   *  see fitTitle(). OG/Twitter titles keep `title`. */
  titleAbsolute?: string;
}): Metadata {
  const { title, description, path, ogImage, article, titleAbsolute } = opts;
  const image = ogImage ?? OG_IMAGE;
  const url = path ? `${SITE_ORIGIN}${path}` : SITE_ORIGIN;
  const base = {
    title,
    description,
    siteName: SITE_NAME,
    url,
    images: [image],
  };
  return {
    title: titleAbsolute ? { absolute: titleAbsolute } : title,
    description,
    alternates: path ? { canonical: path } : undefined,
    openGraph: article
      ? {
          ...base,
          type: "article",
          publishedTime: article.publishedTime,
          modifiedTime: article.modifiedTime ?? article.publishedTime,
          authors: article.authors ?? [AUTHOR_NAME],
          ...(article.section ? { section: article.section } : {}),
          ...(article.tags && article.tags.length ? { tags: article.tags } : {}),
        }
      : { ...base, type: "website" },
    twitter: {
      card: TWITTER_CARD,
      title,
      description,
      images: [image.url],
    },
  };
}

/** SERP-friendly title budget (chars) for the full <title>. */
export const TITLE_BUDGET = 60;

/** If `${title} · SigRank SignalAF` exceeds the budget, return an absolute
 *  title with the short brand (" · SignalAF"), or the bare title if even that
 *  is too long. Returns undefined when the default template already fits.
 *  Pass the result as withOG({ titleAbsolute }). */
export function fitTitle(title: string): string | undefined {
  if (`${title} · ${SITE_NAME}`.length <= TITLE_BUDGET) return undefined;
  const short = `${title} · SignalAF`;
  return short.length <= TITLE_BUDGET ? short : title;
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
    type: "website",
    url: SITE_ORIGIN,
    images: [OG_IMAGE],
  },
  twitter: {
    card: TWITTER_CARD,
    images: [OG_IMAGE.url],
  },
};

/** Format a raw token count into a human-readable compact string.
 *  Handles the full range from thousands to quadrillions.
 *  e.g. 1_123_000_000 → "1.1B", 18_153_843_000_000_000 → "18.2Q" */
export function formatTokens(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 1_000_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n < 1_000_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n < 1_000_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`;
  return `${(n / 1_000_000_000_000_000).toFixed(1)}Q`;
}

/** Format a raw token count into a human-readable long string for llms.txt.
 *  e.g. 18_153_843_000_000_000 → "18.2 quadrillion" */
export function formatTokensLong(n: number): string {
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)} million`;
  if (n < 1_000_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} billion`;
  if (n < 1_000_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)} trillion`;
  return `${(n / 1_000_000_000_000_000).toFixed(1)} quadrillion`;
}
