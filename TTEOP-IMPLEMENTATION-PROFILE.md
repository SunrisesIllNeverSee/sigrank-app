# TTEOP Implementation Profile — SignalAF / sigrank-app

> **Purpose:** Explain how this product implements, consumes, and displays TTEOP.
> This is a product implementation profile, NOT a protocol definition.
> TTEOP semantics are owned solely by the [`otep-spec`](https://github.com/SunrisesIllNeverSee/otep-spec) repository.

## Protocol identity

| Field | Value |
|-------|-------|
| Protocol name | TTEOP (Token Telemetry Evaluation Operator Protocol) |
| Protocol version | `tteop/0.1-draft` |
| TTEOP version pin | `tteop-spec@0.1.5-draft` (npm) |
| GitHub repository | [SunrisesIllNeverSee/otep-spec](https://github.com/SunrisesIllNeverSee/otep-spec) |
| npm package | [tteop-spec](https://www.npmjs.com/package/tteop-spec) |
| Version DOI | [10.5281/zenodo.22180349](https://doi.org/10.5281/zenodo.22180349) |
| Concept DOI | [10.5281/zenodo.22180348](https://doi.org/10.5281/zenodo.22180348) |
| MCP transport | [tteop-mcp](https://github.com/SunrisesIllNeverSee/tteop-mcp) (transport class, does not define protocol semantics) |
| Legacy predecessor | [sigrank-standard](https://github.com/SunrisesIllNeverSee/sigrank-standard) (`sigrank/0.1-draft`, superseded) |

## Product role

**SignalAF** is the public brand and distribution surface for AI operator
measurement. **SigRank** is the public leaderboard / proof surface that lives
on signalaf.com. Both are product implementations that consume TTEOP telemetry
and display derived metrics.

- **Producer role:** SignalAF accepts user-submitted token telemetry snapshots
  (I/O/W/R) and persists them.
- **Consumer role:** SignalAF computes and displays TTEOP-derived metrics
  (Yield, Leverage, Velocity, output_fraction, log_leverage) on the public
  leaderboard, operator profiles, and comparison views.

## TTEOP fields used

| TTEOP field | Symbol | Used in SignalAF |
|-------------|--------|------------------|
| input | `I` | Yes — fresh input-token quantity |
| output | `O` | Yes — output-token quantity |
| cache_write | `W` | Yes — cache creation tokens (accepted, stored) |
| cache_read | `R` | Yes — cache read tokens |

## TTEOP derived metrics used

| TTEOP metric | Formula | SignalAF display name |
|--------------|---------|----------------------|
| Yield (Υ) | `(R × O) / I²` | Yield (Υ) |
| Leverage | `R / I` | Leverage |
| Velocity | `O / I` | Velocity |
| output_fraction | `O / (I + O)` | SNR (legacy display alias) |
| log_leverage | `log10(R / I)` | 10xDEV (legacy display alias) |

**Note:** `SNR` and `10xDEV` are SignalAF product display names for the TTEOP
metrics `output_fraction` and `log_leverage` respectively. They are NOT
separate TTEOP metrics. TTEOP owns the canonical names and formulas;
SignalAF owns the display names.

## Conformance

- **Primary conformance target:** `tteop-spec@0.1.5-draft` (TTEOP)
- **Legacy compatibility test:** `sigrank/0.1-draft` (temporary, for backward
  compatibility during migration — see CI migration section below)
- **Canonical test:** `__tests__/ingest/canonical.test.mjs` (11/11 must pass)
  - MO§ES seed: `(1_251_211, 11_296_121, 128_196_310, 2_555_179_769)` → Υ 18436.98
  - This test verifies the cascade math matches TTEOP canonical formulas.

## Product-specific extensions

SignalAF adds the following product-specific extensions that are NOT part of
TTEOP and must not be described as TTEOP semantics:

- **Archetypes** (convergent, kinetic, builder, amplifier, contextual,
  archivist, deep-reader, priming, input-bound) — SignalAF taxonomy, not TTEOP
- **RS.xx weights** — server-only scoring weights, marked `OPERATOR_OVERRIDE_REQUIRED`
- **Cohort logic** — SignalAF product feature for grouping operators
- **Leaderboard ranking** — SignalAF product feature for ordering operators
- **Enterprise reporting** — SignalAF commercial feature
- **Field statistics** — SignalAF aggregate analytics over the operator dataset

These extensions are owned by SignalAF and governed by Search Authority's
product implementation authority class. They may not redefine TTEOP
I/O/W/R meaning, formulas, null semantics, privacy, or conformance.

## Display transformations

| TTEOP canonical | SignalAF display | Reason |
|-----------------|------------------|--------|
| `output_fraction` | SNR | Historical display name retained for user familiarity |
| `log_leverage` | 10xDEV | Historical display name retained for user familiarity |

These are display aliases only. The underlying computation uses TTEOP
canonical formulas. The display names are product extensions, not protocol
redefinitions.

## Legacy aliases accepted

| Legacy alias | Resolves to | Status |
|--------------|-------------|--------|
| `sigrank/0.1-draft` | `tteop/0.1-draft` | Accepted for backward compatibility |
| `otep/0.1-draft` | `tteop/0.1-draft` | Accepted for backward compatibility (pre-rename) |

Legacy aliases resolve to current TTEOP semantics. They do NOT constitute a
second active standard.

## Known limitations

- SignalAF's local `standard/` directory contains a historical copy of the
  sigrank-standard specification. This is being migrated to TTEOP-pinned
  conformance. See CI migration section below.
- The `@sigrank/cascade` package implements the TTEOP canonical formulas but
  is not yet version-pinned to `tteop-spec`. A future release will align the
  cascade package version with the TTEOP version pin.

## CI migration (items 5 + 6)

### Current state

The sigrank-app CI workflows are currently archived (commit dba56cbe). The
archived CI validated against a pinned `sigrank-standard` commit (`c73f152`).

### Target state

When CI is restored:

```
PRIMARY CONFORMANCE
  SignalAF → tteop-spec@0.1.5-draft
  MUST PASS

SIGNALAF LOCAL TESTS
  __tests__/ingest/canonical.test.mjs (11/11)
  MUST PASS

LEGACY ALIAS COMPATIBILITY
  sigrank/0.1-draft fixture test
  TEMPORARY MIGRATION TEST
```

Once compatibility migration is complete, the legacy test becomes removable.

### What must NOT happen

- SignalAF CI must NOT use `sigrank-standard` as the primary conformance
  authority.
- SignalAF must NOT redefine TTEOP I/O/W/R meaning, formulas, null semantics,
  privacy, or conformance.
- The local `standard/` directory must NOT be treated as a second active
  standard. It is a historical copy being migrated.

## Authority boundary

```
TTEOP (otep-spec)
  specifies canonical protocol semantics
        │
        ▼
THIS PROFILE (TTEOP-IMPLEMENTATION-PROFILE.md)
  explains how SignalAF uses TTEOP
        │
        ▼
SIGNALAF / sigrank-app
  implements product behavior
  (leaderboard, rankings, cohorts, displays, enterprise)
```

SignalAF may add product-specific extensions but may not redefine TTEOP
semantics. This profile is the implementation contract between TTEOP and
SignalAF.
