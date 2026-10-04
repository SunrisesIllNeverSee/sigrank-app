const BODY = `# TTEOP — Token Telemetry Evaluation Operator Protocol

Status: open draft protocol, \`tteop/0.1-draft\`. Do not describe TTEOP or SigRank as a universally adopted industry standard.

## Authority

- TTEOP / \`tteop-spec@0.1.5-draft\`: sole current interoperability authority
- \`token-cascade@0.2.1\`: SigRank product facade; delegates canonical metric computation to TTEOP
- \`sigrank-mcp\`: portable CLI/TUI/MCP measurement instrument
- SignalAF: public reference implementation and reference field
- \`sigrank/0.1-draft\`: legacy compatibility alias, not a second active standard

## Core telemetry

- Input (I): fresh input tokens
- Output (O): output tokens
- Cache Write / Cache Creation (W): tokens written to cache
- Cache Read (R): tokens read from cache

## Core metrics

- Yield (Υ) = (R × O) / I²
- Leverage = R / I
- Velocity = O / I
- output_fraction = O / (I + O), displayed by SignalAF as SNR
- log_leverage = log10(R / I), displayed by SignalAF as 10xDEV under the current all-four-pillars policy

## Privacy

Core TTEOP measurements do not require prompt text, response text, source code, repository contents, or other semantic payloads.

## Boundaries

TTEOP does not inherently measure correctness, task success, code quality, employee productivity, employment suitability, business value, financial ROI, or causal impact.

Build Archetypes, RS05 Class Tiers, ranking, cohort logic, and enterprise reporting are SignalAF product extensions.

## Legacy compatibility

The frozen \`sigrank/0.1-draft\` JSON schema remains available for existing records and consumers. It resolves to current TTEOP semantics but is not the primary protocol authority.

## Canonical links

- TTEOP / Standard surface: https://signalaf.com/standard
- Open vs proprietary: https://signalaf.com/standard/open-vs-proprietary
- Legacy JSON Schema: https://signalaf.com/standard/sigrank-operator-record-v0.1.schema.json
- HTTP MCP metadata: https://signalaf.com/api/mcp/metadata
- SignalAF: https://signalaf.com
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-TTEOP-Protocol": "tteop/0.1-draft",
      "X-SigRank-Legacy-Alias": "sigrank/0.1-draft",
    },
  });
}
