# AGENTS.md — sigrank-app

> Deploy target. Push `main` → Vercel auto-builds → **signalaf.com**.

## Quick reference

| What | Command |
|------|---------|
| Type check | `npx tsc --noEmit` |
| Canonical tests | `npm run test:canonical` (11/11, MOSES Υ 18436.98) |
| All unit tests | `npm test` |
| UI tests | `npm run test:ui` |
| E2E tests | `npm run e2e` (needs deployed URL or local server) |
| Lint | `npm run lint` |
| Build | `npm run build` (needs Node 22; local machine has Node 25 — may fail) |
| Dev server | `npm run dev` (needs Node 22; local machine has Node 25 — won't start) |

**Local dev caveat:** Machine runs Node 25, repo pins Node 22 (`.nvmrc`).
`next dev` and `next build` may not start locally. Verify via `tsc --noEmit` +
canonical tests + live-DOM checks against deployed signalaf.com.

## Verification protocol (before every commit)

1. `npx tsc --noEmit` — 0 errors
2. `npm run test:canonical` — 11/11 pass
3. If touching API routes or scoring logic, run full `npm test`

## Frozen invariants (never change)

- **MOSES seed values:** `(1_251_211, 11_296_121, 128_196_310, 2_555_179_769)` → Υ 18436.98
- **Upsilon (Υ) formula:** `(cache_read × output) / input²`
- **10xDEV formula:** `log₁₀(Leverage)`
- **RS.xx weights:** server-only, marked `OPERATOR_OVERRIDE_REQUIRED`
- **Canonical test:** `__tests__/ingest/canonical.test.mjs` must pass 11/11

## SEO/AEO/GEO content (DO NOT TOUCH)

The following are intentional SEO/AEO/GEO pages and discovery surfaces. They are
strategic. NEVER remove them, flag them as dead links, or 404s to fix:

- `llms.txt`, `llms-full.txt`, sitemap
- Routes: `/vs/`, `/alternatives/`, `/guides/`, `/tools/`, `/metrics/`,
  `/ai-benchmarking/`, `/ai-coding-metrics/`, `/ai-operator-scoring/`,
  `/operator-performance/`, `/cascade-analysis/`, `/token-telemetry/`

If unsure whether something is SEO strategy or a real bug, ASK THE OWNER.

## Code conventions

- **TypeScript strict mode** — all files type-checked, 0 errors required
- **Next.js 15 + React 19** — App Router (`app/` directory)
- **Supabase** — database + auth
- **Stripe** — billing (test mode in dev)
- **Display names:** Use `operatorDisplayName()` from `lib/compare/operator-name.ts`
  for all visible user-facing text. Never render raw `.codename` as display text
  (use as URL keys / lookup values only).
- **No new dependencies** without explicit approval. Use existing libraries.
- **Match surrounding style** — read neighboring files before editing.
- **Don't add/remove comments** unless asked.

## Project structure

```
app/          — Next.js App Router pages + API routes
components/   — React components (compare, share, signature, profile, etc.)
lib/          — Core logic (api, scoring, ingest, cascade, jsonld, seo, etc.)
__tests__/    — Unit tests (canonical.test.mjs is the acceptance test)
scripts/      — Utility scripts (snapshot-db.mjs)
public/       — Static assets
```

## Deploy

Push to `main` → Vercel auto-builds → signalaf.com. No manual `vercel --prod`.
README changes are zero-risk to builds.

## Coordination

This repo is worked on by Drep1 (lead) and Drep2 (one-off tasks) via
`~/Desktop/SigRank-repos/D-REP-SCRATCH.md`. All task assignment and reporting
goes through that scratchpad. Do not bypass it.
