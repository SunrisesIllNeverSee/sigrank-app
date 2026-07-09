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

import { SITE_ORIGIN, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

const ORG_ID = `${SITE_ORIGIN}/#org`;
const SITE_ID = `${SITE_ORIGIN}/#website`;

/** Organization — site-wide, rendered in app/layout.tsx. */
export function organization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description: SITE_TAGLINE,
    logo: `${SITE_ORIGIN}/og-v2.png`,
    sameAs: [
      "https://orcid.org/0009-0002-9904-5390",
      "https://github.com/SunrisesIllNeverSee",
      "https://github.com/SunrisesIllNeverSee/sigrank-app",
      "https://github.com/SunrisesIllNeverSee/sigrank-mcp",
      "https://www.npmjs.com/package/sigrank",
      "https://doi.org/10.5281/zenodo.20029607",
      "https://doi.org/10.5281/zenodo.19105225",
      "https://doi.org/10.5281/zenodo.19109397",
      "https://doi.org/10.5281/zenodo.20031715",
      "https://signomy.xyz",
      "https://mos2es.com",
    ],
  };
}

/** WebSite — site-wide, rendered in app/layout.tsx. */
export function website() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    publisher: { "@id": ORG_ID },
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
    name: "SigRank Leaderboard",
    url: `${SITE_ORIGIN}${path}`,
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
      name: "SigRank Wiki",
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
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": DATASET_ID,
    name: "The SigRank Index — AI Operator Token-Efficiency Leaderboard",
    alternateName: "SigRank Index",
    description:
      "A privacy-preserving, continuously-updated leaderboard ranking AI operators by " +
      "token-cascade efficiency (the yield metric Υ = cache_read × output / input²). " +
      "Built from on-device, ed25519-signed token-telemetry snapshots.",
    url: `${SITE_ORIGIN}/methodology`,
    sameAs: [
      `${SITE_ORIGIN}/board/all`,
      "https://www.npmjs.com/package/sigrank",
      "https://github.com/SunrisesIllNeverSee/sigrank-mcp",
    ],
    creator: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
    citation: [
      "https://doi.org/10.5281/zenodo.20029607",
      "https://doi.org/10.5281/zenodo.19105225",
      "https://doi.org/10.5281/zenodo.19109397",
      "https://doi.org/10.5281/zenodo.20031715",
    ],
    keywords: [
      "AI operator leaderboard",
      "token efficiency",
      "token cascade efficiency",
      "LLM benchmark",
      "prompt caching",
      "agent performance",
    ],
    creativeWorkStatus: "Published",
    temporalCoverage: `${opts?.temporalStart ?? "2026-05-14"}/..`,
    ...(opts?.updated ? { dateModified: opts.updated } : {}),
    measurementTechnique:
      "On-device token telemetry; operators submit ed25519-signed snapshots verified server-side. " +
      "No message content is read or stored (token counts only).",
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "Yield (Υ)",
        description: "Token-cascade efficiency: cache_read × output / input².",
      },
      {
        "@type": "PropertyValue",
        name: "Global rank",
        description:
          "An operator's position on the all-time cross-platform board.",
      },
      {
        "@type": "PropertyValue",
        name: "Class tier",
        description: "Performance band assigned from the scoring ruleset.",
      },
    ],
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        name: "Leaderboard API (top-N, public)",
        contentUrl: `${SITE_ORIGIN}/api/v1/leaderboard`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        name: "Metric leaders API",
        contentUrl: `${SITE_ORIGIN}/api/v1/metrics/leaders`,
      },
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
}) {
  const url = `${SITE_ORIGIN}/research/${opts.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": url,
    headline: opts.title,
    description: opts.description,
    url,
    datePublished: opts.datePublished,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    license: "https://creativecommons.org/licenses/by/4.0/",
    about: "AI operator token efficiency",
    abstract: opts.headlineFindings.join(" "),
    citation: `${SITE_ORIGIN}/methodology`,
    isPartOf: {
      "@type": "PublicationEvent",
      name: "SigRank Quarterly Index Report",
    },
  };
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
      "@type": "PublicationEvent",
      name: "Commitment Theory Research Program",
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
    publisher: { "@id": ORG_ID },
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
    publisher: { "@id": ORG_ID },
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
    publisher: { "@id": ORG_ID },
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
    programmingLanguage: "Python",
    runtimePlatform: "Python 3",
    isBasedOn: "https://doi.org/10.5281/zenodo.20029607",
    citation: "https://doi.org/10.5281/zenodo.20029607",
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
    publisher: { "@id": ORG_ID },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    datePublished: "2026-04-20",
    version: "V.1",
    keywords: [
      "commitment theory",
      "conservation law",
      "AI governance",
      "semantic preservation",
      "commitment conservation",
      "research prospectus",
    ],
    isPartOf: {
      "@type": "PublicationEvent",
      name: "Commitment Theory Research Program",
    },
    references: "https://doi.org/10.5281/zenodo.20029607",
  };
}

// ── Score calculator + CLI tool (GEO: make the tools machine-readable) ────

/**
 * WebApplication — the /score calculator. An interactive, browser-based
 * tool that computes your yield from pasted token stats. AI engines
 * answering "AI token efficiency calculator" queries should surface this.
 */
export function scoreCalculator() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "SigRank Score Calculator",
    url: `${SITE_ORIGIN}/score`,
    description:
      "Paste your ccusage JSON to see your Υ Yield, class tier, and compression ratio instantly. No account needed — just run the numbers.",
    applicationCategory: "CalculatorApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: { "@id": ORG_ID },
    featureList: [
      "Yield (Υ) calculation from token cascade",
      "Class tier classification (IGNITER to TRANSMITTER)",
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
    "@type": "SoftwareApplication",
    name: "sigrank",
    alternateName: "SigRank CLI",
    description:
      "A privacy-preserving terminal tool that parses your AI coding logs locally, computes token-cascade efficiency metrics, and publishes signed snapshots to the SigRank leaderboard. Bundles ccusage, tokscale, and token-dashboard.",
    url: SITE_ORIGIN,
    downloadUrl: "https://www.npmjs.com/package/sigrank",
    installUrl: "https://www.npmjs.com/package/sigrank",
    codeRepository: "https://github.com/SunrisesIllNeverSee/sigrank-mcp",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "macOS, Linux",
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
        text: "The calculator computes your Υ Yield = (cache_read × output) / input², your class tier (IGNITER to TRANSMITTER), and your compression ratio instantly.",
      },
    ],
  };
}
