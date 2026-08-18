---
type: State
title: Micro Session State
description: Save/resume slot for the current repository build state.
tags: [repo-standard, coordination, state]
timestamp: 2026-08-18
---


# Micro Session State

## Current

- Status: initialized
- In progress: none
- Next: run repository doctor and establish the first active role
- Blockers: none

## Resume order

1. Read this file.
2. Read the latest scratchpad entries.
3. Read the active handoff if one exists.
4. Check the roster.
5. If this is a cross-repo build, read `.coord/macro/MACRO_STATE.md`.
