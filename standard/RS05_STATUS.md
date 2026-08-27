# RS05 / Class Tier Status — SigRank Standard v0.1-draft

## Decision

**RS05 Class Tier is a SignalAF reference-implementation extension, not a requirement for base SigRank v0.1 compatibility.**

The taxonomy is real, cross-repo contracted, and operationally important. It is intentionally kept outside the base standard because it measures a different axis from the core operator metrics.

## What RS05 measures

RS05 classifies accumulated **total token volume**:

`total = input + output + cache_write + cache_read`

The current reference system contains:

- 8 base tiers;
- 3 sub-stages per tier;
- 24 experience stages total;
- UNCLASSED for no/non-finite data.

Base tiers:

1. ARCH+
2. ARCH
3. POWER
4. BASE
5. SEEKER
6. REFINER
7. BEARER
8. IGNITER

## What RS05 does not measure

Class Tier is not:

- Yield;
- efficiency;
- Build Archetype;
- field rank;
- task quality;
- productivity;
- intelligence;
- employment suitability.

It is an **experience / accumulated-volume axis** in the SignalAF reference implementation.

## Why it stays outside base compatibility

The portable core should answer:

> Can two systems represent and compute the same operator measurements?

It should not require:

> Do two systems use SignalAF's current experience ladder and field-controlled thresholds?

Keeping RS05 separate lets external systems implement the SigRank measurement standard without adopting SignalAF's presentation/classification policy.

## Reference implementation authority

SignalAF and sigrank-mcp already enforce cross-repo parity for:

- the 8 tier names;
- the 24 stage names;
- the 24 `RS05_CLASS_THRESHOLDS` values.

That parity should continue as a **reference-product contract**, independent of base standard conformance.

## Compatibility language

A product may be:

`SigRank Compatible — v0.1-draft`

without implementing RS05.

If it implements the SignalAF ladder, preferred language is:

`Implements the SignalAF RS05 Class Tier extension`

rather than implying RS05 is required by the base specification.

## Threshold governance

RS05 thresholds are field/product controlled and MAY change under the applicable reference-product ruleset.

A system exposing RS05 SHOULD identify:

- ruleset/version;
- threshold version;
- observation window;
- total-token definition.

## TRANSMITTER

TRANSMITTER is a separate peak badge and is not an RS05 class.

It MUST NOT be added as a 25th class stage in standard documentation.

## Future option

If external adoption warrants it, publish a separate extension:

`SigRank Experience Class Extension / RS05`

That extension could freeze a specific threshold version without making it mandatory for the base operator-measurement standard.
