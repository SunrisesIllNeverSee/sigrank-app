---
type: Reference
title: Taxonomy
description: Classification concepts including class tiers and archetypes. Neither is an identity claim. Active.
tags: [sigrank, taxonomy, class-tier, archetype, classification, reference]
timestamp: 2026-07-21
---

# Taxonomy

SignalAF uses two distinct classification concepts:

- **Class tier:** a server-side classification based on compression and SIGNA RATE. The highest tiers require both conditions; lower tiers use compression only. Thresholds are ordered descending and first match wins.
- **Archetype:** a descriptive grouping of field records. The current field loader reads eight archetypes produced by K-Means clustering.

Neither is an identity claim. Tier thresholds and scoring weights are server-controlled; archetypes depend on their source dataset and clustering run.

Sources: `lib/scoring/engine.ts`, `lib/field/data.ts`.