---
type: Playbook
title: SigRank App — Agent Orientation
description: Canonical onboarding for any AI agent working in sigrank-app. Read before touching anything.
resource: file:///Users/dericmchenry/Desktop/SigRank/sigrank-app
tags: [sigrank, nextjs, agents, orientation]
timestamp: 2026-06-16T00:00:00Z
---

# AGENTS.md — SigRank Next.js App
## Orientation for any AI agent or Claude session working in this repo

Read this before touching anything.

---

## What this is

**SigRank** — a privacy-preserving leaderboard scoring AI operators by token cascade
efficiency. Core rank metric: **Υ = (cache_read · output) / input²**. Nine class tiers,
free tier + Pro tier behind Stripe, anonymous + claimable operator entries.

Repo: `/Users/dericmchenry/Desktop/SigRank/sigrank-app`
Plans: `/Users/dericmchenry/Desktop/SigRank/Devins_Plans/_planning/`
Stack: Next.js 15 App Router + React 19 + TypeScript strict + Tailwind (dark-only) +
Supabase + Stripe + zod.

---

## Run it

```bash
# Dev server — MUST run from the project directory (npx --prefix breaks vendor chunks)
bash -c 'cd /Users/dericmchenry/Desktop/SigRank/sigrank-app && node_modules/.bin/next dev --port 3000'

# Type check
npx tsc --noEmit

# Build
npm run build

# Canonical test
node --test __tests__/ingest/canonical.test.mjs
```

**All three checks must pass before any commit.**

---

## Architecture (one job per file/dir)

- `lib/data/index.ts` — single read facade. Live branches read Supabase; the
  fallback (DB unreachable) serves the cold-store snapshot (`lib/data/snapshot.json`),
  else `lib/data/mock.ts` (last resort). [DATA.LIVE archived 2026-06-20 — the DB IS
  live; the only remaining stubs are the operators-online widgets, tagged ONLINE.LIVE.]
- `lib/supabase/` — exports `SUPABASE_CONFIGURED`. Returns `null` clients when env unset.
- `lib/stripe/server.ts` — exports `STRIPE_CONFIGURED`. Routes return 503 when unset.
- `lib/ingest/bridge.ts` — computes cascade metrics (Υ, Leverage, SNR, 10xDEV, Velocity)
  from four token pillars.
- `lib/scoring/` — Core 5 scoring engine. RS.xx weights are `OPERATOR_OVERRIDE_REQUIRED`.
- `lib/audit/provider.ts` — `AuditProvider` / `MockAuditProvider`. Pro metrics stub.
- `components/profile/CascadePanel.tsx` — shows 4 cascade stats (missing: Velocity).
- `components/marketing/MetricTiles.tsx` — 8 metric tiles (missing: SDOT, SDRM, DR%).
- `supabase/` — migrations + seed SQL.
- `app/api/v1/` — all API routes. Claim, ingest, leaderboard, billing, etc.

---

## Frozen invariants — DO NOT CHANGE without explicit instruction

- **MO§ES SEED values:** `(1_251_211, 11_296_121, 128_196_310, 2_555_179,769)` → Υ 18436.98
- **The Υ formula:** `(cache_read × output) / input²`
- **The cascade identity:** `T × C × R = Cr/I = Leverage` (telescoping proof)
- **10xDEV = log₁₀(Leverage)** — always and exactly this
- **SIGNA RATE ≠ rank metric.** SIGNA RATE is the class credential. Υ Yield is the rank.
- **RS.xx weights are server-only** and marked `OPERATOR_OVERRIDE_REQUIRED` — never expose

---

## Current state (as of 2026-06-16)

**Build:** GREEN — 31 routes, 0 TypeScript errors.
**Data:** MOCK fallback only. Supabase creds not wired. Every page renders fine.

**Completed:**
- HeroStats, TodaysLeaders, SignalgeistGrid updated with real SEED values
- metrics/page.tsx — Υ/Leverage/SNR/10xDEV added as first metric links
- submit/page.tsx — ccusage/cascade language
- operators/page.tsx — visible `(TODO WINDOW.ENUM)` removed
- operators/[codename]/wrapped — `OPERATOR_OVERRIDE_REQUIRED` → `UNTRACKED = '—'`

