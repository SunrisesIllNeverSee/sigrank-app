/**
 * lib/jsonld.ts — Schema.org JSON-LD builders for SEO + GEO.
 *
 * Each builder returns a plain object that <JsonLd> serializes into a
 * `application/ld+json` script. The shapes target both classic search
 * (Google rich results) and generative engines (ChatGPT / Perplexity /
 * Claude / AI Overviews) — the ItemList and ProfilePage types are
 * especially high-leverage for AI citation.
 *
 * All URLs are absolute (SITE_ORIGIN) — relative URLs don't work in
 * structured data per the Schema.org spec.
 */

import { SITE_ORIGIN, SITE_NAME, SITE_TAGLINE } from '@/lib/seo'

const ORG_ID = `${SITE_ORIGIN}/#org`
const SITE_ID = `${SITE_ORIGIN}/#website`

/** Organization — site-wide, rendered in app/layout.tsx. */
export function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description: SITE_TAGLINE,
    logo: `${SITE_ORIGIN}/og.png`,
  }
}

/** WebSite — site-wide, rendered in app/layout.tsx. */
export function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    publisher: { '@id': ORG_ID },
  }
}

/** Leaderboard / board window → ItemList of operators. */
export function leaderboardItemList(
  entries: { codename: string; rank: number; classTier?: string }[],
  path: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'SigRank Leaderboard',
    url: `${SITE_ORIGIN}${path}`,
    numberOfItems: entries.length,
    itemListElement: entries.map((e) => ({
      '@type': 'ListItem',
      position: e.rank,
      url: `${SITE_ORIGIN}/user/${encodeURIComponent(e.codename)}`,
      item: {
        '@type': 'Person',
        name: e.codename,
        ...(e.classTier ? { jobTitle: e.classTier } : {}),
      },
    })),
  }
}

/** Operator profile → ProfilePage about a Person. */
export function operatorProfile(o: {
  codename: string
  path: string
  classTier?: string
  globalRank?: number
  pending?: boolean
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${SITE_ORIGIN}${o.path}`,
    mainEntity: {
      '@type': 'Person',
      name: o.codename,
      ...(o.classTier ? { jobTitle: o.classTier } : {}),
      ...(o.globalRank && !o.pending
        ? { description: `Rank #${o.globalRank} on the SigRank leaderboard` }
        : {}),
    },
  }
}

/** Breadcrumb trail → BreadcrumbList. */
export function breadcrumb(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${SITE_ORIGIN}${t.path}`,
    })),
  }
}

/** Wiki/glossary term → DefinedTerm (high-value for AI citation). */
export function definedTerm(term: string, definition: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term,
    description: definition,
    url: `${SITE_ORIGIN}${path}`,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'SigRank Wiki',
      url: `${SITE_ORIGIN}/wiki`,
    },
  }
}
