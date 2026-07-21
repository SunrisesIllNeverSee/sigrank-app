# SignalAF Observatory

SignalAF is an observatory for AI-assisted work. It records submitted token telemetry, derives reproducible cascade metrics, and presents those measurements with their verification context.

It is not a judgment of a person or a general measure of intelligence. A rank is a view over a defined dataset, window, methodology, and integrity tier.

## Knowledge pyramid

1. **Observations** — signed, windowed submissions and their raw token pillars.
2. **Metrics** — deterministic computations over those observations.
3. **Signals** — cautious interpretations of metric patterns.
4. **Research** — versioned analyses, datasets, and claims built on the layers below.

The pyramid is intentionally one-way: interpretations do not alter observations. See `ontology/`, `methodology/`, and `governance/` for the canonical definitions, methods, and data commitments.

Technical basis: `lib/cascade/metrics.ts`, `lib/ingest/gates.ts`.