# Canon Reconciliation — Production vs First Draft

This file exists specifically to prevent generated documentation from silently becoming canonical truth.

## Verified production authority examined

### `@sigrank/cascade`
Current pure-math source of truth for:

- Yield
- Leverage
- Velocity
- SNR
- 10xDEV
- RS05 24-stage thresholds
- field stats / rank / percentile
- a compact `operatorSignature()` convenience classifier
- normalized `OperatorEvaluation`

### `sigrank-mcp`
Consumes `@sigrank/cascade` and exposes the portable CLI/TUI/MCP instrument.

Its ontology explicitly distinguishes Class Tier from the 10-type Build Archetype system.

### `sigrank-app`
Consumes `@sigrank/cascade`, deploys SignalAF, and exposes the public HTTP MCP/reference platform.

`lib/analytics/build-archetypes.ts` implements the current 10-type Build Archetype classifier.

### Search Authority
`sigrank-app/AGENTS.md` states that a separate Search Authority master canon governs public product definitions, metrics/formulas, taxonomy, methodology claims, ecosystem relationships, and terminology.

That external canon repository was not available through the current connected-repo inspection. Therefore this package does **not** silently override it.

## Changes from the earlier generated v0.1 package

### 1. `Depth` removed from normative core

Earlier draft:
`Depth = log10(Leverage)`

Current implementation/canon terminology:
`10xDEV = log10(Leverage)`

Action:
- use `10xDEV`;
- do not standardize `Depth` unless Search Authority explicitly preserves it as an alias.

### 2. `Cache Ratio` removed from normative core

Earlier draft:
`Cache Ratio = cache_write / cache_read`

Current `@sigrank/cascade` does not expose this as a canonical core metric.

Action:
- exclude from v0.1 core.

### 3. `Construction` removed from the portable standard record

Standardization exposed a naming conflict:

- SignalAF Build Archetypes use `construction = cache_write / cache_read`;
- `@sigrank/cascade.operatorSignature()` currently derives a separate convenience ratio using `cache_write / output`.

Action:
- do not standardize either ratio under the bare name `Construction` in v0.1;
- remove Construction from the portable schema and canonical reference record;
- preserve the product implementations until a canon-led rename/reconciliation is agreed;
- treat any future Construction metric as a separately defined/versioned term.

### 4. Build Archetype authority resolved at the reference-product layer

The canonical SignalAF Build Archetype taxonomy is the 10-type composition classifier implemented in `sigrank-app/lib/analytics/build-archetypes.ts` and documented in `sigrank-mcp/ontology/taxonomy.md`:

Reuse depth:
- INPUT-BOUND
- PRIMING
- CONTEXTUAL
- DEEP READER
- ARCHIVIST

Construction:
- BUILDER
- RECURSIVE
- AMPLIFIER

Generation:
- KINETIC

Convergence:
- CONVERGENT

The six convenience labels currently emitted by `@sigrank/cascade.operatorSignature()` are not the canonical Build Archetype taxonomy.

Action:
- v0.1 defines Build Archetype as a concept but does not require the taxonomy for base compatibility;
- the 10-type classifier is a SignalAF reference extension;
- the six-label convenience field should eventually be renamed/deprecated rather than silently called the canonical archetype system.

See `ARCHETYPE_STATUS.md`.

### 5. RS05 extension status resolved; class semantics remain canon-controlled

Current production contains a cross-repo contracted 24-stage ladder whose present thresholds use aggregate token volume:

- 8 base tiers;
- 3 sub-stages each;
- 24 stages;
- UNCLASSED for no/non-finite data.

Action:
- retain RS05 as a SignalAF reference extension;
- do not require third-party SigRank compatibility to implement the ladder;
- continue cross-repo parity tests between SignalAF and sigrank-mcp.
- do not redefine Class as merely total-token volume; Class remains a scale/qualification concept under Search Authority canon;
- treat the current volume thresholds as reference-product implementation policy pending canon reconciliation, not as base-standard semantics.

See `RS05_STATUS.md`.

### 6. Primitive naming normalized without breaking implementation aliases

Standard wire:
- `input`
- `output`
- `cache_write`
- `cache_read`

Current implementation aliases:
- `cacheCreate` / `cacheRead`
- `tokens_cache_creation` / `tokens_cache_read`

Action:
- allow aliases with semantic mapping.

### 7. Canonical README SNR example is stale relative to executable math

The current `@sigrank/cascade` README example comments `snr // 0.9001` for the MO§ES reference vector.

The current executable formula in `src/index.ts` is:

`SNR = output / (input + output)`

For `(input=1,251,211, output=11,296,121)`, that evaluates to `0.9002807...`, which rounds to **0.9003** under the implementation's four-decimal policy.

Action:
- this package uses **0.9003** for the canonical reference vector;
- treat the README's `0.9001` comment as stale documentation unless Search Authority says otherwise;
- add a doc-fix task to `@sigrank/cascade`.

## Pre-publication canon gate

Before calling v0.1 stable:

- [ ] load Search Authority `sigrank` context;
- [ ] resolve the two existing Construction usages and names;
- [x] identify the current SignalAF Build Archetype authority;
- [x] classify RS05 as a reference extension rather than base compatibility requirement;
- [ ] confirm public language around "standard";
- [ ] confirm final license/trademark policy.
