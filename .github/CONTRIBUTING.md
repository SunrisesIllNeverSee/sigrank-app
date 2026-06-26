# Contributing to SigRank

Thanks for your interest in contributing! SigRank is a privacy-preserving AI operator leaderboard — here's how to contribute effectively.

## Quick start

```bash
git clone https://github.com/SunrisesIllNeverSee/sigrank-app.git
cd sigrank-app
npm install
npm run dev
```

The app builds and renders fully without Supabase or Stripe credentials (deterministic mock fallback).

## Before you commit

All three must pass:

```bash
npx tsc --noEmit                              # 0 TypeScript errors
node --test __tests__/ingest/canonical.test.mjs  # 11/11 (Υ 18436.98)
npm run build                                 # clean production build
```

## Frozen invariants — do not change

- **MO§ES SEED values:** `(1_251_211, 11_296_121, 128_196_310, 2_555_179,769)` → Υ 18436.98
- **The Υ formula:** `(cache_read × output) / input²`
- **The cascade identity:** `T × C × R = Cr/I = Leverage`
- **10xDEV = log₁₀(Leverage)**
- **RS.xx weights are server-only** — never expose in client components

## Conventions

- One job per commit. Don't batch unrelated changes.
- Match surrounding code style.
- No secrets in the repo. Keys live in `.env.local` (gitignored).
- Scoring weights are server-only (`lib/scoring/ruleset.ts` imports `server-only`).

## Pull requests

Use the PR template. Verify all three gates pass before requesting review.
