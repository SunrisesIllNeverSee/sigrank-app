---
type: Reference
title: Cascade
description: Token-flow decomposition from input through output, cache commitment, and cache reuse; the three stages multiply to Leverage. Active.
tags: [sigrank, cascade, token-flow, upsilon, metrics, reference]
timestamp: 2026-07-21
---

# Cascade

A cascade is the token-flow decomposition from fresh input through generated output, cache commitment, and cache reuse.

For positive pillars, its stages are:

1. **Transmission:** `output / input`
2. **Commitment:** `cache_create / output`
3. **Reuse:** `cache_read / cache_create`

Their product telescopes to `cache_read / input`, which is Leverage (not Yield). Yield is Leverage × Transmission: `Υ = (cache_read / input) × (output / input) = (cache_read × output) / input²`. A zero cache-create value is marked non-compounding; stage ratios and the cascade string are then unavailable rather than inferred.

Source: `lib/analytics/cascade.ts`.