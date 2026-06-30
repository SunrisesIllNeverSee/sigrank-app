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
    sameAs: [
      'https://orcid.org/0009-0002-9904-5390',
      'https://github.com/SunrisesIllNeverSee',
      'https://doi.org/10.5281/zenodo.20029607',
      'https://doi.org/10.5281/zenodo.19105225',
      'https://signomy.xyz',
      'https://mos2es.com',
    ],
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

// ── WS1: Dataset + FAQPage (citation play) ───────────────────────────────

const DATASET_ID = `${SITE_ORIGIN}/#sigrank-index`

/**
 * The SigRank Index as a citable Schema.org Dataset.
 *
 * This is the block that makes SigRank recognizable as a primary data source
 * by Google Dataset Search and answer engines. Attach on /methodology and
 * /board/all.
 *
 * License is CC-BY-4.0 (LOCKED by owner 2026-06-29): MIT governs the code;
 * CC-BY governs the DATA. The attribution requirement IS the citation
 * mechanism — reuse requires credit, which turns reuse into citations.
 */
export function sigrankDataset(opts?: { temporalStart?: string; updated?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': DATASET_ID,
    name: 'The SigRank Index — AI Operator Token-Efficiency Leaderboard',
    alternateName: 'SigRank Index',
    description:
      'A privacy-preserving, continuously-updated leaderboard ranking AI operators by ' +
      'token-cascade efficiency (the yield metric Υ = cache_read × output / input²). ' +
      'Built from on-device, ed25519-signed token-telemetry snapshots.',
    url: `${SITE_ORIGIN}/methodology`,
    sameAs: `${SITE_ORIGIN}/board/all`,
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    citation: 'https://doi.org/10.5281/zenodo.20029607',
    keywords: [
      'AI operator leaderboard',
      'token efficiency',
      'token cascade efficiency',
      'LLM benchmark',
      'prompt caching',
      'agent performance',
    ],
    creativeWorkStatus: 'Published',
    temporalCoverage: `${opts?.temporalStart ?? '2026-05-14'}/..`,
    ...(opts?.updated ? { dateModified: opts.updated } : {}),
    measurementTechnique:
      'On-device token telemetry; operators submit ed25519-signed snapshots verified server-side. ' +
      'No message content is read or stored (token counts only).',
    variableMeasured: [
      {
        '@type': 'PropertyValue',
        name: 'Yield (Υ)',
        description: 'Token-cascade efficiency: cache_read × output / input².',
      },
      {
        '@type': 'PropertyValue',
        name: 'Global rank',
        description: "An operator's position on the all-time cross-platform board.",
      },
      {
        '@type': 'PropertyValue',
        name: 'Class tier',
        description: 'Performance band assigned from the scoring ruleset.',
      },
    ],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        name: 'Leaderboard API (top-N, public)',
        contentUrl: `${SITE_ORIGIN}/api/v1/leaderboard`,
      },
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        name: 'Metric leaders API',
        contentUrl: `${SITE_ORIGIN}/api/v1/metrics/leaders`,
      },
    ],
  }
}

/** FAQPage — renders an FAQ section as structured data (rich results + AI citation). */
export function faqPage(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }
}

/** ScholarlyArticle — for quarterly research reports (Part C citation magnet). */
export function researchArticle(opts: {
  slug: string
  title: string
  description: string
  datePublished: string
  headlineFindings: string[]
}) {
  const url = `${SITE_ORIGIN}/research/${opts.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    '@id': url,
    headline: opts.title,
    description: opts.description,
    url,
    datePublished: opts.datePublished,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    about: 'AI operator token efficiency',
    abstract: opts.headlineFindings.join(' '),
    citation: `${SITE_ORIGIN}/methodology`,
    isPartOf: {
      '@type': 'PublicationEvent',
      name: 'SigRank Quarterly Index Report',
    },
  }
}

/** ScholarlyArticle — the Conservation Law paper (Zenodo DOI). */
export function conservationLawArticle() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    '@id': 'https://doi.org/10.5281/zenodo.20029607',
    headline:
      'A Conservation Law for Commitment in Language Under Transformative Compression and Recursive Application',
    url: 'https://doi.org/10.5281/zenodo.20029607',
    author: {
      '@type': 'Person',
      name: 'Deric J. McHenry',
      sameAs: 'https://orcid.org/0009-0002-9904-5390',
    },
    publisher: { '@id': ORG_ID },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    datePublished: '2026-05-04',
    version: 'V.05',
    isPartOf: {
      '@type': 'PublicationEvent',
      name: 'Commitment Theory Research Program',
    },
  }
}

/** MO§ES™ enforcement architecture — schema.org has no Patent type; CreativeWork is closest. */
export function mosesPatent() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${SITE_ORIGIN}/#moses-patent`,
    name: 'MO§ES™ Enforcement Architecture',
    description:
      'Constitutional AI governance enforcement engine for the Conservation Law of Commitment. Patent Serial No. 63/877,177 (Provisional, pending).',
    author: {
      '@type': 'Person',
      name: 'Deric J. McHenry',
      sameAs: 'https://orcid.org/0009-0002-9904-5390',
    },
    publisher: { '@id': ORG_ID },
    about: 'AI governance enforcement architecture',
  }
}
