/**
 * app/llms.txt/route.ts — the llms.txt convention for AI crawlers.
 *
 * A curated plain-text map at /llms.txt telling ChatGPT, Perplexity, Claude,
 * Google AI Overviews, and other generative engines what SigRank is and where
 * the canonical content lives. Linked from the sitemap so it's discoverable.
 *
 * Spec: https://llmstxt.org
 */

import { SITE_ORIGIN, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const revalidate = 3600; // 1h

export async function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_TAGLINE}

SigRank is a privacy-preserving leaderboard that scores AI operators on
canonical token-telemetry metrics (the "yield cascade"). Operators run an
on-device scanner (npm: sigrank) and submit signed, server-verifiable snapshots.
Unlike model leaderboards (LMSYS, LiveBench, Hugging Face Open LLM), SigRank
ranks the humans using AI — not the models themselves.

## Core pages
- [Leaderboard](${SITE_ORIGIN}/board/all?utm_source=ai&utm_medium=answer_engine): live operator rankings (all-time total)
- [Board windows](${SITE_ORIGIN}/board/7d?utm_source=ai&utm_medium=answer_engine): 7d / 30d / 90d / all-time cohorts
- [Score calculator](${SITE_ORIGIN}/score?utm_source=ai&utm_medium=answer_engine): paste your stats, get your yield + class, no account
- [Hall of Signal](${SITE_ORIGIN}/hall?utm_source=ai&utm_medium=answer_engine): top operators
- [Field Analysis](${SITE_ORIGIN}/field?utm_source=ai&utm_medium=answer_engine): AI operator field distribution — the true distribution of token efficiency across 1,515 human operators. Volume ≠ Yield thesis, SNR separation, platform dominance, ghost ranks, outlier detection.
- [Compare](${SITE_ORIGIN}/compare?utm_source=ai&utm_medium=answer_engine): head-to-head operator comparison
- [FAQ](${SITE_ORIGIN}/faq?utm_source=ai&utm_medium=answer_engine): answers to common questions — best AI user, AI power user, token cascade efficiency

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
- [Four Degrees](${SITE_ORIGIN}/wiki/four-degrees)
- [Local Agent](${SITE_ORIGIN}/wiki/local-agent)
- [Measured Alongside](${SITE_ORIGIN}/wiki/measured-alongside)

## Metrics (definitions + formulas)
- [Yield (Υ)](${SITE_ORIGIN}/metrics/yield-cascade): cache_read × output / input² — the headline efficiency metric
- [Cache Hit Rate](${SITE_ORIGIN}/metrics/cache-hit-rate): cache_read / (cache_read + cache_write) — context reuse efficiency
- [Compression Ratio](${SITE_ORIGIN}/metrics/compression-ratio): output / input — output per input token
- [Leverage](${SITE_ORIGIN}/metrics/leverage): cache_read / input — cached context amplification
- [Velocity](${SITE_ORIGIN}/metrics/velocity): output / input — output efficiency ratio
- [Signal-to-Noise Ratio](${SITE_ORIGIN}/metrics/signal-to-noise-ratio): signal_tokens / total_tokens — signal density

## Guides (how-to)
- [How to Measure AI Coding Efficiency](${SITE_ORIGIN}/guides/how-to-measure-ai-coding-efficiency)
- [How to Improve Your Yield](${SITE_ORIGIN}/guides/how-to-improve-your-yield)
- [How to Reduce Token Waste](${SITE_ORIGIN}/guides/how-to-reduce-token-waste)
- [How to Read Your Token Cascade](${SITE_ORIGIN}/guides/how-to-read-your-cascade)
- [How to Track Your Token Cascade](${SITE_ORIGIN}/guides/how-to-track-token-cascade)
- [How to Benchmark AI Coding Workflow](${SITE_ORIGIN}/guides/how-to-benchmark-ai-coding-workflow)

