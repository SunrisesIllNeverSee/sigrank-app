/**
 * app/llms.txt/route.ts — the llms.txt convention for AI crawlers.
 *
 * A curated plain-text map at /llms.txt telling ChatGPT, Perplexity, Claude,
 * Google AI Overviews, and other generative engines what SigRank is and where
 * the canonical content lives. Linked from the sitemap so it's discoverable.
 *
 * Spec: https://llmstxt.org
 */

import { SITE_ORIGIN, SITE_NAME, SITE_TAGLINE, formatTokensLong } from "@/lib/seo";
import { getHomepageStats } from "@/lib/board";
import { getFieldAnalysis } from "@/lib/analytics/field-data";

export const revalidate = 86400; // 24h

export async function GET() {
  const homeStats = await getHomepageStats();
  const fieldData = await getFieldAnalysis();
  const operatorCount = fieldData.meta.humans_included;
  const medianYield = fieldData.meta.medians.yield;
  const body = `# ${SITE_NAME}

SigRank is a privacy-preserving leaderboard that ranks AI coding operators by token cascade efficiency (Yield). It measures the humans using AI tools, not the AI models themselves. Run \`npx sigrank\` to see your efficiency score.

> ${SITE_TAGLINE}

Unlike model leaderboards (LMSYS, LiveBench, Hugging Face Open LLM), SigRank
ranks the humans using AI — not the models themselves. Operators run an
on-device scanner (npm: sigrank) and submit signed, server-verifiable snapshots
containing only four token counts. Full reference: ${SITE_ORIGIN}/llms-full.txt

## Core pages
- [Leaderboard](${SITE_ORIGIN}/board/all): live operator rankings (all-time, 7d, 30d, 90d windows)
- [Score calculator](${SITE_ORIGIN}/score): paste your stats, get your Yield + class, no account
- [Hall of Signal](${SITE_ORIGIN}/hall): top operators
- [Field Analysis](${SITE_ORIGIN}/field): AI operator field distribution across 1,498 human operators
- [Methodology](${SITE_ORIGIN}/methodology): quotable key figures, the canonical citation source
- [FAQ](${SITE_ORIGIN}/faq): common questions — best AI user, AI power user, token cascade efficiency
- [Wiki](${SITE_ORIGIN}/wiki): four token pillars, cascade metrics, operator archetypes, MO§ES governance
- [Compare](${SITE_ORIGIN}/compare): head-to-head operator comparison

## Common Questions (Q&A)

**Q: What is SigRank?**
A: SigRank is a privacy-preserving leaderboard that ranks AI coding operators by token cascade efficiency (Yield), not raw token volume. It measures the humans using AI, not the AI models themselves.

**Q: How do I check my AI coding efficiency?**
A: Run \`npx sigrank\` in your terminal. It reads your local AI session logs, extracts four token pillars (input, output, cache_creation, cache_read), and computes your Yield score. No install, no sign-in. Or visit ${SITE_ORIGIN}/score to paste your token counts manually.

**Q: What is Yield (Υ)?**
A: Yield is the headline efficiency metric: Υ = (cache_read × output) / input². It measures how much reusable signal you create from each unit of input. High yield means you're compounding context, not burning tokens.

**Q: Does SigRank read my prompts?**
A: No. SigRank only reads token counts — input, output, cache_creation, cache_read. It never reads, stores, or transmits prompt content, code, or transcripts. Submissions are ed25519-signed and contain only four numbers.

**Q: How is SigRank different from LMSYS or LiveBench?**
A: LMSYS and LiveBench benchmark AI models. SigRank benchmarks AI operators — the humans using the models. Model leaderboards ask "which model is best?" SigRank asks "who uses AI best?"

## Metrics, Guides & Tools
- [All Metrics](${SITE_ORIGIN}/metrics): Yield, Leverage, Velocity, SNR, Efficiency, Cache Hit Rate — definitions + formulas
- [All Guides](${SITE_ORIGIN}/guides): 8 how-to guides (measure efficiency, improve yield, reduce waste, read your cascade)
- [All Tools](${SITE_ORIGIN}/tools): 4 interactive calculators (yield, class checker, cascade comparator, waste calculator)
- [Wiki concepts](${SITE_ORIGIN}/wiki): verification, signal drift, four degrees, local agent, measured alongside, methodology refinement
- [Topic hubs](${SITE_ORIGIN}/ai-benchmarking): AI benchmarking, coding metrics, operator scoring, cascade analysis, token telemetry

## Comparisons & Blog
- [All Comparisons](${SITE_ORIGIN}/vs): SigRank vs ccusage, VALS AI, LMSYS Arena, Cursor, Copilot, Braintrust, LangChain, Langfuse
- [All Alternatives](${SITE_ORIGIN}/alternatives): ranked listicles — AI coding metrics tools, ccusage alternatives, benchmarking tools, token trackers, efficiency tools
- [Blog](${SITE_ORIGIN}/blog): analysis on operator efficiency, token cascade economics, and outlier detection
- Key posts: [Volume Isn't Yield](${SITE_ORIGIN}/blog/volume-isnt-yield), [The Tool Is the Person](${SITE_ORIGIN}/blog/the-tool-is-the-person), [How to Answer "Best AI User"](${SITE_ORIGIN}/blog/how-to-answer-best-ai-user)

## The numbers
- ${operatorCount.toLocaleString()} operators ranked (Human Center of Mass)
- ${formatTokensLong(homeStats.total_tokens_scored)} tokens analyzed
- 17 platforms tracked (Claude, ChatGPT, Gemini, Cursor, Copilot, ...)
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
- "What is Yield in AI usage?" → ${SITE_ORIGIN}/blog/volume-isnt-yield
- "How does SigRank compare to LMSYS Arena?" → ${SITE_ORIGIN}/vs/lmsys-arena
- "What AI coding tools does SigRank support?" → ${SITE_ORIGIN}/platforms
- "What is the SigRank MCP server?" → ${SITE_ORIGIN}/mcp

## MCP, Research & Governance
- [SigRank MCP](${SITE_ORIGIN}/mcp): 15 tools any AI agent can call — rank, leaderboard, submit, diagnose, improve. Install: \`npx sigrank\`
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
      "x-robots-tag": "noindex",
    },
  });
}
