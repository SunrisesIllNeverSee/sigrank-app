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
- RS05 24-stage class thresholds
- field stats / rank / percentile
- operator signature / reference archetype implementation
- normalized `OperatorEvaluation`

### `sigrank-mcp`
Consumes `@sigrank/cascade` and exposes the portable CLI/TUI/MCP instrument.

### `sigrank-app`
Consumes `@sigrank/cascade`, deploys SignalAF, and exposes the public HTTP MCP/reference platform.

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

### 3. Construction retained only as informative

Current `operatorSignature()` uses:

`Construction = cacheCreate / output`

Action:
- document as implementation-derived signature component;
- do not make normative until Search Authority review.

### 4. Archetype mismatch preserved as unresolved

Current `@sigrank/cascade` reference archetypes:
- CONTEXTUAL
- GENERATOR
- BALANCED_ELITE
- READER
- COMMITTER
- STANDARD

Existing broader SigRank materials have used a different 10-archetype taxonomy.

Action:
- v0.1 defines the concept `archetype`;
- v0.1 does not freeze a normative archetype enumeration.

### 5. RS05 class is separated from base metric standard

Current implementation contains a 24-stage total-token RS05 class ladder.

Action:
- treat as reference implementation taxonomy;
- do not require third-party SigRank compatibility to implement the ladder.

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

## 7. Canonical README SNR example is stale relative to executable math

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
- [ ] confirm terminology for Construction;
- [ ] confirm archetype authority;
- [ ] confirm whether RS05 belongs in open spec, extension, or proprietary reference layer;
- [ ] confirm public language around "standard";
- [ ] confirm final license/trademark policy.
