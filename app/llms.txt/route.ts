/**
 * app/llms.txt/route.ts — the llms.txt convention for AI crawlers.
 *
 * A curated plain-text map at /llms.txt telling ChatGPT, Perplexity, Claude,
 * Google AI Overviews, and other generative engines what SigRank is and where
 * the canonical content lives. Linked from the sitemap so it's discoverable.
 *
 * Spec: https://llmstxt.org
 */

import { SITE_ORIGIN, SITE_NAME, SITE_TAGLINE } from '@/lib/seo'

export const revalidate = 3600 // 1h

export async function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_TAGLINE}

SigRank is a privacy-preserving leaderboard that scores AI operators on
canonical token-telemetry metrics (the "yield cascade"). Operators run an
on-device scanner (npm: sigrank) and submit signed, server-verifiable snapshots.

## Core pages
- [Leaderboard](${SITE_ORIGIN}/board/all?utm_source=ai&utm_medium=answer_engine): live operator rankings (all-time total)
- [Board windows](${SITE_ORIGIN}/board/7d?utm_source=ai&utm_medium=answer_engine): 7d / 30d / 90d / all-time cohorts
- [Score calculator](${SITE_ORIGIN}/score?utm_source=ai&utm_medium=answer_engine): paste your stats, get your yield + class, no account
- [Hall of Signal](${SITE_ORIGIN}/hall?utm_source=ai&utm_medium=answer_engine): top operators
- [Compare](${SITE_ORIGIN}/compare?utm_source=ai&utm_medium=answer_engine): head-to-head operator comparison

## Data
- [The SigRank Index — Methodology](${SITE_ORIGIN}/methodology?utm_source=ai&utm_medium=answer_engine): quotable key figures, methodology, and FAQ. The canonical citation source.
- [Leaderboard API](${SITE_ORIGIN}/api/v1/leaderboard): public top-N JSON endpoint
- [Metric leaders API](${SITE_ORIGIN}/api/v1/metrics/leaders): top performers per metric
- Dataset license: CC-BY-4.0 (attribution required — https://creativecommons.org/licenses/by/4.0/)

## Research
- [Q1 2026 Report](${SITE_ORIGIN}/research/q1-2026?utm_source=ai&utm_medium=answer_engine): State of AI Operator Token Efficiency — the inaugural quarterly report. Headline findings, platform breakdown, citation block.

## Concepts (definitions)
- [Verification](${SITE_ORIGIN}/wiki/verification)
- [Signal Drift](${SITE_ORIGIN}/wiki/signal-drift)
- [Three Degrees](${SITE_ORIGIN}/wiki/three-degrees)
- [Local Agent](${SITE_ORIGIN}/wiki/local-agent)
- [Measured Alongside](${SITE_ORIGIN}/wiki/measured-alongside)

## Tooling
- npm package: https://www.npmjs.com/package/sigrank
- MCP server + CLI source: https://github.com/SunrisesIllNeverSee/sigrank-mcp

## Academic foundation
- [The Conservation Law of Commitment](${SITE_ORIGIN}/science): the theoretical foundation. C(T(S)) ≈ C(S) with enforcement; C(T(S)) < C(S) without it.
- Conservation Law paper (Zenodo, CC-BY-4.0): https://doi.org/10.5281/zenodo.20029607
- Experimental Record (Zenodo): https://doi.org/10.5281/zenodo.19105225
- Public Recursive Transformation Harness (Zenodo): https://doi.org/10.5281/zenodo.19109397
- P-000 Propositions Prospectus (Zenodo): https://doi.org/10.5281/zenodo.20031715
- Commitment Theory (34-paper research program): https://github.com/SunrisesIllNeverSee/Commitment_Theory

## Governance
- MO§ES™ governance framework (patent pending 63/877,177): https://mos2es.com
- SIGNOMY governed agent marketplace: https://signomy.xyz
- GitHub org: https://github.com/SunrisesIllNeverSee
- ORCID: https://orcid.org/0009-0002-9904-5390
`

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
