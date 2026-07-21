---
type: Spec
title: Limitations
description: What Upsilon and cascade metrics do not measure, sensitivity issues, and conditions that limit comparisons. Active.
tags: [sigrank, limitations, caveats, scope, methodology, spec]
timestamp: 2026-07-21
---

# Limitations

Upsilon measures a token-flow relationship: cache reads and output relative to fresh input. It does not measure correctness, novelty, user satisfaction, economic value, code quality, safety, talent, effort, or intelligence.

It is especially sensitive to small input denominators. The app uses a denominator floor and ingest plausibility checks, but neither turns a ratio into proof. Cache behavior also depends on provider, model, prompt structure, session design, and collection tooling.

Scores and classes are conditional on submitted data, verification tier, scoring version, and selection into the field. Missing telemetry, unverified submissions, changing tools, and uneven sampling limit comparisons. Treat rank and signals as observations to investigate, not final judgments.