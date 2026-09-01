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

import { SITE_ORIGIN, formatTokensLong } from "@/lib/seo";
import { elloCelloLLC, sigrank as sigrankCanon, dericMcHenry, CANON_LD_CONTEXT, CANON_ENTITY_IDS } from "@/lib/canon-entities";
import { activeProfile } from "@/lib/site-profile";
import type { HallRecord } from "@/lib/board";

const ORG_ID = `${SITE_ORIGIN}/#org`;
const SITE_ID = `${SITE_ORIGIN}/#website`;

/** Person — the site author (Deric J. McHenry) for E-E-A-T author attribution.
 *  Used as the `author` on blog posts, comparison articles, and research.
 *
 *  Canon-backed values (canonical @id, name, sameAs, affiliation, provenance)
 *  come from lib/canon-entities.ts. Page-specific value (url) is derived from
 *  SITE_ORIGIN. */
export function personAuthor() {
  return {
    "@context": CANON_LD_CONTEXT,
    "@type": "Person",
    "@id": dericMcHenry.canonical_entity_id,
    name: dericMcHenry.name,
    sameAs: dericMcHenry.sameAs,
    affiliation: { "@id": dericMcHenry.affiliation },
    url: `${SITE_ORIGIN}/about`,
  };
}

/** ItemList — for /alternatives/ listicles. Ordered list of compared tools. */
export function alternativesItemList(
  items: { name: string; url?: string }[],
  path: string,
  name: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url ?? `${SITE_ORIGIN}${path}#${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    })),
  };
}

/** TechArticle — for /vs/ comparison pages. Wraps the comparison content with
 *  author attribution (E-E-A-T) so Google and AI engines treat it as an article. */
export function comparisonArticle(opts: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
}) {
  const url = `${SITE_ORIGIN}${opts.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": url,
    headline: opts.title,
    description: opts.description,
    url,
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    author: personAuthor(),
    publisher: { "@id": ORG_ID },
    license: "https://creativecommons.org/licenses/by/4.0/",
    about: [
      { "@id": sigrankCanon.canonical_entity_id },
    ],
  };
}

/** Organization — site-wide, rendered in app/layout.tsx.
 *
 *  Canon-backed values (name, description, provenance, associatedWith) come
 *  from lib/canon-entities.ts. The #org @id is site-local (preserved).
 *  Page-specific values (logo, sameAs, url, alternateName) are preserved
 *  from the existing builder. */
export function organization() {
  return {
    "@context": CANON_LD_CONTEXT,
    "@type": "Organization",
    "@id": ORG_ID,
    name: elloCelloLLC.name,
    alternateName: activeProfile.alternateNames,
    url: SITE_ORIGIN,
    description: elloCelloLLC.description,
    logo: `${SITE_ORIGIN}/og-v2.png`,
    sameAs: [
      "https://orcid.org/0009-0002-9904-5390",
      "https://github.com/SunrisesIllNeverSee",
      "https://github.com/SunrisesIllNeverSee/sigrank-app",
      "https://github.com/SunrisesIllNeverSee/sigrank-mcp",
      "https://www.npmjs.com/package/sigrank",
      "https://pypi.org/project/sigrank/",
      "https://smithery.ai/servers/burnmydays/sigrank-mcp",
      "https://x.com/signalaf",
      "https://doi.org/10.5281/zenodo.20029607",
      "https://doi.org/10.5281/zenodo.19105225",
      "https://doi.org/10.5281/zenodo.19109397",
      "https://doi.org/10.5281/zenodo.20031715",
      "https://doi.org/10.5281/zenodo.21875675",
      "https://doi.org/10.5281/zenodo.21900519",
      "https://signomy.xyz",
      "https://mos2es.com",
      "https://sigeconomy.com",
    ],
  };
}

/** SoftwareApplication — SigRank as a software tool for schema.org rich results.
 *
 *  Was previously typed as Product, but Google's Product snippet validator requires
 *  aggregateRating + review + availability. SigRank is a free CLI/MCP tool, not a
 *  retail product — SoftwareApplication is the correct type and doesn't trigger the
 *  review/rating requirements. Offer keeps availability for completeness.
 *
 *  Canon-backed values (@id, name, description, applicationCategory,
 *  disambiguatingDescription, isBasedOn, provenance) come from
 *  lib/canon-entities.ts. Page-specific values (operatingSystem, offers,
 *  keywords, category, brand) are preserved from the existing builder.
 *  The SEO description (if profile-specific) is kept in `seoDescription`
 *  as a page-specific field, NOT substituted for the canon description. */
