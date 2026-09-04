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
| DNS-AID publish (sigeconomy.com) | `CLOUDFLARE_API_TOKEN=<dns-write> node scripts/dns-aid/cloudflare-dns-aid.mjs` |
| DNS-AID publish (signalaf.com) | `PORKBUN_API_KEY=... PORKBUN_SECRET_API_KEY=... node scripts/dns-aid/porkbun-dns-aid.mjs` |
| DNS-AID verify | `node scripts/dns-aid/verify-dns-aid.mjs [domain]` |

**Bun (faster alternative):** All test/typecheck commands also work with Bun,
which is ~10-30x faster than npm for install + script startup:

| What | Bun command |
|------|-------------|
| Install deps | `bun install` |
| Type check | `bunx tsc --noEmit` |
| Canonical tests | `bun run test:canonical` |
| All unit tests | `bun run test` |
| Lint | `bun run lint` |

Bun is installed at `~/.bun/bin/bun` (v1.3.13). It reads the same `package.json`
scripts and `package-lock.json` — no migration needed. Use `bunx` instead of
`npx` for one-off package execution (e.g. `bunx tsc`, `bunx vitest`).

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

## GitHub hygiene (mandatory)

**No personalizations in GitHub titles or commit messages.**

This is non-negotiable. Personal names, handles, emails, or identifying
information must NEVER appear in:

- PR titles
- Issue titles
- Commit messages (subject or body)
- Branch names
- PR/issue descriptions

Use neutral, technical language only. Examples:

- GOOD: `fix(pricing): unified perks box instead of hollow tier cells`
- BAD: `Deric's pricing fix` or `fix by djm`

The git author/committer name and email are set by the local git config and
are not part of the commit message — those are fine. The rule applies to the
human-readable text content of titles and messages.

If an agent (Devin, Vercel Agent, or any other) adds personalizations to a
title or commit message, reject and rewrite before pushing.

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

## Google Search Console (GSC)

GSC is verified via service account + DNS — NOT in this repo. Do not search for a
google-site-verification meta tag or HTML file. The toolkit lives outside the app:

- Service account key: `~/.config/sigrank/gsc-sa.json`
- Script: `~/Developer/active/SigRank-repos/scripts/gsc/gsc.mjs`
- Instructions: `~/Developer/active/SigRank-repos/scripts/gsc/README.md`
- Property: `sc-domain:signalaf.com` (Domain property)

```bash
export GSC_SA_KEY=~/.config/sigrank/gsc-sa.json
cd ~/Developer/active/SigRank-repos/scripts/gsc
node gsc.mjs sitemaps:list          # registered sitemaps + error counts
node gsc.mjs sitemaps:submit        # resubmit sitemap.xml
node gsc.mjs sitemaps:delete <url>  # remove a stale sitemap
node gsc.mjs index <url> [url...]   # push URL(s) to Indexing API
node gsc.mjs inspect <url>          # URL inspection (verdict + coverage)
node gsc.mjs check:index --push     # inspect all sitemap URLs + auto-push unindexed
node gsc.mjs analytics 28           # clicks/impressions last N days
```

After deploying new pages or updating sitemap, run `sitemaps:submit` + `index` for
new URLs.

---

## Master Canon Context (Search Authority)

This repository deploys **signalaf.com** — the public surface of SigRank. It is
governed by the Search Authority master canon.

### When to load canon context

Before modifying any of the following, load the relevant canon context:

- canonical product definitions (what SigRank is/is not)
- metrics or formulas (Yield, Leverage, Velocity, SNR, 10xDEV, Construction)
- taxonomy (archetypes, classes, ranks)
- methodology pages or research claims
- ecosystem relationships (SigRank ↔ Conservation Law, MO§ES, etc.)
- terminology (MO§ES™ rendering, deprecated terms like CCT)
- product boundaries (operator-vs-model, enterprise vs public canon)
- public positioning or SEO/AEO copy that makes canonical claims

### How to load canon context

```bash
export SEARCH_AUTHORITY_PATH="${SEARCH_AUTHORITY_PATH:-$HOME/Developer/_control/search-authority}"
python3 "$SEARCH_AUTHORITY_PATH/canon_cli.py" context sigrank
```

Or use the MCP server (compatible agents):

```bash
python3 "$SEARCH_AUTHORITY_PATH/canon_mcp.py"
```

If the canon repository is unavailable, **do not invent canonical context** —
ask the owner. The canon outranks ad-hoc public copy or generated model output
for normative product/research truth.

### What is NOT authority-sensitive

CSS/layout, dependency bumps, build config, and test infrastructure do **not**
require loading the canon. Note: SEO/AEO/GEO pages listed in `llms.txt` are
intentional strategic content — see the critical directive at the top of this
file. Do NOT remove them.