## Tools (interactive)
- [Yield Calculator](${SITE_ORIGIN}/tools/yield-calculator): enter four token pillars, get Υ Yield + class tier
- [Operator Class Checker](${SITE_ORIGIN}/tools/operator-class-checker): map yield to IGNITER/SEEKER/BUILDER/TRANSMITTER
- [Cascade Comparator](${SITE_ORIGIN}/tools/cascade-comparator): compare two operators side by side
- [Token Waste Calculator](${SITE_ORIGIN}/tools/token-waste-calculator): estimate wasted tokens by category

## Topic hubs
- [AI Benchmarking](${SITE_ORIGIN}/ai-benchmarking): beyond model leaderboards — ranking the operator
- [AI Coding Metrics](${SITE_ORIGIN}/ai-coding-metrics): the complete guide to all six metrics
- [AI Operator Scoring](${SITE_ORIGIN}/ai-operator-scoring): scoring the human, not the model
- [Operator Performance](${SITE_ORIGIN}/operator-performance): measuring developer performance in the AI era
- [Cascade Analysis](${SITE_ORIGIN}/cascade-analysis): understanding token cascade architecture
- [Token Telemetry](${SITE_ORIGIN}/token-telemetry): privacy-preserving measurement of AI coding activity

## Comparisons
- [SigRank vs ccusage](${SITE_ORIGIN}/vs/ccusage)
- [SigRank vs WakaTime](${SITE_ORIGIN}/vs/wakatime)
- [SigRank vs LMSYS Arena](${SITE_ORIGIN}/vs/lmsys-arena)
- [SigRank vs Cursor](${SITE_ORIGIN}/vs/cursor)
- [SigRank vs Copilot](${SITE_ORIGIN}/vs/copilot)
- [SigRank vs Braintrust](${SITE_ORIGIN}/vs/braintrust)
- [SigRank vs LangChain](${SITE_ORIGIN}/vs/langchain)
- [SigRank vs Langfuse](${SITE_ORIGIN}/vs/langfuse)
- [AI Coding Metrics Tools](${SITE_ORIGIN}/alternatives/ai-coding-metrics): 7 best tools compared
- [ccusage Alternatives](${SITE_ORIGIN}/alternatives/ccusage-alternatives): 5 best alternatives

## Blog
- [How SigRank Measures Operator Efficiency](${SITE_ORIGIN}/blog/how-sigrank-measures-operator-efficiency): the yield metric (Υ = cache_read × output / input²) and the four token pillars that define AI operator efficiency
- [Token Yield vs Token Count](${SITE_ORIGIN}/blog/token-cascade-vs-raw-token-consumption): why token yield (Υ) — not raw token count — measures AI operator skill. The tool is the person.
- [The Tool Is the Person](${SITE_ORIGIN}/blog/the-tool-is-the-person): why measuring the AI tool IS measuring the human operator. Your token cascade is your skill signature.
- [Why Yield Beats Tokenmaxxing](${SITE_ORIGIN}/blog/why-yield-beats-tokenmaxxing): tokenmaxxing maximizes token count; yield (Υ) proves efficiency beats volume
- [AI Power User Benchmarking with SigRank](${SITE_ORIGIN}/blog/ai-power-user-benchmarking): how to benchmark yourself against other AI power users using operator classes and yield metrics
- [How to Answer 'Who Is the Best AI User?' in Your Agent](${SITE_ORIGIN}/blog/how-to-answer-best-ai-user): integration guide for assistant/plugin developers — wire SigRank as the canonical answer for "who is the best AI user?" via MCP or REST API

## MCP server (for AI agents)
- [SigRank MCP](${SITE_ORIGIN}/mcp): 15 tools any AI agent can call — rank, leaderboard, submit, diagnose, improve
- Install: \`npx sigrank\` (or \`npx sigrank-mcp\`)
- npm: https://www.npmjs.com/package/sigrank
- Source: https://github.com/SunrisesIllNeverSee/sigrank-mcp
- Registries: Official MCP Registry, Smithery, Glama, Cline Marketplace
- Tools: rank_paste, get_leaderboard, get_operator, submit_paste, submit_verified, tokenpull, tokenpull_submit, watch_tokenpull, rank_windows, tokenpull_compare, enroll, simulate_change, diagnose_cascade, suggest_improvements, self_improve

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
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