export function product() {
  return {
    "@context": CANON_LD_CONTEXT,
    "@type": "SoftwareApplication",
    "@id": sigrankCanon.canonical_entity_id,
    name: sigrankCanon.name,
    description: sigrankCanon.description,
    disambiguatingDescription: sigrankCanon.disambiguatingDescription,
    url: SITE_ORIGIN,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
    brand: { "@id": ORG_ID },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    keywords: [
      "AI operator leaderboard",
      "token cascade efficiency",
      "AI power user",
      "compare AI users",
      "token efficiency benchmark",
    ],
    isBasedOn: { "@id": sigrankCanon.isBasedOn },
    publisher: { "@id": ORG_ID },
    about: [
      { "@id": sigrankCanon.canonical_entity_id },
      { "@id": CANON_ENTITY_IDS.conservation_law_of_commitment },
    ],
    mentions: [
      { "@id": CANON_ENTITY_IDS.moses },
    ],
  };
}

/** WebSite — site-wide, rendered in app/layout.tsx.
 *
 *  Site-specific values (name, alternateName, description) come from the
 *  active site profile (lib/site-profile.ts). The publisher reference
 *  points to #org (Ello Cello LLC via canon). No canon-sensitive values
 *  on this block — it describes the site, not a canonical entity. */
export function website() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: activeProfile.siteName,
    alternateName: activeProfile.alternateNames,
    url: SITE_ORIGIN,
    publisher: { "@id": ORG_ID },
    description: activeProfile.siteTagline,
  };
}

/** Contribution Exchange Service — describes the Exchange as a domain service.
 *  Reuses existing ORG_ID and SITE_ID nodes rather than duplicating them. */