### Key governance rules

- SigRank evaluates AI **operators**, not AI models.
- Archetype = shape. Class = scale/qualification. Rank = field position.
- Do NOT redefine Class as total-token volume.
- Exactly ONE MO§ES entity. Canonical display: MO§ES™. Never render: MO§E§.
- The harness may measure authority, but it cannot manufacture authority.
- Automated systems may not promote claims into owner-approved truth.

## stickypads — check the shared board

Before starting work, check the shared operational board for tasks assigned
to you or this repo:

```bash
python3 ~/Developer/_control/stickypads/scripts/check_in.py --agent <your-name>
```

Or clone the ello-ops repo and run from there. The board has:
- TODOs across all repos
- Memos/notes from other agents and the owner
- Current session state

If you discover work that can't be completed immediately, create a task or
drop a note:

```bash
# Create a formal task
python3 ~/Developer/_control/stickypads/scripts/create_task.py \
    --title "Specific actionable title" \
    --project <this-repo-name> \
    --owner <your-name>

# Drop a quick memo (no format required)
python3 ~/Developer/_control/stickypads/scripts/drop.py \
    --from <this-repo-name> \
    "Quick note about what needs attention"
```

At session end or meaningful completion, reconcile this repo's coord kit
state into stickypads:

```bash
python3 ~/Developer/_control/stickypads/scripts/reconcile_coord.py \
    --repo-path . --dry-run
```


## Filesystem MCP — REQUIRED for file operations

This is a core framework/search/ello/product repository. When performing
file operations, prefer the Filesystem MCP tools over ad-hoc shell commands:

- `list_directory` / `directory_tree` — structured directory traversal
- `search_files` — glob-pattern file search within allowed paths
- `read_multiple_files` — batch file reads (failures do not stop the batch)
- `edit_file` with `dryRun: true` — preview structural changes before applying

Allowed paths: ~/Developer, ~/.config/devin, ~/.config/sigrank, ~/Desktop

For single-file reads and edits, native tools are acceptable. For multi-file
operations, directory exploration, and structural changes, use the Filesystem MCP.


## Context7 MCP — REQUIRED before writing library code

This repo writes code against external libraries. Before using a library API
that may have changed since training data cutoff, query Context7 to verify
the current pattern:

1. resolve-library-id — find the library (e.g. "Cloudflare Workers", "Supabase")
2. query-docs — ask the specific question (e.g. "KV write limits free tier")

Key libraries in this stack:
- Cloudflare Workers: /websites/developers_cloudflare_workers
- Cloudflare KV: /llmstxt/developers_cloudflare_kv_llms_txt
- Supabase: /supabase/supabase
- Next.js: /vercel/next.js
- Hono: /websites/hono_dev
- Playwright: /microsoft/playwright
- Pydantic: /pydantic/pydantic
- Python: /python/cpython

Do not rely on training data for library APIs. Do not call more than 3 times
per question.


## Repomix MCP — Codebase orientation

When starting work in this repo or picking up a handoff, use Repomix MCP to
pack the codebase and grep for key patterns (function names, formulas, config,
dependencies) to orient yourself in 2-3 calls instead of reading files one
by one. Useful for canon alignment audits (grep for formula implementations
and compare against Search Authority definitions) and cross-repo consistency
checks.


## MCP Server Recommendations for This Repo

Full index: `Moses_Enterprise_B2BPilot_/_workspace/MCP_INDEX.md`

**Primary (use regularly):**
- `supabase` — database schema, migrations, logs, advisors for this app's backend
- `vercel` — deploy, project management, docs for this app's hosting
- `gsc-seo-sigeconomy` — Google Search Console for sigeconomy.com SEO data
- `sigeconomy-search` / `signalaf-search` — AI Search for sigeconomy.com and signalaf.com
- `posthog` — product analytics, user events, session replay for signalaf.com
- `indexnow` — submit new/changed URLs to Bing/Yandex after deploys
- `no-slop` / `ai-slop-checker` — check landing page copy for AI writing tells

**Secondary (use as needed):**
- `context7` — verify Next.js 15 / Supabase / Stripe API patterns before writing
- `playwright` / `chrome-devtools` — E2E testing, visual verification of live pages
- `web-scrape` — extract structured data from live pages, check JSON-LD
- `repomix` — pack codebase for handoffs
- `brave-search` — research competitor benchmarks/tools

**Not needed here:**
- `sigadmin` — that's for the SigRank-gtm outreach repo
- `ds-server` — that's for the b2bpilot telemetry workers
- `blender` / `worldmonitor` — unrelated
