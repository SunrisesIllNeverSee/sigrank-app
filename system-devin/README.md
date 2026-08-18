---
type: Reference
title: DREP Coordination Root — system-devin
description: Canonical DREP coordination root for sigrank-app. rep1=LEAD, rep2=ASSIST, OWNER=human. Single operational coordination state.
tags: [repo-standard, coordination, drep, system-devin]
timestamp: 2026-08-18
---

# DREP Coordination Root

This directory is the canonical DREP coordination root for `sigrank-app`.

## Role mapping (canonical, non-negotiable)

| DREP name | Standard name | Human/Agent | Role |
|-----------|--------------|-------------|------|
| OWNER | OWNER | Human (Deric) | Decisions, external actions |
| rep1 | LEAD | Agent | Primary build coordination, documentation, big-picture |
| rep2 | ASSIST | Agent | Bounded support lane, one-off tasks, reports to rep1 |

## Pre-existing DREP

This repo previously used `Devins_Plans/` with legacy `Drep1`/`Drep2` naming.
The canonical DREP (`system-devin/`) is now installed alongside it.
The `Devins_Plans/` directory is preserved as historical record.
Future work should use `system-devin/` + `.coord/micro/` for coordination.

## Single coordination state

The live coordination bus is `.coord/micro/SCRATCHPAD.md`.
The live session state is `.coord/micro/STATE.md`.

`system-devin/` holds per-role onboarding and handoff state.
There is ONE operational coordination state per repository.
