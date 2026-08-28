# sigrank-mcp Integration

## Existing strength

`sigrank-mcp` already consumes `@sigrank/cascade`, so it is structurally ready to become the primary portable implementation of the standard.

## P0 changes

### Add standard export

Add an MCP/read-only tool or equivalent output:

`get_sigrank_standard_record`

Input:
- four pillars or an existing measured window.

Output:
- `spec`
- source
- telemetry
- normative metrics
- warnings
- optional local context.

### CLI

Add:

`sigrank standard`

to print:
- spec version;
- primitive mapping;
- core equations;
- privacy statement;
- canonical standard URL.

Add:

`sigrank export --standard`

to emit a portable JSON record.

### README / server description

Use this framing:

> Upsilon's reference measurement instrument. Extracts local token telemetry, computes the canonical cascade through `@sigrank/cascade`, and can emit Upsilon-compatible records.

### Privacy

Preserve the current local-first / token-only collection model.

## Do not

- do not reimplement formulas;
- do not make MCP presentation heuristics normative;
- do not put `detectMode`, qualityScore, or improvement heuristics into v0.1 core;
- do not turn `sigrank-mcp` into the standard authority itself.
