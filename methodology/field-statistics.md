---
type: Analysis
title: Field Statistics
description: Dataset-specific field comparisons using medians, quartiles, IQR fences, and percentile computation. Outlier handling must be explicit. Active.
tags: [sigrank, field-statistics, percentiles, iqr, outliers, analysis]
timestamp: 2026-07-21
---

# Field statistics

Field comparisons are dataset-specific. The field-analysis schema provides medians, quartiles, and IQR fences for yield, SNR, leverage, velocity, tokens per day, and total tokens. An IQR fence stores `q1`, `q3`, `iqr`, and lower/upper bounds.

Leaderboard percentile is computed from a descending score order: for `total > 1`, `((total - rank) / (total - 1)) × 100`, rounded to two decimals. The 50th percentile is preferred over a mean when describing a typical operator because it is less sensitive to extreme values.

Outlier handling must be explicit. Field records can carry a classification and bot score; an outlier label is a data-quality or distributional decision, not proof of automation or misconduct. Publish inclusion rules, sample date, source, and fence method with every aggregate.

Sources: `lib/field/types.ts`, `lib/data/queries.ts`, `lib/data/outlier-classify.ts`.