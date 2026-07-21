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

## Cache invalidation (submit → profile update)

When a verified snapshot is persisted, `revalidateTouchedWindows()` in
`lib/ingest/materialize.ts` must bust THREE cache layers:
1. `revalidatePath("/board/<slug>")` — board page ISR cache
2. `revalidateTag("operator")` — data-layer `unstable_cache` (getOperator, getOperatorHistory, etc. in `lib/data/cached.ts`)
3. `revalidatePath("/user/<codename>")` — profile page ISR cache (`export const revalidate = 120`)

If profile or share card data looks stale after a submit, check that all three
are firing. The call site is in `app/api/v1/snapshots/route.ts` — it passes
`payload.codename` to `revalidateTouchedWindows`.

## Vercel bot protection (403 on API calls)

Vercel's bot protection blocks Node.js `fetch` via TLS fingerprinting. The MCP
client (`sigrank-mcp`) has a curl fallback in `tools.mjs` — when `fetch` gets a
403, it retries via `execFileSync('curl', ...)`. If 403s return, verify the curl
fallback is still working before investigating server-side causes.

## Opt-out scrubbing (mandatory)

When an operator requests data removal (opt-out, deletion, retirement), their
handle, display name, and all identifying data MUST be scrubbed from EVERY
file in this repo — not just the database. This includes:

- `public/data/field-analysis.json` — scraped dataset served live on `/field`
- `supabase/migrations/tokscale_seed_full.sql` — seed migration
- `supabase/migrations/tokscale_seed_preview.sql` — preview seed
- Any other data file, CSV, JSON, or SQL that contains operator handles

**Before committing any opt-out/deletion work:**
1. `git grep -i "<handle>"` across the entire repo
2. Remove the operator from every matching file
3. Verify zero hits remain: `git grep -i "<handle>"` returns nothing

This is non-negotiable. An opt-out is not complete while the operator's name
or handle still appears in any tracked file in this repo.

## Coordination

This repo is worked on by Drep1 (lead) and Drep2 (one-off tasks) via
`~/Desktop/SigRank-repos/D-REP-SCRATCH.md`. All task assignment and reporting
goes through that scratchpad. Do not bypass it.
