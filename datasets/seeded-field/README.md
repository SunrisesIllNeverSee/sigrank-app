# SigRank Seeded Field — Canonical Index

This directory is the **canonical locator and source contract** for the static
seeded SigRank field: the original per-operator telemetry acquired from the
TokScale public leaderboard on 2026-07-13, and every layer derived from it.

It does not replace the underlying datasets or upstream metric specification.
It answers, for every seeded-field object:

1. What is it?
2. What does it mean?
3. Where is its source of truth?
4. What is derived from it?

## Layer model

| Layer | Name | File(s) |
|---|---|---|
| L0 | Raw seed corpus | `sources.yaml`, `fields.yaml` |
| L1 | Static operator records | `index.yaml`, `contracts/` |
| L2 | Derived statistics | `metrics.yaml` |
| L3 | Field statistics | `contracts/distributions.yaml` |
| L4 | Secondary classifications | `classifications.yaml`, `populations.yaml` |
| L5 | Comparison products | `classifications.yaml` (leaderboard/benchmark entries) |
| L6 | Interpretation | `surfaces.yaml` |

## Non-negotiable invariants

- **Raw telemetry is primary.** `raw corpus ≠ HCM ≠ leaderboard ≠ benchmark
  population`. No classification mutates, deletes, or replaces raw records.
- **TTEOP is upstream read-only.** SignalAF records metric ID, pinned version,
  implementation, input fields, output field — it never redefines TTEOP.
- **Statistics precede interpretation.** `statistics → benchmark/leaderboard/
  classifications`. Leaderboard rank is not the primary measurement object.
- **Historical stays historical.** Semantic drift (e.g. `snr_pct`) is recorded,
  not silently merged into current definitions.

## Files

| File | Contents |
|---|---|
| `index.yaml` | Canonical object registry (IDX-001..019) |
| `sources.yaml` | Source registry: repos, commits, paths, hashes, roles |
| `fields.yaml` | All 24 acquired fields, classified |
| `metrics.yaml` | Metric records w/ upstream TTEOP authority + status |
| `populations.yaml` | Population/cohort records (versioned) |
| `classifications.yaml` | Classification records (HCM, bot, outlier, …) |
| `surfaces.yaml` | Public surfaces → consumed indexed objects |
| `gaps.yaml` | Gap register with status vocabulary |
| `contracts/distributions.yaml` | Field-statistics contracts (Phase 5) |

## Provenance chain

Every published seeded statistic must trace:

```text
source acquisition → raw row → canonical static operator record
→ pinned metric definition/version → pinned implementation
→ derived value → population/classification selection (if any)
→ distribution/comparison output → public surface
```

If any step is unavailable, the lineage is marked `incomplete` — never inferred.

## Status vocabulary

`current` | `historical` | `superseded` | `unresolved`

## Spec provenance

Built per `signalaf_seeded_field_devin_handoff` v0.3 (technical-index workspace,
`_7_labs/technical-index/workspace/`). Deviations from the package are recorded
in the closure report, not silently absorbed.

### Location rationale

The package proposed `docs/seeded-field/`; this repository's structure rules
(`docs/REPOSITORY_STRUCTURE.md`) prohibit `docs/` subdirectories and reserve
`datasets/` for exactly this purpose — "versioned dataset releases … schema,
source, extraction date, inclusion/exclusion criteria, methodology version."
The index therefore lives at `datasets/seeded-field/` per the package's own
fallback clause ("use the existing convention rather than forcing").
