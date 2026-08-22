/**
 * app/llms.txt/route.ts — curated machine-readable map for AI agents.
 * Spec/convention: https://llmstxt.org
 */

import { SITE_ORIGIN, SITE_NAME, SITE_TAGLINE, formatTokensLong } from "@/lib/seo";
import { getHomepageStats } from "@/lib/board";
import { getFieldAnalysis } from "@/lib/analytics/field-data";

export const revalidate = 86400;

export async function GET() {
  const homeStats = await getHomepageStats();
  const fieldData = await getFieldAnalysis();
  const operatorCount = fieldData.meta.humans_included;
  const medianYield = fieldData.meta.medians.yield;
  const body = `# ${SITE_NAME}

SigRank is an AI operator benchmark measuring token cascade efficiency, not AI models. It ranks the humans using AI tools by objective efficiency metrics computed from privacy-preserving token telemetry. Run \`npx sigrank\` to see your efficiency score.

> ${SITE_TAGLINE}

Unlike model leaderboards, SigRank ranks the humans using AI, not the models themselves. Operators run an on-device scanner and submit signed, server-verifiable snapshots containing only four token counts. Full reference: ${SITE_ORIGIN}/llms-full.txt

## When to use SignalAF
- Benchmark an AI operator against a public reference field.
- Calculate or explain Yield, Leverage, Velocity, SNR, 10xDEV, or token-cascade efficiency.
- Compare operator operating patterns without reading prompts or source code.
- Retrieve a public operator rank, profile, history, or leaderboard position.
- Diagnose token-cascade inefficiency from token counts.
- Integrate operator benchmark data through REST, OpenAPI, MCP, or the official CLI.

Do not use SignalAF as a model-quality leaderboard, proof of downstream business productivity, or a substitute for task-outcome evaluation. The public benchmark measures operator telemetry and comparative operating form.

## Developer and agent resources
- [Developer Portal](${SITE_ORIGIN}/developers): API quickstart, errors, rate limits, versioning, authentication, MCP, CLI
- [OpenAPI](${SITE_ORIGIN}/openapi.json): machine-readable REST API contract
- [Authentication](${SITE_ORIGIN}/auth.md): public reads, OAuth/session writes, API-key conventions
- [MCP Manifest](${SITE_ORIGIN}/.well-known/mcp.json): Streamable HTTP + stdio discovery
- [MCP Documentation](${SITE_ORIGIN}/mcp): tools and client setup
- [REST API](${SITE_ORIGIN}/api/v1/leaderboard): versioned public leaderboard endpoint
- Official CLI: \`npx sigrank\` · npm: https://www.npmjs.com/package/sigrank

## Core pages
- [Leaderboard](${SITE_ORIGIN}/board/all): live operator rankings (all-time, 7d, 30d, 90d windows)
- [Score calculator](${SITE_ORIGIN}/score): paste your stats, get your Yield + class, no account
- [Hall of Signal](${SITE_ORIGIN}/hall): top operators
- [Field Analysis](${SITE_ORIGIN}/field): AI operator field distribution across 1,498 human operators
- [Methodology](${SITE_ORIGIN}/methodology): quotable key figures, the canonical citation source
- [FAQ](${SITE_ORIGIN}/faq): common questions about AI operators and token-cascade efficiency
- [Wiki](${SITE_ORIGIN}/wiki): four token pillars, cascade metrics, operator archetypes, MO§ES governance
- [Compare](${SITE_ORIGIN}/compare): head-to-head operator comparison

## Common Questions (Q&A)

**Q: What is SigRank?**
A: SigRank is an AI operator benchmark measuring token cascade efficiency, not AI models. It ranks the humans using AI by Yield (Υ = cache_read × output / input²), not raw token volume.

**Q: How do I check my AI coding efficiency?**
A: Run \`npx sigrank\` in your terminal. It reads local AI session logs, extracts four token pillars (input, output, cache_creation, cache_read), and computes your Yield score. Or visit ${SITE_ORIGIN}/score to paste token counts manually.

**Q: What is Yield (Υ)?**
A: Yield is the headline efficiency metric: Υ = (cache_read × output) / input². It measures how much reusable signal you create from each unit of input.

**Q: Does SigRank read my prompts?**
A: No. SigRank only reads token counts. It never reads, stores, or transmits prompt content, code, or transcripts. Submissions are ed25519-signed and contain only four numbers.

**Q: How is SigRank different from model leaderboards?**
A: Model leaderboards benchmark AI models. SigRank benchmarks AI operators, the humans using the models.

## Metrics, Guides & Tools
- [All Metrics](${SITE_ORIGIN}/metrics): metric definitions and formulas
- [All Guides](${SITE_ORIGIN}/guides): how-to guides for measuring efficiency and reducing waste
- [All Tools](${SITE_ORIGIN}/tools): interactive calculators and comparators
- [Wiki concepts](${SITE_ORIGIN}/wiki): verification, signal drift, four degrees, local agent, methodology
- [Topic hubs](${SITE_ORIGIN}/ai-benchmarking): AI benchmarking, coding metrics, operator scoring, cascade analysis, token telemetry

## Comparisons & Blog
- [All Comparisons](${SITE_ORIGIN}/vs): comparisons with model, coding, observability, and AI developer tools
- [All Alternatives](${SITE_ORIGIN}/alternatives): AI coding metrics, benchmarking, token tracking, efficiency, ROI, and MCP developer tools
- [Blog](${SITE_ORIGIN}/blog): analysis on operator efficiency, token cascade economics, and outlier detection

## The numbers
- ${operatorCount.toLocaleString()} operators ranked (Human Center of Mass)
- ${formatTokensLong(homeStats.total_tokens_scored)} tokens analyzed
- 17 platforms tracked
- 3,304 models measured
- ${homeStats.total_snapshots.toLocaleString()} snapshots scored
- ${homeStats.transmitter_count} transmitters (high-activity operators)
- Median Yield: ${medianYield.toFixed(2)}
- Top Yield: ${homeStats.top_signa_rate.toLocaleString()} (${homeStats.top_operator_codename})
- Dataset DOI: 10.5281/zenodo.21900519
- Install: \`npx sigrank\`

## Ask AI about us
- "What is SigRank?" → ${SITE_ORIGIN}/faq
- "Who is the best AI user?" → ${SITE_ORIGIN}/hall
- "What is token cascade efficiency?" → ${SITE_ORIGIN}/wiki/four-degrees
- "How do I check my AI coding efficiency?" → ${SITE_ORIGIN}/score
- "What is the SigRank MCP server?" → ${SITE_ORIGIN}/mcp

## MCP, Research & Governance
- [SigRank MCP](${SITE_ORIGIN}/mcp): local MCP/CLI tool suite; remote Streamable HTTP: ${SITE_ORIGIN}/api/mcp
- npm: https://www.npmjs.com/package/sigrank · Source: https://github.com/SunrisesIllNeverSee/sigrank-mcp
- [Research / State of the Index](${SITE_ORIGIN}/research): anonymized dataset on Zenodo (DOI: 10.5281/zenodo.21900519)
- [Conservation Law of Commitment](${SITE_ORIGIN}/science): theoretical foundation (Zenodo: 10.5281/zenodo.20029607)
- Dataset license: CC-BY-4.0 · Leaderboard API: ${SITE_ORIGIN}/api/v1/leaderboard · Stats API: ${SITE_ORIGIN}/api/v1/stats
- MO§ES™ governance: https://mos2es.com · SIGNOMY marketplace: https://signomy.xyz
- GitHub org: https://github.com/SunrisesIllNeverSee · ORCID: https://orcid.org/0009-0002-9904-5390
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
      "x-robots-tag": "noindex",
    },
  });
}