export function contributionExchangeService() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE_ORIGIN}/exchange/#service`,
    name: "Contribution Exchange",
    description:
      "A domain-native economic agent interface. AI agents can discover domain-published signals " +
      "(problems, requests, challenges, bounties, verification tasks, discoveries, experiments) " +
      "and propose useful unsolicited contributions. Neither a signal nor a proposal grants " +
      "execution authority or creates a payment obligation — Commitments require separate " +
      "bilateral acceptance.",
    url: `${SITE_ORIGIN}/exchange`,
    provider: { "@id": ORG_ID },
    serviceType: "Contribution Exchange",
    areaServed: "Global",
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${SITE_ORIGIN}/exchange`,
      availableLanguage: ["en"],
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Contribution Exchange Capabilities",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Exchange Signal Discovery",
            description: "Discover domain-published work signals.",
            url: `${SITE_ORIGIN}/exchange/signals`,
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Unsolicited Contribution Proposal",
            description: "Propose useful contributions the domain did not request.",
            url: `${SITE_ORIGIN}/exchange/propose`,
          },
        },
      ],
    },
    isRelatedTo: { "@id": SITE_ID },
  };
}

/** Aggregate stats for JSON-LD (AEO Item 2c). Quantified stats improve AI citation rates. */
export function aggregateStats(opts: {
  totalOperators: number;
  totalTokens: number;
  totalSnapshots: number;
  transmitterCount: number;
  topOperator: string;
  topYield: number;
  medianYield?: number;
  averageYield?: number;
  platformCount?: number;
  modelCount?: number;
}) {
  const descriptionParts: string[] = [
    `${opts.totalOperators} AI operators ranked.`,
    `${formatTokensLong(opts.totalTokens)} tokens analyzed.`,
    `${opts.transmitterCount} transmitters.`,
  ];
  if (opts.platformCount) descriptionParts.push(`${opts.platformCount} platforms tracked.`);
  if (opts.modelCount) descriptionParts.push(`${opts.modelCount.toLocaleString()} models measured.`);
  if (opts.medianYield !== undefined) descriptionParts.push(`Median Yield: ${opts.medianYield.toFixed(2)}.`);
  descriptionParts.push(`Top Yield: ${opts.topYield.toLocaleString()} (${opts.topOperator}).`);

  const variableMeasured: { name: string; value: number | string }[] = [
    { name: "total_operators", value: opts.totalOperators },
    { name: "total_tokens_scored", value: opts.totalTokens },
    { name: "total_snapshots", value: opts.totalSnapshots },
    { name: "transmitter_count", value: opts.transmitterCount },
    { name: "top_yield", value: opts.topYield },
  ];
  if (opts.medianYield !== undefined) variableMeasured.push({ name: "median_yield", value: opts.medianYield });
  if (opts.averageYield !== undefined) variableMeasured.push({ name: "average_yield", value: opts.averageYield });
  if (opts.platformCount) variableMeasured.push({ name: "platform_count", value: opts.platformCount });
  if (opts.modelCount) variableMeasured.push({ name: "models_tracked", value: opts.modelCount });

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "SigRank SignalAF Operator Leaderboard Statistics",
    description: descriptionParts.join(" "),
    url: `${SITE_ORIGIN}/api/v1/stats`,
    creator: { "@id": ORG_ID },
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: [
      "AI operator leaderboard",
      "token cascade efficiency",
      "Yield metric",
      "AI user ranking",
      "token telemetry",
    ],
    variableMeasured,
    about: [
      { "@id": sigrankCanon.canonical_entity_id },
    ],
  };
}

/** Leaderboard / board window → ItemList of operators. */
export function leaderboardItemList(
  entries: {
    codename: string;
    display_name?: string | null;
    rank: number;
    classTier?: string;
  }[],
  path: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "SigRank SignalAF Leaderboard",
    numberOfItems: entries.length,
    itemListElement: entries.map((e) => ({
      "@type": "ListItem",
      position: e.rank,
      url: `${SITE_ORIGIN}/user/${encodeURIComponent(e.codename)}`,
      item: {
        "@type": "Person",
        name: e.display_name || e.codename,
        ...(e.classTier ? { jobTitle: e.classTier } : {}),
      },
    })),
  };
}

/** Operator profile → ProfilePage about a Person. */
export function operatorProfile(o: {
  codename: string;
  display_name?: string | null;
  path: string;
  classTier?: string;
  globalRank?: number;
  pending?: boolean;
  records?: HallRecord[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE_ORIGIN}${o.path}`,
    mainEntity: {
      "@type": "Person",
      name: o.display_name || o.codename,
      ...(o.classTier ? { jobTitle: o.classTier } : {}),
      ...(o.globalRank && !o.pending
        ? { description: `Rank #${o.globalRank} on the SigRank leaderboard` }
        : {}),
      ...(o.records && o.records.length > 0
        ? {
            achievement: o.records.map((r) => ({
              "@type": "Thing",
              name: r.title,
              description: `${r.value} — achieved ${r.date}`,
            })),
          }
        : {}),
    },
  };
}