**Known gaps (have plans):**
- Only 4 of ~15 equations shown (missing: Velocity, cascade identity, SDOT, SDRM, DR%, Signal Army)
- Visual density — font not antialiased, numbers not tabular, rows too tall, chart lines 1px
- [RESOLVED 2026-06-20] Supabase IS live — the board/profile/metrics read the DB;
  fallback is the cold-store snapshot, then mock. (Was: "all data is mock".)
- Stripe not wired (owner doing this)
- [DATA.LIVE archived 2026-06-20] index.ts reads DO hit Supabase now. Only the
  operators-online widgets remain stubbed (tagged ONLINE.LIVE).

**Blocking (owner action only):**
```
NEXT_PUBLIC_SUPABASE_URL=<new sigrank project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```
Supabase: **create a NEW dedicated project** for SigRank.
Steps + SQL: see `Devins_Plans/_planning/gradio/PLAN_GRADIO_LAUNCH.md` Task 1.
Claude writes `SUPABASE_SETUP.sql` + `SUPABASE_HUMAN_STEPS.md` — owner runs them.

---

## Execution plans

All plans: `/Users/dericmchenry/Desktop/SigRank/Devins_Plans/_planning/`
Start with `INDEX.md` there.

| Plan | Priority | What |
|---|---|---|
| `sigrank-app/PLAN_NEXTJS_GOLIVE.md` | P0 | Supabase audit, real SEED migration, env vars, claim flow |
| `sigrank-app/PLAN_METRICS_LANGUAGE_SWEEP.md` | P1 | Language sweep + full ~15 equation set |
| `sigrank-app/PLAN_VISUAL_DENSITY.md` | P1 | BlitzStars visual benchmark — font, density, charts |
| `sigrank-app/PLAN_IMPORTER_AND_MARKET.md` | P2 | ccusage importer, vendor stubs, market |
| `sigrank-app/PLAN_VISUAL_BLITZSTARS.md` | P2 | Earlier visual plan — superseded by VISUAL_DENSITY |

---

## Metric spec source (the full equation set)

```
Desktop/SigRank/1_sigrank/1.2_layer-1-foundation/metrics/
  core_5/       — 5 Core metrics (COMP, SD, PC, CT, TT)
  composites/   — SIGNA RATE (C.01), SDOT (C.02), SDRM (C.03)
  extras/       — Signal Force (E.01), Drift Ratio (DR%)
  lineage/      — naming drift history

Desktop/SigRank/2_secondary/sig_army/main/session_docs/ECOSYSTEM_WORKFLOWS.md
  — full Signal Army / SigToken equation table (word-level, Pro tier)
```

**SDOT + SDRM:** LOCKED structure, provisional formula. Display confidently,
mark formula as "calibrating."

**Drift Ratio (DR%):** `(aligned_messages / total_messages) × 100` — anti-waterlog
metric. Catches sessions that started strong and decayed. Phase 2 / Pro tier.

---

## Known bugs (from AUDIT.md — 30 findings, 7 P1)

1. **Percentile bar inverted** — `app/operators/[codename]/page.tsx` line 166
   Fix: `style={{ width: \`${topPct}%\` }}`

2. **Platform filter broken** — `app/operators/page.tsx` lines 52–55
   Fix: `.find((p) => p.toLowerCase() === raw?.toLowerCase())`

3. **Unvalidated contact field** — `app/api/v1/claim/route.ts` line 50
   Fix: `String(body.contact).slice(0, 256)`

4. **Billing portal auth bypass** — `app/api/v1/billing/portal/route.ts` lines 56–57
   Fix: validate format + bind to authenticated caller before query.

5. **Hardcoded platform/rank colors** — `components/sigrank/CrossPlatformLeaderboard.tsx`
   Fix: use `c('platform-chatgpt')` etc. from tokens.ts.

Read `AUDIT.md` for the full 30-finding list.

---

## Conventions

- No secrets in the repo. Keys live in `.env.local` (gitignored).
- Supabase: NEW dedicated project — do not use AppFeeder.
- Match surrounding code style. Keep changes minimal and verifiable.
- Run typecheck + build + canonical test before every commit.
- One job per commit. Don't batch unrelated changes.
