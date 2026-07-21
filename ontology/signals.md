---
type: Reference
title: Signals
description: Conditional interpretations layered on observations and metrics. Always carry uncertainty and must not infer motive or identity. Active.
tags: [sigrank, signals, interpretation, integrity, caution, reference]
timestamp: 2026-07-21
---

# Signals

A signal is an interpretation layered on observations and metrics. It is always conditional: “this pattern is consistent with…” rather than “this proves…”.

Examples include a high reuse pattern, unusually high throughput, or a verification concern. Signals should carry their input window, method version, relevant integrity tier, and uncertainty. They must not overwrite a raw observation or be used to infer motive, skill, employment value, or identity.

The ingest system emits integrity reasons separately from numerical signals; a flag is a request for caution, not an accusation. Source: `lib/ingest/gates.ts`.