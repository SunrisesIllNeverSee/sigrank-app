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

The connected `mos2es-site` repository is verified as the static `mos2es.com` governance site. The separate `moses` repository is verified as the public commercial marketing site live at **mos2es.org**. These are intentionally distinct surfaces.

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

These are the five portable core metrics implemented by the current canonical cascade path.

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

## Classification and terminology decisions

Standardization has now separated the portable core from SignalAF's interpretation layers:

- **Depth** is not the normative name for `log10(Leverage)`; use **10xDEV**.
- **Cache Ratio** is not a v0.1 core metric.
- **Construction** is reserved outside the v0.1 portable core because existing product code uses the same word for two different ratios. It must be canonically reconciled before standardization.
- **Build Archetype** is a SignalAF reference extension. The current canonical SignalAF classifier has 10 deterministic types across reuse, construction, generation, and convergence families.
- **RS05 Class Tier** is a 24-stage SignalAF reference extension: 8 base tiers × 3 sub-stages. Its current volume-threshold implementation is a reference-product detail under canon reconciliation, not the normative definition of Class.
- Neither Build Archetype nor RS05 is required for base `SigRank Compatible — v0.1-draft` status.

See:

- `CANON_RECONCILIATION.md`
- `ARCHETYPE_STATUS.md`
- `RS05_STATUS.md`

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
- mos2es.org → public enterprise commercial front face for pilots; controlled/private deployment can sit behind the offer; enterprise terminology remains intentionally distinct
- mos2es.com → current governance/research face; broader MO§ES umbrella/hub architecture is a separate ecosystem decision and is not defined by this standard
```

## What is open vs what remains product-specific

### Open standard layer

- primitive semantics
- five core metric equations
- null semantics
- interchange schema
- versioning
- privacy invariant
- compatibility requirements
- reference test vectors

### Reference/product layer

- Build Archetype taxonomy and thresholds
- RS05 Class Tier taxonomy and thresholds
- public board eligibility
- rank presentation
- anti-gaming systems
- proprietary server-side cuts
- reference-field composition
- badge policy
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
3. `ARCHETYPE_STATUS.md`
4. `RS05_STATUS.md`
5. `reference/IMPLEMENTATION_MAP.md`
6. `launch/TONIGHT_30_STEP_EXECUTION.md`
7. `launch/TOMORROW_DISTRIBUTION_PLAN.md`
8. `strategy/LAND_GRAB_FLYWHEEL.md`
9. `integrations/`
10. `REPO_EXTRACTION.md`
