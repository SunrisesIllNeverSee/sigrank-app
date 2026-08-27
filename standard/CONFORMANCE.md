# Compatibility and Future Conformance

## `SigRank Compatible — v0.1-draft`

A system may use this label when:

- it emits a versioned compatible record;
- I/O/W/R semantics are preserved;
- Yield, Leverage, Velocity, SNR, and 10xDEV match the published draft definitions and null policy;
- missing telemetry is not fabricated;
- base calculations do not require semantic content.

## Reserved term

`SigRank Conformant`

is reserved until an official executable test suite exists.

## Future test suite

The conformance suite should test:

1. schema validity;
2. primitive alias mapping;
3. canonical reference vector;
4. zero input;
5. zero output;
6. zero cache write;
7. zero cache read;
8. missing cache telemetry;
9. metric rounding policy;
10. version declaration;
11. privacy/base-layer separation;
12. field-dependent claim provenance.
