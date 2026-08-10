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
- **Archetype:** a descriptive grouping of field records. The current field loader reads ten build archetypes produced by deterministic classification.

Neither is an identity claim. Tier thresholds and scoring weights are server-controlled; archetypes depend on their source dataset and clustering run.

Sources: `lib/scoring/engine.ts`, `lib/field/data.ts`.