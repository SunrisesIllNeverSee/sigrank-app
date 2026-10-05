---
type: Reference
title: Taxonomy
description: Classification concepts including class tiers and archetypes. Neither is an identity claim. Active.
tags: [sigrank, taxonomy, class-tier, archetype, classification, reference]
timestamp: 2026-07-21
---

# Taxonomy

SignalAF uses two distinct classification concepts:

- **Class tier:** a server-side classification based on total tokens accumulated. 8 tiers (ARCH+ down to IGNITER), each split into 3 sub-stages (24 stages total). Thresholds are ordered descending and first match wins. TRANSMITTER is a separate peak badge (RS.08), not a class tier.
- **Archetype:** a descriptive grouping of field records. The classifier emits ten deterministic build archetypes across four branches — describes operating shape, not rank; derived from leverage, velocity, and construction and dynamic over time: Reuse depth — INPUT-BOUND → PRIMING → CONTEXTUAL → DEEP READER → ARCHIVIST; Construction — BUILDER → RECURSIVE → AMPLIFIER; Generation — KINETIC; Convergence — CONVERGENT (P80+ on all three axes).

Neither is an identity claim. Tier thresholds and scoring weights are server-controlled; archetypes depend on their source dataset and clustering run.

Sources: `lib/analytics/scoring-engine.ts`, `lib/analytics/field-data.ts`, `lib/analytics/build-archetypes.ts`.