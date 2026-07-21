---
type: Spec
title: Metric Definitions
description: Formal definitions and formulas for Upsilon, SNR, Velocity, Leverage, 10xDEV, Scale V, and Efficiency with limitations. Active.
tags: [sigrank, metric-definitions, formulas, upsilon, snr, velocity, spec]
timestamp: 2026-07-21
---

# Metric definitions

Let `i = input`, `o = output`, `cw = cache_create`, and `cr = cache_read`. The client-safe implementation uses `safeI = max(i, 1)`.

| Metric | Formula | Interpretation | Limitation |
|---|---|---|---|
| Upsilon / yield | `(cr × o) / safeI²` | combined reuse and output relationship | sensitive to small input; plausibility checks matter |
| SNR | `o / (i + o)`, else `0` | output share of fresh input plus output | not output quality |
| Velocity | `o / safeI` | output per fresh input | ignores cache creation cost |
| Leverage | `cr / safeI` | cache reuse per fresh input | not causal leverage or business value |
| 10xDEV | `log10(Leverage)` | logarithmic cascade summary | unavailable for incomplete cascades |
| Scale V | `log10(i + o + cw + cr)` | log token volume | not activity quality |
| Efficiency | `(cr + cw + o) / safeI / 4` | display diagnostic | policy choice, not a scientific universal |

The cascade implementation computes 10xDEV as `log10((o/i) × (cw/o) × (cr/cw))` when all four pillars are positive; this product algebraically simplifies to `log10(cr / i)`, which equals `log10(Leverage)` when `i > 0`. There is no discrepancy between the documented invariant and the implementation.

Source: `lib/cascade/metrics.ts`.