/** Breadcrumb trail → BreadcrumbList. */
export function breadcrumb(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_ORIGIN}${t.path}`,
    })),
  };
}

/** Wiki/glossary term → DefinedTerm (high-value for AI citation). */
export function definedTerm(term: string, definition: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term,
    description: definition,
    url: `${SITE_ORIGIN}${path}`,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "SigRank SignalAF Wiki",
      url: `${SITE_ORIGIN}/wiki`,
    },
  };
}

// ── WS1: Dataset + FAQPage (citation play) ───────────────────────────────

const DATASET_ID = `${SITE_ORIGIN}/#sigrank-index`;

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
export function sigrankDataset(opts?: {
  temporalStart?: string;
  updated?: string;
}) {
  const ZENODO_RECORD = "https://zenodo.org/records/21900519";
  const ZENODO_FILE = (name: string) => `${ZENODO_RECORD}/files/${name}`;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": "https://doi.org/10.5281/zenodo.21900519",
    identifier: {
      "@type": "PropertyValue",
      propertyID: "https://registry.identifiers.org/registry/doi",
      value: "doi:10.5281/zenodo.21900519",
      url: "https://doi.org/10.5281/zenodo.21900519",
    },
    name: "SigRank Two-Axis Operator Taxonomy: Finalized Datasets and Analytics Dashboards (v3.1)",
    alternateName: "SigRank Index",
    description:
      "Anonymized operator-level token telemetry for 1,628 AI operators across 17 platforms " +
      "and 3,304 models. Raw token counts (input, output, cache_read, cache_write, reasoning, " +
      "total), derived cascade metrics (yield, leverage, velocity, SNR, efficiency), per-platform " +
      "breakdowns, 10 build archetypes, and a 24-stage experience ladder. Built from on-device, " +
      "ed25519-signed token-telemetry snapshots scraped from the tokscale.ai leaderboard on " +
      "2026-07-13. No message content is read or stored. CC-BY-4.0.",
    url: `${SITE_ORIGIN}/research`,
    sameAs: [
      ZENODO_RECORD,
      "https://doi.org/10.5281/zenodo.21875675",
      `${SITE_ORIGIN}/board/all`,
      "https://www.npmjs.com/package/sigrank",
      "https://github.com/SunrisesIllNeverSee/sigrank-mcp",
    ],
    version: "3.1",
    datePublished: "2026-08-12",
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: personAuthor(),
    publisher: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: elloCelloLLC.name,
      url: SITE_ORIGIN,
    },
    citation: [
      "https://doi.org/10.5281/zenodo.20029607",
      "https://doi.org/10.5281/zenodo.19105225",
      "https://doi.org/10.5281/zenodo.19109397",
      "https://doi.org/10.5281/zenodo.20031715",
      "https://doi.org/10.5281/zenodo.21875675",
    ],
    keywords: [
      "AI operator leaderboard",
      "token efficiency",
      "token cascade efficiency",
      "LLM benchmark",
      "prompt caching",
      "agent performance",
      "AI operator telemetry",
      "anonymized dataset",
      "build archetype",
      "experience ladder",
    ],
    creativeWorkStatus: "Published",
    temporalCoverage: `${opts?.temporalStart ?? "2026-05-14"}/2026-07-13`,
    ...(opts?.updated ? { dateModified: opts.updated } : {}),
    measurementTechnique:
      "On-device token telemetry; operators submit ed25519-signed snapshots verified server-side. " +
      "No message content is read or stored (token counts only). Dataset scraped from tokscale.ai " +
      "leaderboard on 2026-07-13.",
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "input_tokens",
        description: "Fresh tokens sent to the model.",
      },
      {
        "@type": "PropertyValue",
        name: "output_tokens",
        description: "Tokens generated by the model.",
      },
      {
        "@type": "PropertyValue",
        name: "cache_read_tokens",
        description: "Context reused from cache.",
      },
      {
        "@type": "PropertyValue",
        name: "cache_write_tokens",
        description: "Context written to cache.",
      },
      {
        "@type": "PropertyValue",
        name: "Yield (Υ)",
        description: "Token-cascade efficiency: cache_read × output / input².",
      },
      {
        "@type": "PropertyValue",
        name: "Leverage",
        description: "Cache reuse ratio: cache_read / input.",
      },
      {
        "@type": "PropertyValue",
        name: "Velocity",
        description: "Generation ratio: output / input.",
      },
      {
        "@type": "PropertyValue",
        name: "SNR",
        description: "Signal-to-noise ratio: output / (input + output).",
      },
      {
        "@type": "PropertyValue",
        name: "archetype",
        description: "Build archetype classification (10 types).",
      },
      {
        "@type": "PropertyValue",
        name: "trans_exp",
        description: "Experience ladder stage (24 stages).",
      },
    ],
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        name: "operators-raw.csv",
        contentUrl: ZENODO_FILE("operators-raw.csv"),
        contentSize: "192KB",
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        name: "operators-derived.csv",
        contentUrl: ZENODO_FILE("operators-derived.csv"),
        contentSize: "348KB",
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        name: "operators-platform-split.csv",
        contentUrl: ZENODO_FILE("operators-platform-split.csv"),
        contentSize: "648KB",
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        name: "platform-raw.csv",
        contentUrl: ZENODO_FILE("platform-raw.csv"),
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        name: "platform-metrics.csv",
        contentUrl: ZENODO_FILE("platform-metrics.csv"),
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        name: "model-raw.csv",
        contentUrl: ZENODO_FILE("model-raw.csv"),
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        name: "model-metrics.csv",
        contentUrl: ZENODO_FILE("model-metrics.csv"),
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        name: "archetypes.json",
        contentUrl: ZENODO_FILE("archetypes.json"),
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        name: "class-distribution-reference.json",
        contentUrl: ZENODO_FILE("class-distribution-reference.json"),
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        name: "experience_ladder.json",
        contentUrl: ZENODO_FILE("experience_ladder.json"),
      },
    ],
    about: [
      { "@id": sigrankCanon.canonical_entity_id },
      { "@id": CANON_ENTITY_IDS.conservation_law_of_commitment },
    ],
    mentions: [
      { "@id": CANON_ENTITY_IDS.moses },
    ],
  };
}

