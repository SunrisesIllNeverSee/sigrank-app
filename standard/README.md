# SigRank Standard

> **The new standard in operator metrics.**

**Status:** proposed open standard  
**Draft:** `0.1-draft`  
**Drop-in location:** `sigrank-app/standard/`  
**Extraction target:** future standalone `sigrank-standard` repository

SigRank Standard defines a portable measurement vocabulary for the **human operator layer** of generative AI systems.

This draft has been reconciled against the connected production repositories:

- `sigrank-app` — SignalAF public reference platform
- `sigrank-mcp` — CLI/TUI/MCP instrument
- `sigrank-cascade` — canonical pure-math implementation package
- `sigarena` — `sigeconomy.com` read-only satellite / SEO-AEO surface

The connected `mos2es-site` repository is verified as the static `mos2es.com` governance site. The package also includes a separate integration plan for **mos2es.org** as requested, but does **not** falsely assert that `mos2es-site` deploys `mos2es.org`.

## Core category claim

```text
BUSINESS OUTCOMES
        ↑
ORGANIZATIONAL AI PERFORMANCE
        ↑
AI OPERATOR PERFORMANCE       ← SIGRANK STANDARD
        ↑
AGENT PERFORMANCE
        ↑
TASK PERFORMANCE
        ↑
MODEL PERFORMANCE
        ↑
INFRASTRUCTURE
```

SigRank standardizes the operator layer. It does not replace model benchmarks, task evals, agent evals, observability, or business-outcome systems.

## Base telemetry primitives

The normative wire names for the draft are:

| Symbol | Standard name | Wire field |
|---|---|---|
| `I` | Input | `input` |
| `O` | Output | `output` |
| `W` | Cache Write / Cache Creation | `cache_write` |
| `R` | Cache Read | `cache_read` |

Implementation aliases are allowed. Current production mappings include:

- `@sigrank/cascade`: `cacheCreate`, `cacheRead`
- SignalAF ingest: `tokens_cache_creation`, `tokens_cache_read`
- SignalAF HTTP MCP: `cache_write`, `cache_read`

A compatible implementation MUST preserve semantics when translating aliases.

## Normative core metrics in v0.1-draft

These are the metrics implemented by the current canonical `@sigrank/cascade` package and exposed by the production MCP surface.

### Yield (Υ)

`Υ = (R × O) / I² = (R / I) × (O / I)`

### Leverage (L)

`L = R / I`

### Velocity (V)

`V = O / I`

### SNR (S)

`S = O / (I + O)`

### 10xDEV

`10xDEV = log10(R / I)`

The current canonical implementation only computes 10xDEV when all four pillars are positive, and otherwise returns `null` with a warning.

## Important reconciliation from the first draft

The earlier package treated **Depth** and **Cache Ratio** as core standard metrics. That did not match the current production source of truth.

This revised package therefore:

- uses **10xDEV** as the canonical `log10(Leverage)` name;
- removes **Cache Ratio** from the normative v0.1 core;
- treats **Construction** (`cache_write / output`) as an implementation-derived signature component, not yet a normative core metric;
- keeps archetypes non-normative until the existing taxonomy mismatch is resolved;
- keeps RS05 class/rank/leaderboard logic outside the base metric standard.

See `CANON_RECONCILIATION.md`.

## Product relationship

```text
SigRank Standard
OPEN MEASUREMENT SPECIFICATION
        │
        ↓
@sigrank/cascade
REFERENCE MATH IMPLEMENTATION
        │
        ├────────────────────┐
        ↓                    ↓
sigrank-mcp              sigrank-app
INSTRUMENT               REFERENCE PLATFORM
        │                    │
        └─────────┬──────────┘
                  ↓
          SignalAF Reference Field
                  ↓
                 Board

Distribution / extensions:
- sigeconomy.com → read-only public discovery, comparison, SEO/AEO/GEO
- mos2es.org → enterprise/private organizational implementation surface
- mos2es.com → governance framework / architecture context
```

## What is open vs what remains product-specific

### Open standard layer

- primitive semantics
- core metric equations
- null semantics
- interchange schema
- versioning
- privacy invariant
- compatibility requirements
- reference test vectors

### Reference/product layer

- public board eligibility
- rank presentation
- anti-gaming systems
- proprietary server-side cuts
- reference-field composition
- RS05 / badge policy if not explicitly standardized
- operator identity / claim systems
- enterprise benchmark corpus

## Privacy invariant

A base-compatible implementation MUST NOT require:

- prompt text;
- source code;
- response text;
- repository contents;
- files; or
- other semantic payloads

to calculate the core SigRank metrics.

## Start here

1. `SPEC.md`
2. `CANON_RECONCILIATION.md`
3. `reference/IMPLEMENTATION_MAP.md`
4. `launch/TONIGHT_30_STEP_EXECUTION.md`
5. `launch/TOMORROW_DISTRIBUTION_PLAN.md`
6. `strategy/LAND_GRAB_FLYWHEEL.md`
7. `integrations/`
8. `REPO_EXTRACTION.md`
