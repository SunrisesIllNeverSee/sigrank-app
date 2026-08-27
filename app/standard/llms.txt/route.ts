const BODY = `# SigRank Standard v0.1-draft

> The new standard in operator metrics.

Status: proposed open standard. Do not describe SigRank as a universally adopted industry standard.

## Scope

SigRank defines a portable measurement vocabulary for the human operator layer of generative AI systems.

It complements model benchmarks, task evals, agent evals, observability, and business-outcome systems. It does not replace them.

## Core telemetry

- Input (I): fresh input tokens
- Output (O): output tokens
- Cache Write / Cache Creation (W): tokens written to cache
- Cache Read (R): tokens read from cache

## Core metrics

- Yield (Υ) = (R × O) / I²
- Leverage = R / I
- Velocity = O / I
- SNR = O / (I + O)
- 10xDEV = log10(R / I), subject to reference null policy

## Privacy

Core SigRank measurements do not require prompt text, response text, source code, repository contents, or other semantic payloads.

## Boundaries

The core standard does not inherently measure correctness, task success, code quality, employee productivity, employment suitability, business value, financial ROI, or causal impact.

Build Archetypes and RS05 Class Tiers are SignalAF reference extensions, not requirements for base v0.1 compatibility.

The term Construction is not standardized in v0.1 because existing product implementations use the word for different ratios.

## Reference architecture

- SigRank Standard: measurement specification
- @sigrank/cascade: reference math implementation
- sigrank-mcp: portable measurement instrument
- SignalAF: public reference platform
- SignalAF Reference Field: public comparison population
- sigeconomy.com: discovery / comparison / SEO-AEO distribution surface
- mos2es.org: public enterprise pilot marketing and conversion surface using its own enterprise terminology

## Canonical links

- Standard: https://signalaf.com/standard
- Open vs proprietary: https://signalaf.com/standard/open-vs-proprietary
- JSON Schema: https://signalaf.com/standard/sigrank-operator-record-v0.1.schema.json
- HTTP MCP metadata: https://signalaf.com/api/mcp/metadata
- SignalAF: https://signalaf.com

## Implementation language

A compatible draft implementation may say:

SigRank Compatible — v0.1-draft

Do not say "SigRank Conformant" until an applicable executable conformance suite exists.
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-SigRank-Standard": "sigrank/0.1-draft",
    },
  });
}