/** FAQPage — renders an FAQ section as structured data (rich results + AI citation). */
export function faqPage(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

/** ScholarlyArticle — for quarterly research reports (Part C citation magnet). */
export function researchArticle(opts: {
  slug: string;
  title: string;
  description: string;
  datePublished: string;
  headlineFindings: string[];
  doi?: string;
}) {
  const url = opts.slug
    ? `${SITE_ORIGIN}/research/${opts.slug}`
    : `${SITE_ORIGIN}/research`;
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": opts.doi ? `https://doi.org/${opts.doi}` : url,
    headline: opts.title,
    description: opts.description,
    url,
    datePublished: opts.datePublished,
    author: personAuthor(),
    publisher: { "@id": ORG_ID },
    license: "https://creativecommons.org/licenses/by/4.0/",
    about: [
      { "@id": sigrankCanon.canonical_entity_id },
      { "@id": CANON_ENTITY_IDS.conservation_law_of_commitment },
    ],
    abstract: opts.headlineFindings.join(" "),
    citation: `${SITE_ORIGIN}/methodology`,
    isPartOf: {
      "@type": "PublicationIssue",
      name: "SigRank Quarterly Index Report",
      isPartOf: {
        "@type": "Periodical",
        name: "SigRank Research Reports",
        publisher: { "@id": ORG_ID },
      },
    },
  };
  if (opts.doi) {
    article.identifier = {
      "@type": "PropertyValue",
      propertyID: "DOI",
      value: opts.doi,
    };
    article.sameAs = `https://doi.org/${opts.doi}`;
  }
  return article;
}

/** ScholarlyArticle — the Conservation Law paper (Zenodo DOI). */
export function conservationLawArticle() {
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": "https://doi.org/10.5281/zenodo.20029607",
    headline:
      "A Conservation Law for Commitment in Language Under Transformative Compression and Recursive Application",
    url: "https://doi.org/10.5281/zenodo.20029607",
    identifier: {
      "@type": "PropertyValue",
      propertyID: "DOI",
      value: "10.5281/zenodo.20029607",
    },
    author: {
      "@type": "Person",
      name: "Deric J. McHenry",
      sameAs: "https://orcid.org/0009-0002-9904-5390",
    },
    publisher: { "@id": ORG_ID },
    license: "https://creativecommons.org/licenses/by/4.0/",
    datePublished: "2026-05-04",
    version: "V.05",
    isPartOf: {
      "@type": "PublicationIssue",
      name: "Commitment Theory Research Program",
      isPartOf: {
        "@type": "Periodical",
        name: "Commitment Theory Research Reports",
        publisher: { "@id": ORG_ID },
      },
    },
  };
}

/** MO§ES™ enforcement architecture — schema.org has no Patent type; CreativeWork is closest. */
export function mosesPatent() {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${SITE_ORIGIN}/#moses-patent`,
    name: "MO§ES™ Enforcement Architecture",
    identifier: {
      "@type": "PropertyValue",
      propertyID: "USPTO Provisional Application",
      value: "63/877,177",
    },
    description:
      "Constitutional AI governance enforcement engine for the Conservation Law of Commitment. Patent Serial No. 63/877,177 (Provisional, pending).",
    author: {
      "@type": "Person",
      name: "Deric J. McHenry",
      sameAs: "https://orcid.org/0009-0002-9904-5390",
    },
    publisher: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: elloCelloLLC.name,
      url: SITE_ORIGIN,
    },
    about: "AI governance enforcement architecture",
  };
}

/**
 * Dataset — Experimental Record (EXP-001 to EXP-007).
 * Zenodo DOI: 10.5281/zenodo.19105225. This is the empirical evidence
 * supporting the Conservation Law. Published as a dataset on Zenodo.
 * Google Dataset Search and AI engines use Dataset schema to discover
 * and cite research data.
 */
