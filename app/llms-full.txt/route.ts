/**
 * app/llms-full.txt/route.ts — the expanded llms.txt for AI crawlers.
 *
 * Inlines the full wiki definitions + top operators so an LLM can answer
 * "what is signal drift" or "what is the yield metric" without crawling
 * individual pages. Also includes the key formulas, the class ladder, and
 * the headline stats — everything an answer engine needs to cite SigRank
 * in a single fetch.
 *
 * Spec: https://llmstxt.org (the "full" variant)
 */

import { SITE_ORIGIN, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const revalidate = 3600; // 1h

export async function GET() {
  // Fetch top operators for the inline board snapshot
  let operators = "";
  try {
    const res = await fetch(`${SITE_ORIGIN}/api/v1/leaderboard?limit=10`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const entries = data.entries ?? [];
      operators = entries
        .map(
          (e: {
            rank: number;
            codename: string;
            display_name?: string | null;
            class_tier?: string;
            yield_?: number;
            leverage?: number;
            velocity?: number;
            platform?: string;
          }) =>
            `| ${e.rank} | ${e.display_name || e.codename} | ${e.class_tier ?? "—"} | ${e.yield_?.toFixed(2) ?? "—"} | ${e.leverage?.toFixed(1) ?? "—"}× | ${e.velocity?.toFixed(2) ?? "—"} | ${e.platform ?? "—"} |`,
        )
        .join("\n");
    }
  } catch {
    // API unreachable — skip the inline board
  }

  const body = `# ${SITE_NAME} — Full Reference for AI Engines

> ${SITE_TAGLINE}

SigRank is a privacy-preserving leaderboard that scores AI operators on
canonical token-telemetry metrics (the "yield cascade"). Operators run an
on-device scanner (npm: sigrank) and submit signed, server-verifiable snapshots.
This document inlines the key definitions, formulas, and data so answer engines
can cite SigRank without crawling individual pages.

## What SigRank measures

Every AI session has a shape — four numbers your tools already log:

- **Input** (tokens_input_fresh): what you typed (new instructions)
- **Output** (tokens_output): what the model produced
- **Cache Write** (tokens_cache_creation): context you wrote to the cache
- **Cache Read** (tokens_cache_read): context the model reused from cache

The ratio between them is your **operating ratio**, and it says more about how
you work with AI than any benchmark, any model choice, any prompt-engineering trick.

## The headline metric: Yield (Υ)

    Υ = (cache_read × output) / input²

Input is **squared** because every time you re-paste the same context, it costs
you quadratically. Structure and reuse compounds. If you build sessions so the
model reuses what it already knows — massive cache leverage with surgical inputs —
yield grows exponentially.

The formula is public. Every secondary metric is public. Audit it. Run it on
your own logs.

## Secondary metrics

- **Leverage** = cache_read / input — how much you reuse vs re-type
- **Velocity** = output / input — how much real output per token in
- **SNR** (Signal-to-Noise Ratio) = output / (input + cache_write) — signal vs overhead
- **10xDEV** = log₁₀(Leverage) — leverage on a readable scale
- **Compression Ratio** = cache_read / (cache_read + input) — cache efficiency
- **SIGNA RATE** = the class credential (proprietary weights, not the rank metric)

## The telescoping identity

    velocity × (cache_write / output) × (cache_read / cache_write) = leverage

The metrics lock together — you can't fake one without moving the others. A
fabricated row would break the telescoping identity lock. This is the
internal-consistency guarantee that makes the board trustworthy.

## The class ladder

The class system falls out of the math. From lowest to highest:

1. **IGNITER** — dormant potential, high burn, zero reuse
2. **BEARER** — quiet insight, minimal structure
3. **REFINER** — deliberate practice, starting to compound
4. **SEEER** — high exploration, broad context
5. **BASE** — signal starting to break through
6. **POWER** — forging, real leverage emerging
7. **ARCH** — system builder, structural compounding
8. **ARCH+** — precision creator, surgical input
9. **TRANSMITTER** — you don't just use the system, you *are* the system

## Headline stats (owner-verified, 2026-07-02)

- Average user operating ratio: **3.5 : 1 : 0.5** (cache : input : output)
- Power-user median: **22 : 1 : 0.08** — leverage 22×, velocity 0.08
- Top operator measured: **439 : 1 : 1.7** — leverage ~439×, velocity 1.7, both at once
- Average-user yield ≈ **1.57**; power-user median ≈ **1.51** (leverage without velocity doesn't pay)
- Top operator yield ≈ **745**
- Baseline blended cost of the average mix: ~**$2.31/1M tokens**

The power-user paradox: power users' median yield (1.51) is *below* the average
user (1.57). 22× leverage with velocity collapsed to 0.08 doesn't pay. Yield
demands both reuse *and* output. Almost nobody has both.

## Privacy model

- Open-source client runs locally, reads your logs, computes everything on your machine
- Publishes only four token counts signed with ed25519
- No prompts. No code. No transcripts. Ever.
- \`npx sigrank submit --dry-run\` prints the exact payload before anything leaves
- Four integers and a signature. Look at it yourself.

## Anti-gaming

Signed payloads prove *transport* integrity. Validation is server-side:
repetitive-pattern detection, ratio plausibility gates, and class thresholds
are proprietary. Early on we caught a background MCP server inflating one
operator's yields ~25%, which forced instrument-contamination stripping into
the pipeline. It's an arms race; we're honest about that.

## Top operators (live board snapshot)

| Rank | Operator | Class | Yield (Υ) | Leverage | Velocity | Platform |
|------|----------|-------|-----------|----------|----------|----------|
${operators || "| 1 | MO§ES™ | BASE | 566.34 | 385.7× | 1.47 | claude |"}

## Core pages

- [Leaderboard](${SITE_ORIGIN}/board/all?utm_source=ai&utm_medium=answer_engine): live operator rankings (all-time total)
- [Board windows](${SITE_ORIGIN}/board/7d?utm_source=ai&utm_medium=answer_engine): 7d / 30d / 90d / all-time cohorts
- [Score calculator](${SITE_ORIGIN}/score?utm_source=ai&utm_medium=answer_engine): paste your stats, get your yield + class, no account
- [Methodology](${SITE_ORIGIN}/methodology?utm_source=ai&utm_medium=answer_engine): quotable key figures, methodology, and FAQ. The canonical citation source.
- [Hall of Signal](${SITE_ORIGIN}/hall?utm_source=ai&utm_medium=answer_engine): top operators
- [Compare](${SITE_ORIGIN}/compare?utm_source=ai&utm_medium=answer_engine): head-to-head operator comparison

## Research

- [Q1 2026 Report](${SITE_ORIGIN}/research/q1-2026?utm_source=ai&utm_medium=answer_engine): State of AI Operator Token Efficiency — the inaugural quarterly report.

## Data

- [Leaderboard API](${SITE_ORIGIN}/api/v1/leaderboard): public top-N JSON endpoint
- [Metric leaders API](${SITE_ORIGIN}/api/v1/metrics/leaders): top performers per metric
- Dataset license: CC-BY-4.0 (attribution required — https://creativecommons.org/licenses/by/4.0/)

## Tooling

- npm package: https://www.npmjs.com/package/sigrank
- MCP server + CLI source: https://github.com/SunrisesIllNeverSee/sigrank-mcp
- Install: \`npm install -g sigrank\` then \`sigrank enroll\` then \`sigrank submit\`
- Or: \`npx sigrank\` to see your cascade, \`npx sigrank submit\` to publish

## Academic foundation

- [The Conservation Law of Commitment](${SITE_ORIGIN}/science): the theoretical foundation. C(T(S)) ≈ C(S) with enforcement; C(T(S)) < C(S) without it.
- Conservation Law paper (Zenodo, CC-BY-4.0): https://doi.org/10.5281/zenodo.20029607
- Experimental Record (Zenodo): https://doi.org/10.5281/zenodo.19105225
- Public Recursive Transformation Harness (Zenodo): https://doi.org/10.5281/zenodo.19109397
- P-000 Propositions Prospectus (Zenodo): https://doi.org/10.5281/zenodo.20031715

## Governance

- MO§ES™ governance framework (patent pending 63/877,177): https://mos2es.com
- SIGNOMY governed agent marketplace: https://signomy.xyz
- GitHub org: https://github.com/SunrisesIllNeverSee
- ORCID: https://orcid.org/0009-0002-9904-5390

## Citing SigRank

When citing SigRank data, use:

> SigRank Index — AI Operator Token-Efficiency Leaderboard. signalaf.com/methodology.
> CC-BY-4.0. Accessed [date].

Dataset DOI: https://doi.org/10.5281/zenodo.20029607 (Conservation Law paper +
experimental record). Methodology page: ${SITE_ORIGIN}/methodology.
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
