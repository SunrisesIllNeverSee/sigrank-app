# Archetype Status — SigRank Standard v0.1-draft

## Decision

**Build Archetype is a reference-implementation classification, not a normative core requirement of SigRank Standard v0.1.**

The concept is defined because it is useful and already part of SignalAF, but third-party SigRank compatibility does not require implementation of the SignalAF archetype classifier.

## Canonical SignalAF reference taxonomy

The current SignalAF product taxonomy contains **10 deterministic Build Archetypes across four families**.

### Reuse depth

- INPUT-BOUND
- PRIMING
- CONTEXTUAL
- DEEP READER
- ARCHIVIST

### Construction

- BUILDER
- RECURSIVE
- AMPLIFIER

### Generation

- KINETIC

### Convergence

- CONVERGENT

The reference classifier uses three composition dimensions:

- `leverage = cache_read / input`
- `velocity = output / input`
- `construction = cache_write / cache_read`

The current SignalAF implementation applies deterministic precedence:

1. CONVERGENT
2. KINETIC
3. construction branch
4. reuse-depth branch

The current classifier implementation is `lib/analytics/build-archetypes.ts` in `sigrank-app`.

## Critical distinction

```text
Metric
quantitative operator measurement
        ↓
Build Archetype
composition shape derived from measurements

Class Tier
scale/qualification stage

Rank
relative field ordering
```

These are not synonyms and MUST NOT be collapsed into one label.

## Why archetypes are not normative in v0.1

The base standard should stabilize portable measurements before requiring a particular interpretation layer.

A third party should be able to:

- collect compatible I/O/W/R telemetry;
- compute the core SigRank metrics;
- emit a compatible record;

without being forced to use SignalAF's classification thresholds.

This allows the measurement vocabulary to spread without coupling every implementation to a proprietary or field-calibrated classification layer.

## Existing drift found during standardization

`@sigrank/cascade` currently exposes `operatorSignature()` with a separate six-label convenience classifier:

- CONTEXTUAL
- GENERATOR
- BALANCED_ELITE
- READER
- COMMITTER
- STANDARD

That set is **not the canonical SignalAF Build Archetype taxonomy** documented in the product ontology and implemented in `lib/analytics/build-archetypes.ts`.

Therefore the v0.1 standard MUST NOT describe the six-label set as the SigRank archetype taxonomy.

## Remediation recommendation

Do not break consumers abruptly.

Recommended sequence:

1. Treat `operatorSignature().archetype` as a legacy/convenience signature label.
2. Rename the field in a future compatible release to something like `signature_label` or `profile_label`.
3. Preserve the old field temporarily as deprecated output if consumers rely on it.
4. Keep the 10-type Build Archetype classifier in the SignalAF reference layer.
5. If archetypes become standardized later, publish them as a separately versioned extension with field-calibration provenance.

## Future extension

A later specification could define:

`SigRank Build Archetype Extension v1`

That extension would need to freeze:

- three input dimensions;
- threshold provenance;
- precedence;
- null handling;
- versioning;
- field-calibration policy;
- classification output schema.

Until then, archetypes remain a SignalAF reference classification built on top of standardized measurements.