export function experimentalRecordDataset() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": "https://doi.org/10.5281/zenodo.19105225",
    name: "Experimental Record for A Conservation Law for Commitment in Language Under Transformative Compression and Recursive Application (EXP-001 to EXP-007)",
    description:
      "Seven controlled harness experiments testing commitment conservation under recursive transformative compression. " +
      "20-signal canonical corpus, GPT-4o-mini, 10 recursive iterations, NLI bidirectional entailment + Jaccard surface stability. " +
      "13/20 signals achieved NLI=1.00 under gate condition. Nine failure modes documented.",
    url: "https://doi.org/10.5281/zenodo.19105225",
    identifier: {
      "@type": "PropertyValue",
      propertyID: "DOI",
      value: "10.5281/zenodo.19105225",
    },
    creator: {
      "@type": "Person",
      name: "Deric J. McHenry",
      sameAs: "https://orcid.org/0009-0002-9904-5390",
    },
    publisher: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: elloCelloLLC.name,
      url: SITE_ORIGIN,
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    datePublished: "2026-03-19",
    version: "1.0.0",
    keywords: [
      "commitment conservation",
      "recursive transformation",
      "semantic stability",
      "commitment extraction",
      "language invariance",
      "semantic compression",
      "gating",
      "conservation law",
      "NLI bidirectional entailment",
      "Jaccard similarity",
      "falsifiability",
    ],
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "NLI bidirectional entailment",
        description:
          "1.00 = both directions entail, 0.50 = one direction, 0.00 = neither.",
      },
      {
        "@type": "PropertyValue",
        name: "Jaccard surface stability",
        description: "Surface keyword overlap vs. origin commitment set.",
      },
    ],
    measurementTechnique:
      "Recursive transformative compression with NLI bidirectional entailment (microsoft/deberta-v3-base-mnli) + Jaccard surface stability. 10 iterations per signal.",
    isBasedOn: "https://doi.org/10.5281/zenodo.20029607",
    citation: "https://doi.org/10.5281/zenodo.20029607",
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/zip",
        name: "Experimental data archive",
        contentUrl: "https://zenodo.org/records/19105225",
      },
    ],
  };
}

/**
 * Dataset — Public Recursive Transformation Harness.
 * Zenodo DOI: 10.5281/zenodo.19109397. The reproducible harness code
 * used to run the experiments. Published as a workflow on Zenodo.
 */
export function transformationHarnessDataset() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": "https://doi.org/10.5281/zenodo.19109397",
    name: "Public Recursive Transformation Harness for A Conservation Law for Commitment in Language Under Transformative Compression and Recursive Application",
    description:
      "The public proxy harness for testing commitment conservation under recursive transformative compression. " +
      "Python implementation. Model-agnostic — works with any LLM API. Includes canonical 20-signal corpus.",
    url: "https://doi.org/10.5281/zenodo.19109397",
    identifier: {
      "@type": "PropertyValue",
      propertyID: "DOI",
      value: "10.5281/zenodo.19109397",
    },
    creator: {
      "@type": "Person",
      name: "Deric J. McHenry",
      sameAs: "https://orcid.org/0009-0002-9904-5390",
    },
    publisher: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: elloCelloLLC.name,
      url: SITE_ORIGIN,
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    datePublished: "2026-03-19",
    version: "1.0.0",
    keywords: [
      "commitment conservation",
      "recursive transformation",
      "public proxy harness",
      "semantic stability",
      "commitment extraction",
      "gating",
      "workflow",
      "python",
      "research methods",
    ],
    isBasedOn: "https://doi.org/10.5281/zenodo.20029607",
    citation: "https://doi.org/10.5281/zenodo.20029607",
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/zip",
        name: "Harness code archive",
        contentUrl: "https://zenodo.org/records/19109397",
      },
    ],
  };
}

/**
 * Dataset — Propositions of Commitment Theory (P-000).
 * Zenodo DOI: 10.5281/zenodo.20031715. The research prospectus defining
 * all CT terms, disambiguation, and the 34-paper pipeline.
 */
