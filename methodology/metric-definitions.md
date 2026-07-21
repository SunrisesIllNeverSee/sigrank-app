# Metric definitions

Let `i = input`, `o = output`, `cw = cache_create`, and `cr = cache_read`. The client-safe implementation uses `safeI = max(i, 1)`.

| Metric | Formula | Interpretation | Limitation |
|---|---|---|---|
| Upsilon / yield | `(cr × o) / safeI²` | combined reuse and output relationship | sensitive to small input; plausibility checks matter |
| SNR | `o / (i + o)`, else `0` | output share of fresh input plus output | not output quality |
| Velocity | `o / safeI` | output per fresh input | ignores cache creation cost |
| Leverage | `cr / safeI` | cache reuse per fresh input | not causal leverage or business value |
| 10xDEV in cascade code | `log10((o/i) × (cw/o) × (cr/cw))` when all pillars positive | logarithmic cascade summary | unavailable for incomplete cascades |
| Scale V | `log10(i + o + cw + cr)` | log token volume | not activity quality |
| Efficiency | `(cr + cw + o) / safeI / 4` | display diagnostic | policy choice, not a scientific universal |

`RESTRUCTURE.md` and `AGENTS.md` describe a frozen 10xDEV invariant as `log10(Leverage)`, while `computeCascadeMetrics()` currently computes the full cascade product. This documentation preserves the code behavior and records the discrepancy for owner resolution; it must not silently reconcile the two.

Source: `lib/cascade/metrics.ts`.