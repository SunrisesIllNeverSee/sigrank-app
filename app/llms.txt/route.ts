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
- [Leaderboard](${SITE_ORIGIN}/board/all): live operator rankings (all-time total)
- [Board windows](${SITE_ORIGIN}/board/7d): 7d / 30d / 90d / all-time cohorts
- [Hall of Signal](${SITE_ORIGIN}/hall): top operators
- [Compare](${SITE_ORIGIN}/compare): head-to-head operator comparison

## Data
- [The SigRank Index — Methodology](${SITE_ORIGIN}/methodology): quotable key figures, methodology, and FAQ. The canonical citation source.
- [Leaderboard API](${SITE_ORIGIN}/api/v1/leaderboard): public top-N JSON endpoint
- [Metric leaders API](${SITE_ORIGIN}/api/v1/metrics/leaders): top performers per metric
- Dataset license: CC-BY-4.0 (attribution required — https://creativecommons.org/licenses/by/4.0/)

## Research
- [Q1 2026 Report](${SITE_ORIGIN}/research/q1-2026): State of AI Operator Token Efficiency — the inaugural quarterly report. Headline findings, platform breakdown, citation block.

## Concepts (definitions)
- [Verification](${SITE_ORIGIN}/wiki/verification)
- [Signal Drift](${SITE_ORIGIN}/wiki/signal-drift)
- [Three Degrees](${SITE_ORIGIN}/wiki/three-degrees)
- [Local Agent](${SITE_ORIGIN}/wiki/local-agent)
- [Measured Alongside](${SITE_ORIGIN}/wiki/measured-alongside)

## Tooling
- npm package: https://www.npmjs.com/package/sigrank
- MCP server + CLI source: https://github.com/SunrisesIllNeverSee/sigrank-mcp
`

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
