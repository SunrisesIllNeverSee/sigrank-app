# Metrics

Public cascade metrics are deterministic diagnostics over raw pillars:

- **Upsilon (Υ, yield):** `(cache_read × output) / input²`.
- **SNR:** `output / (input + output)` when the denominator is positive, otherwise `0`.
- **Velocity:** `output / max(input, 1)`.
- **Leverage:** `cache_read / max(input, 1)`.
- **10xDEV:** `log10(transmission × commitment × reuse)` only when all four pillars are positive. By cancellation, this equals `log10(Υ)` in that domain; the app's direct `log10(Leverage)` is not what `computeCascadeMetrics` implements.

The implementation also exposes scale, blended price display, efficiency, and an operation ratio. Metrics quantify token-flow relationships; they are not direct productivity or quality measures.

Source: `lib/cascade/metrics.ts`.