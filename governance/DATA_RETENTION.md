---
type: Spec
title: Data Retention
description: Purpose-limited retention rules for active data, paused collection, history deletion, and backups. Phase 1; durations pending.
tags: [sigrank, data-retention, retention, deletion, backups, spec]
timestamp: 2026-07-21
---

# Data retention

Retention is purpose-limited. Keep active account links, submissions, derived metrics, and integrity records only while needed to operate the service, support reproducibility, prevent abuse, or meet documented legal obligations.

- **Paused collection:** retain existing history under the selected account state until deletion, account closure, or the applicable schedule.
- **History deletion:** remove telemetry and derived history from active systems; retain only minimum deletion/audit evidence and security records where necessary.
- **Account deletion:** remove the account link and associated active data, subject to the same narrow exceptions.
- **Backups:** expire according to an operational backup schedule and are not a source for restoring deleted active records except under controlled, documented conditions.

Specific durations must be published before enforcement. This Phase 1 policy intentionally does not invent retention periods absent an approved operational schedule.