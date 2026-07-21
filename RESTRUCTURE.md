---
type: Reference
title: sigrank-app Restructure Notes
description: Post-restructure reference for the sigrank-app repo. Documents the new lib/ domain layers, the observatory spine, consent/opt-out wiring, and the verification protocol.
tags: [sigrank, sigrank-app, restructure, observatory-spine, lib-refactor]
timestamp: 2026-07-20
---

# sigrank-app Restructure Notes

**Status:** Completed (or in progress — check git log).

This repo was restructured around a shared **observatory spine**: canonical knowledge layers that explain what SignalAF is, how it measures operators, and how data is governed.

## New domain layers in `lib/`

The old flat `lib/` directory was split into five domain layers:

| Layer | Path | Responsibility |
|---|---|---|
| Analytics | `lib/analytics/` | Pure math and scoring. No React, no transport. |
| Board | `lib/board/` | Leaderboard surface — queries, mappers, windows, entries. |
| Ingest | `lib/ingest/` | Submission pipeline — parse, validate, sign, store. |
| Infra | `lib/infra/` | Database, auth, billing, analytics, audit plumbing. |
| Identity | `lib/identity/` | Operators, devices, claims, names, anonymization. |

Everything else stays where Next.js expects it: `app/`, `components/`, `public/`, `next.config.ts`, `package.json`, `tsconfig.json`, `supabase/migrations/`, etc.

## The observatory spine

These directories contain canonical docs used by both `sigrank-app` and `sigrank-mcp`:

| Directory | Purpose |
|---|---|
| `observatory/` | Vision, principles, architecture, roadmap |
| `ontology/` | Definitions: operator, submission, telemetry, metrics, cascade, taxonomy |
| `methodology/` | Formulas, field statistics, bot detection, normalization, limitations |
| `governance/` | Data policy, consent model, opt-out/removal, provenance, ethics, retention |

`sigrank-app` is the source of truth. `sigrank-mcp` mirrors these docs via `scripts/sync-spine.mjs` in the MCP repo.

## Quick setup

See `environment.yaml` for the canonical setup:

```bash
npm install
npx tsc --noEmit
npm run test:canonical
npm test
```

**Note:** This repo pins Node 22 (`.nvmrc`). The local machine may run Node 25, in which case `next dev` / `next build` may not work locally. Rely on `tsc --noEmit`, canonical tests, and Vercel CI for verification.

## Verification protocol

Before every commit:

1. `npx tsc --noEmit` — must pass with 0 errors.
2. `npm run test:canonical` — must pass 11/11, MOSES Υ 18436.98.
3. If touching API routes or scoring logic, run full `npm test`.

## Frozen invariants

Do not change without explicit owner approval:

- **MOSES seed values:** `(1_251_211, 11_296_121, 128_196_310, 2_555_179_769)` → Υ 18436.98
- **Upsilon (Υ) formula:** `(cache_read × output) / input²`
- **10xDEV formula:** `log₁₀(Leverage)`
- **RS.xx weights:** server-only, marked `OPERATOR_OVERRIDE_REQUIRED`

## Consent / opt-out wiring

Consent infrastructure lives across several layers:

| Layer | Location |
|---|---|
| Database | `supabase/migrations/0029_consent_tracking.sql` |
| Policy docs | `governance/CONSENT_MODEL.md`, `governance/OPT_OUT_POLICY.md`, `governance/DATA_RETENTION.md` |
| Server enforcement | `lib/ingest/gates.ts`, `lib/infra/api-auth.ts` |
| API routes | `app/api/v1/devices/enroll/route.ts`, `app/api/v1/snapshots/route.ts` |
| Client UX | `app/settings/page.tsx`, privacy page |

## Coordination

Agent task assignment and reporting goes through `~/Desktop/SigRank-repos/D-REP-SCRATCH.md`. Do not bypass it.
