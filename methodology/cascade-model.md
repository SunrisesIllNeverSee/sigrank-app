---
type: Spec
title: Cascade Model
description: Mathematical decomposition of the cascade into transmission, commitment, and reuse stages telescoping to Upsilon. Active.
tags: [sigrank, cascade-model, upsilon, transmission, commitment, reuse, spec]
timestamp: 2026-07-21
---

# Cascade model

For positive input `i`, output `o`, cache creation `cw`, and cache read `cr`:

```text
transmission = o / i
commitment   = cw / o
reuse        = cr / cw
```

Multiplying stages cancels intermediate terms:

```text
(o / i) × (cw / o) × (cr / cw) = (cr × o) / i² = Υ
```

This decomposition makes Upsilon legible: output relative to input is transmission; cache creation relative to output is commitment; reads relative to created cache are reuse. It is an accounting identity, not a causal proof that one stage produced another.

The app computes stage values and 10xDEV only when every pillar is positive; otherwise it marks the run non-compounding when `cw` is zero. Source: `lib/cascade/metrics.ts`.