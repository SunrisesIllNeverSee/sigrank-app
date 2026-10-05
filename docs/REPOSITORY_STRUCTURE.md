---
type: Reference
title: Repository Structure — Ownership Map
description: Canonical ownership, dependency direction, and placement rules for every top-level area. Active.
tags: [sigrank, repository-structure, ownership, placement-rules, reference]
timestamp: 2026-10-05
canon: search-authority
---

# Repository structure

This is the canonical map of what lives where and who owns it. **Update this file
in the same commit as any structural change** — a stale map is worse than a moved
directory. Path moves in a multi-agent estate generate stale references at scale;
prefer documenting the layout over renaming it.

## Top-level ownership

| Path | Owner / domain | Rules |
|---|---|---|
| `app/` | Product — Next.js routing only | No business logic; routes compose `lib/` |
| `lib/` | Product — domain code | Blast-radius rules apply to `board/`, `ingest/`, `cached` paths (see AGENTS.md) |
| `components/` | Product — shared UI | No server-only imports |
| `public/` | Frozen external surface | Standalone-served assets + schema artifacts; never restructure |
| `supabase/` | Product — database | Additive migrations only; never edit applied migrations |
| `standard/` | Canon — conformance spec (`canon: search-authority`) | Machine-readable; feeds `public/standard/` artifact + MCP parity tests |
| `governance/` | Canon — policy (`canon: search-authority`) | CLAIM_POLICY / PROVENANCE / DATA_POLICY — load canon context before editing |
| `ontology/` | Canon — terminology (`canon: search-authority`) | Metrics, taxonomy, submission contracts |
| `methodology/` | Canon — measurement spec (`canon: search-authority`) | Metric definitions, cascade model |
| `observatory/` | App-owned | Narrative architecture prose; no canon claims |
| `docs/` | App-owned | Ops records, plans, this map |
| `content/` | App-owned | Authored blog content → `/blog/*` routes |
| `datasets/` `papers/` `research/` | Canon-stamped | Release-policy stubs; README declares the boundary |
| `scripts/` | Tooling | Repo automation; CI entrypoints |
| `__tests__/` | Product — test ownership by domain | `node --test` mjs suites; `canonical.test.mjs` is the acceptance gate |
| `e2e/` | Product | Playwright |
| `.github/` `.agents/` `.claude/` `.ello/` | Tooling | CI, agent skills (locked via `skills-lock.json`), compat dirs — convention paths, do not merge or rename |
| `Devins_Plans/` `_archive/` | Pointer | Contents live in the umbrella repo (`Devins_Plans/reports/sigrank-app/`, `_archive/sigrank-app-attic/`); keep the READMEs |
| Root configs | Tooling | `next.config.ts`, `vercel.json`, `wrangler.jsonc`, `open-next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `tailwind.config.ts`, `playwright.config.ts`, `vitest.*`, `proxy.ts` (middleware replacement — root-pinned by convention), package manifests |
| Root docs | App-owned | `README.md`, `AGENTS.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`, `NOTICE`, `TTEOP-IMPLEMENTATION-PROFILE.md` |

## Dependency direction

`app/` → `components/` + `lib/` → nothing. `lib/` never imports from `app/`.
`components/` never imports server-only `lib/` paths. Canon-stamped dirs never
import code at all — they are documentation that code and tests consume.

## Placement rules for new files

- New route → `app/`; new logic → `lib/<domain>/` (existing subdomain preferred over a new dir)
- New conformance claim or policy → the canon-stamped dir, with `canon:` frontmatter and canon context loaded first
- New test → `__tests__/` beside its domain (`__tests__/board/`, `__tests__/contract/`, …)
- Ops record / plan / report → `docs/` (flat — do not create subdirectories)
- Coordination/planning for the fleet → umbrella repo, never here
- Retired material → umbrella `_archive/sigrank-app-attic/` via pointer, never deleted silently and never nested in-repo

## Source vs generated

Generated artifacts are never tracked: `.next/`, `node_modules/`, `coverage/`,
`test-results/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`, `bun.lock`.
`public/` schema artifacts are **copies** — edit the source in
`lib/exchange-gateway/` or `standard/schema/`, then `cp` to `public/`; the
hygiene script byte-compares the pairs.

## Frozen external surfaces (do not move/rename/delete)

283 routes incl. all `/api/v1/*`, `/api/exchange/*`, `/.well-known/*` (agent-card,
agent.json, mcp, oauth-*, workflow/v1, ucp, glama, acp), `sitemap.xml`, `robots.txt`,
`llms.txt`, `llms-full.txt`, `openapi.json`, public schema artifacts, all SEO
surfaces (`/vs/*`, `/guides/*`, `/metrics/*`, `/wiki/*`, `/tools/*`), share/OG/verification
routes, and `package.json` script names consumed by CI.

## Test ownership

`__tests__/ingest/canonical.test.mjs` — the 11/11 frozen acceptance gate.
`__tests__/<domain>/` — owned by the lib domain they cover. `e2e/` — Playwright,
deployed-surface contracts. Contract tests (`__tests__/contract/`) read source
files by filesystem path — they are the tripwire for path moves.

## Verification map

| Change type | Required gates |
|---|---|
| Any commit | `npx tsc --noEmit` + `npm run test:canonical` |
| API routes / scoring | + `npm test` |
| UI | + `npm run test:ui` |
| Path moves | + `node scripts/check-repo-hygiene.mjs` + manifest diff (routes/assets/schemas) |
| Migrations | additive only; apply before merging dependent selects |

## Exceptions & decision log

- **2026-10-05** — Structural reorganization (#189/#201): `Devins_Plans/` + `_archive/` relocated to umbrella; `exchange-gateway/` + `workflows/` folded into `lib/`; `flags.ts`, `banner.svg`, `spine:check` removed; canon stamps added. Rollback: revert the squash commits.
- **`protocol/` grouping rejected** — `standard/` (machine conformance) vs `governance/`+`ontology/` (policy/terminology) share authority but not domain; `canon:` frontmatter unifies without merging ownership.
- **`docs/` kept flat** — the map replaces the move; any future split must ship with a full reference sweep in the same PR.
- **`__tests__/` kept** — package scripts glob the name; a rename is pure churn.
- **`.agents/.claude/.ello` kept separate** — convention paths resolved by their tools.