export function propositionsDataset() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": "https://doi.org/10.5281/zenodo.20031715",
    name: "Propositions of Commitment Theory: A Research Prospectus",
    description:
      'The foundational prospectus defining Commitment Theory (CT) terms, disambiguation from linguistic/epistemic uses of "commitment," ' +
      "the conservation law statement, and the 34-paper research pipeline across CT, Legal Theory, and MISC tracks.",
    url: "https://doi.org/10.5281/zenodo.20031715",
    identifier: {
      "@type": "PropertyValue",
      propertyID: "DOI",
      value: "10.5281/zenodo.20031715",
    },
    creator: {
      "@type": "Person",
      name: "Deric J. McHenry",
      sameAs: "https://orcid.org/0009-0002-9904-5390",
    },
    publisher: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: elloCelloLLC.name,
      url: SITE_ORIGIN,
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    datePublished: "2026-04-20",
    version: "1.0.0",
    keywords: [
      "commitment theory",
      "conservation law",
      "AI governance",
      "semantic preservation",
      "commitment conservation",
      "research prospectus",
    ],
    isPartOf: {
      "@type": "DataCatalog",
      name: "Commitment Theory Research Program",
      publisher: {
        "@type": "Organization",
        "@id": ORG_ID,
        name: elloCelloLLC.name,
        url: SITE_ORIGIN,
      },
    },
    references: "https://doi.org/10.5281/zenodo.20029607",
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/pdf",
        name: "Research prospectus",
        contentUrl: "https://zenodo.org/records/20031715",
      },
    ],
  };
}

// ── Score calculator + CLI tool (GEO: make the tools machine-readable) ────

/**
 * SoftwareApplication — the /score calculator. An interactive, browser-based
 * tool that computes your yield from pasted token stats. AI engines
 * answering "AI token efficiency calculator" queries should surface this.
 */
export function scoreCalculator() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SigRank SignalAF Score Calculator",
    url: `${SITE_ORIGIN}/score`,
    description:
      "Paste your ccusage JSON to see your Υ Yield, class tier, and compression ratio instantly. No account needed — just run the numbers.",
    applicationCategory: "CalculatorApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: { "@id": ORG_ID },
    featureList: [
      "Yield (Υ) calculation from token cascade",
      "Class tier classification (IGNITER to ARCH+)",
      "Compression ratio analysis",
      "No account required",
    ],
  };
}

/**
 * SoftwareApplication — the `sigrank` CLI tool (npm). The on-device
 * scanner + leaderboard client. AI engines answering "AI coding tools"
 * or "token tracking tools" should surface this.
 */
export function cliTool() {
  return {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "SoftwareSourceCode"],
    name: "sigrank",
    alternateName: "SigRank CLI",
    description:
      "A privacy-preserving terminal tool that parses your AI coding logs locally, computes token-cascade efficiency metrics, and publishes signed snapshots to the SigRank leaderboard. Bundles ccusage, tokscale, and token-dashboard.",
    url: SITE_ORIGIN,
    downloadUrl: "https://www.npmjs.com/package/sigrank",
    installUrl: "https://www.npmjs.com/package/sigrank",
    codeRepository: "https://github.com/SunrisesIllNeverSee/sigrank-mcp",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
    runtimePlatform: "Node.js >= 18",
    softwareVersion: "0.16.0",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: { "@id": ORG_ID },
    featureList: [
      "Local log parsing (ccusage, tokscale, token-dashboard bundled)",
      "Yield (Υ) cascade metric computation",
      "ed25519-signed snapshot submission",
      "Live leaderboard with board windows (7d/30d/90d/all)",
      "Head-to-head operator comparison",
      "MCP server for agent integration",
      "Dry-run mode to inspect payloads before sending",
    ],
    keywords: [
      "mcp",
      "model-context-protocol",
      "ai-agents",
      "claude",
      "token-telemetry",
      "leaderboard",
      "cli",
      "yield-cascade",
    ],
    about: [
      { "@id": sigrankCanon.canonical_entity_id },
    ],
    mentions: [
      { "@id": CANON_ENTITY_IDS.conservation_law_of_commitment },
    ],
  };
}

/**
 * HowTo — the /score flow. Three steps: paste, see yield, see class.
 * Google rich results can show these as step-by-step snippets.
 */
export function scoreHowTo() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Score your AI token cascade",
    description:
      "Paste your ccusage JSON output to instantly see your Υ Yield, class tier, and compression ratio. No account needed.",
    totalTime: "PT1M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Get your token stats",
        text: "Run `ccusage --json` or `npx sigrank me` to get your token cascade numbers (input, output, cache write, cache read).",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Paste your stats",
        text: "Go to signalaf.com/score and paste your ccusage JSON output into the input field.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "See your yield and class",
        text: "The calculator computes your Υ Yield = (cache_read × output) / input², your class tier (IGNITER to ARCH+), and your compression ratio instantly.",
      },
    ],
  };
}
