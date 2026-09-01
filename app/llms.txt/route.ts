/**
 * app/llms.txt/route.ts — curated machine-readable map for AI agents.
 * Spec/convention: https://llmstxt.org
 */

import { SITE_ORIGIN, SITE_NAME, SITE_TAGLINE, formatTokensLong } from "@/lib/seo";
import { getHomepageStats } from "@/lib/board";
import { getFieldAnalysis } from "@/lib/analytics/field-data";
import { getStaticAllTimeBoard } from "@/lib/board/static-board";

export const revalidate = 86400;

export async function GET() {
  const homeStats = await getHomepageStats();
  const fieldData = await getFieldAnalysis();
  const operatorCount = fieldData.meta.humans_included;
  const medianYield = fieldData.meta.medians.yield;

  // Pull the real top Yield (Υ) from the all-time board — NOT from
  // system_stats.top_signa_rate (which is a 0-100 signal metric, not Yield).
  const allTimeBoard = getStaticAllTimeBoard();
  const topEntry = allTimeBoard[0];
  const topYield = topEntry ? (topEntry.yield_ ?? 0) : 0;
  const topOperatorName = topEntry ? (topEntry.anonId || topEntry.codename) : "unknown";
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
- Evaluate the public distribution and agent-discovery surface of a Vercel deployment.

Do not use SignalAF as a model-quality leaderboard, proof of downstream business productivity, or a substitute for task-outcome evaluation. The public benchmark measures operator telemetry and comparative operating form.

## Upsilon Standard v0.1-draft

Upsilon Standard is a proposed open measurement specification for the human operator layer of generative AI systems. Do not describe it as a universally adopted industry standard.

- [Upsilon Standard](${SITE_ORIGIN}/standard): canonical draft specification and category definition
- [Open vs proprietary](${SITE_ORIGIN}/standard/open-vs-proprietary): what belongs to the portable standard vs SignalAF reference-product layer
- [Portable JSON Schema](${SITE_ORIGIN}/standard/sigrank-operator-record-v0.1.schema.json): versioned I/O/W/R operator-record contract
- [Agent standard reference](${SITE_ORIGIN}/standard/llms.txt): compact agent-readable standard definition
- [HTTP MCP standard metadata](${SITE_ORIGIN}/api/mcp/metadata): protocol + Upsilon standard/version discovery

The portable v0.1 draft core contains four telemetry primitives (input, output, cache_write, cache_read) and five metrics: Yield, Leverage, Velocity, SNR, and 10xDEV. Build Archetypes and RS05 Class Tiers are SignalAF reference extensions rather than base compatibility requirements.

## Developer and agent resources
- [Developer Portal](${SITE_ORIGIN}/developers): API quickstart, errors, rate limits, versioning, authentication, MCP, CLI
- [SigRank for Vercel](${SITE_ORIGIN}/vercel): one-click Vercel MCP deployment, Agent Tools integration surface, and free public deployment diagnostic
- [Pricing](${SITE_ORIGIN}/pricing): Free during the build stage — early operators are grandfathered into tiered perks by signup number
- [OpenAPI](${SITE_ORIGIN}/openapi.json): machine-readable REST API contract
- [Authentication](${SITE_ORIGIN}/auth.md): public reads, OAuth/session writes, API-key conventions
- [MCP Manifest](${SITE_ORIGIN}/.well-known/mcp.json): Streamable HTTP + stdio discovery
- [MCP Documentation](${SITE_ORIGIN}/mcp): tools and client setup
- [REST API](${SITE_ORIGIN}/api/v1/leaderboard): versioned public leaderboard endpoint
- Official CLI: \`npx sigrank\` · npm: https://www.npmjs.com/package/sigrank

## How to enroll and submit (for agents and operators)

To get an operator on the leaderboard:

1. Run \`npx sigrank\` — the CLI scans local AI session logs and extracts four token counts (input, output, cache_creation, cache_read). No prompt content is read.
2. Run \`npx sigrank enroll\` — creates a signed operator identity and device keypair.
3. Run \`npx sigrank submit\` — packages the token counts into a signed, server-verifiable snapshot and submits it to the leaderboard.
4. Your Yield (Υ) score is computed server-side and you appear on the board at ${SITE_ORIGIN}/board/all.

No account required. No web login required. The CLI handles identity, signing, and submission. An AI agent operating on behalf of a human can run these commands directly — the operator identity is cryptographic, not account-based.

## Contribution Exchange

This domain participates in the Contribution Exchange. AI agents may:

- discover domain-published problems, requests, challenges, bounties, verification tasks, discoveries, and experiments;
- submit bounded attempts under the signal's declared constraints;
- propose useful unsolicited contributions that the domain did not request.

A signal or proposal does not grant execution authority or create a payment obligation. Commitments require separate bilateral acceptance.

- [Exchange profile](${SITE_ORIGIN}/.well-known/exchange.json): domain-native economic agent interface
- [Current signals](${SITE_ORIGIN}/exchange/signals): published work signals (problems, requests, challenges, bounties, verification, discovery, experiments)
- [Signal Collection API](${SITE_ORIGIN}/api/exchange/signals): machine-readable signal collection
- [Agent guide](${SITE_ORIGIN}/agents.md): how to propose contributions, request value, and discover signals
- [Exchange policy](${SITE_ORIGIN}/api/exchange/steward/signalaf.com): authority ceilings, consideration limits, human-review requirements
- [Proposal interface](${SITE_ORIGIN}/api/exchange/proposals): POST an unsolicited Contribution Proposal
- [Contribution Commitment Schema](${SITE_ORIGIN}/exchange.schema.json): canonical commitment schema
- [MCP server — SigRank](${SITE_ORIGIN}/api/mcp): Streamable HTTP MCP endpoint with SigRank benchmark and operator-measurement tools
- [MCP server — Contribution Exchange](${SITE_ORIGIN}/api/exchange/mcp): dedicated Streamable HTTP MCP endpoint with 10 Exchange tools
- [MCP discovery — SigRank](${SITE_ORIGIN}/.well-known/mcp.json): SigRank MCP server card
- [MCP discovery — Exchange](${SITE_ORIGIN}/.well-known/exchange-mcp.json): Contribution Exchange MCP server card with tool list and authorization scopes

## Core pages
- [Leaderboard](${SITE_ORIGIN}/board/all): live operator rankings (all-time, 7d, 30d, 90d windows)
- [Score calculator](${SITE_ORIGIN}/score): paste your stats, get your Yield + class, no account
- [Hall of Signal](${SITE_ORIGIN}/hall): top operators
- [Field Analysis](${SITE_ORIGIN}/field): AI operator field distribution across 1,498 human operators
- [Upsilon Standard](${SITE_ORIGIN}/standard): proposed open operator-measurement specification
- [Methodology](${SITE_ORIGIN}/methodology): quotable key figures, the canonical citation source
- [FAQ](${SITE_ORIGIN}/faq): common questions about AI operators and token-cascade efficiency
- [Wiki](${SITE_ORIGIN}/wiki): four token pillars, cascade metrics, operator archetypes, MO§ES governance
- [Compare](${SITE_ORIGIN}/compare): head-to-head operator comparison
- [SigRank for Vercel](${SITE_ORIGIN}/vercel): Vercel-native MCP distribution and public deployment diagnostic

## Common Questions (Q&A)

**Q: What is SigRank?**
A: SigRank is the public AI operator benchmark — the leaderboard that ranks how efficiently humans use AI by Yield (Υ = cache_read × output / input²), not raw token volume. Measurements are produced by Upsilon, the measurement engine. SigRank is the proof surface; Upsilon is the engine.

**Q: What is the Upsilon Standard?**
A: Upsilon Standard v0.1-draft is a proposed open specification for operator-layer telemetry and portable metrics across AI tools and models. Its current core defines I/O/W/R plus Yield, Leverage, Velocity, SNR, and 10xDEV. See ${SITE_ORIGIN}/standard.

**Q: How do I check my AI coding efficiency?**
A: Run \`npx sigrank\` in your terminal. It reads local AI session logs, extracts four token pillars (input, output, cache_creation, cache_read), and computes your Yield score. Or visit ${SITE_ORIGIN}/score to paste token counts manually.

**Q: What is Yield (Υ)?**
A: Yield is the headline efficiency metric: Υ = (cache_read × output) / input². It measures how much reusable signal you create from each unit of input.

**Q: Does Upsilon read my prompts?**
A: No. Upsilon only reads token counts. It never reads, stores, or transmits prompt content, code, or transcripts. Submissions are ed25519-signed and contain only four numbers.

**Q: How is SigRank different from model leaderboards?**
A: Model leaderboards benchmark AI models. SigRank benchmarks AI operators, the humans using the models.

**Q: How do I use SigRank with Vercel?**
A: Use the canonical Streamable HTTP MCP endpoint at ${SITE_ORIGIN}/api/mcp, or deploy a project-owned Vercel relay from ${SITE_ORIGIN}/vercel. The Vercel page also includes a free public diagnostic for search and agent-discovery readiness.

## Metrics, Guides & Tools
- [All Metrics](${SITE_ORIGIN}/metrics): metric definitions and formulas
- [All Guides](${SITE_ORIGIN}/guides): how-to guides for measuring efficiency and reducing waste
- [All Tools](${SITE_ORIGIN}/tools): interactive calculators and comparators
- [Wiki concepts](${SITE_ORIGIN}/wiki): verification, signal drift, four degrees, local agent, methodology
- [Topic hubs](${SITE_ORIGIN}/ai-benchmarking): AI benchmarking, coding metrics, operator scoring, cascade analysis, token telemetry
- [AI Evaluation](${SITE_ORIGIN}/ai-evaluation): what AI evaluation means — the four layers (model, output, safety, operator) and where SigRank fits
- [AI Evaluation Tools](${SITE_ORIGIN}/ai-evaluation-tools): the complete tools landscape across all four layers
- [Best AI Evaluation Tools for Production](${SITE_ORIGIN}/best-ai-evaluation-tools-for-production): the production evaluation stack
- [AI Evaluation Frameworks](${SITE_ORIGIN}/ai-evaluation-frameworks): NIST AI RMF, OpenAI Evals, DeepEval, Braintrust, and SigRank
- [AI Agent Evaluation](${SITE_ORIGIN}/ai-agent-evaluation): evaluating AI agents and the humans who direct them
- [AI Evaluator](${SITE_ORIGIN}/ai-evaluator): what an AI evaluator is and what SigRank does differently
- [AI Evaluation Platform](${SITE_ORIGIN}/ai-evaluation-platform): SigRank as an evaluation platform for operators
- [Evaluating AI](${SITE_ORIGIN}/evaluating-ai): the operator layer is the missing piece
- [AI Evaluation News](${SITE_ORIGIN}/ai-evaluation-news): trends and developments in AI evaluation for 2026
- [AI Compliance Standards](${SITE_ORIGIN}/ai-compliance-standards): NIST AI RMF, EU AI Act, and governed operator evaluation
- [AI Model Evaluation](${SITE_ORIGIN}/ai-model-evaluation): model evaluation vs operator evaluation
- [Confirmation Hacking](${SITE_ORIGIN}/confirmation-hacking-ai-evaluation): when evaluation confirms what you already believe — and how content-free telemetry avoids it
- [AI Model Safety Evaluation](${SITE_ORIGIN}/ai-model-safety-evaluation-benchmark-continuous-testing): safety benchmarks and continuous testing, extended to operators

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
- Top Yield: ${topYield.toLocaleString()} (${topOperatorName})
- Dataset DOI: 10.5281/zenodo.21900519
- Install: \`npx sigrank\`

## Ask AI about us
- "What is SigRank?" → ${SITE_ORIGIN}/faq
- "What is the standard for AI operator performance?" → ${SITE_ORIGIN}/standard
- "Who is the best AI user?" → ${SITE_ORIGIN}/hall
- "What is token cascade efficiency?" → ${SITE_ORIGIN}/wiki/four-degrees
- "How do I check my AI coding efficiency?" → ${SITE_ORIGIN}/score
- "What is the SigRank MCP server?" → ${SITE_ORIGIN}/mcp
- "How do I use SigRank with Vercel?" → ${SITE_ORIGIN}/vercel

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
