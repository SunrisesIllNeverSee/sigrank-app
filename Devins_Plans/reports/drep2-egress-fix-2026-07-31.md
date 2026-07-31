# Drep2 Report: Egress Fix + CodeQL + Ledger Reconcile (2026-07-31)

## Summary

Three pieces of work completed and committed:

1. **Supabase migration ledger reconcile** (commit `4269c2b2`)
2. **CodeQL alert fixes** (2 files)
3. **Supabase egress fix** — all_time board → static, 7d/30d/90d → live DB-filtered, "off" board disabled

## 1. Ledger Reconcile (committed)

- 42 ledger entries → 32 (removed 10 duplicate timestamp entries via `migration repair --status reverted`)
- Deleted 10 duplicate timestamp files, moved 2 seed files to `seeds/`
- Added guardrail: `scripts/check-migration-parity.mjs` + CI job
- Verified: `db push --dry-run` → "Remote database is up to date"

## 2. CodeQL Fixes

Both alerts ("Polynomial regular expression used on uncontrolled data") were the same email validation regex in two API routes. Fix: flip the length check before the regex so the input is bounded to 254 chars before the regex engine touches it.

Files: `app/api/v1/contact/route.ts`, `app/api/v1/account/removal-request/route.ts`

## 3. Egress Fix

### Problem
Supabase free plan egress: **6.03 GB / 5 GB** (over limit, project can be paused).
Root cause: `getLeaderboard` pulled all 2,413 rows (~2.5 MB) on every ISR cycle. The `unstable_cache` workaround failed silently (2 MB cap on Vercel). ISR alone generated ~16 GB/month.

### Solution
- **all_time board → static**: `scripts/generate-board-snapshot.mjs` generates `public/data/board-all_time.json` (1.2 MB, 1,642 operators). Served from Vercel CDN = zero Supabase egress. Refreshed daily via GitHub Action.
- **7d/30d/90d → live DB-filtered**: Added `.eq("window_type", window)` to the PostgREST query. Fetches only rows for that window (87/68/74 rows vs 2,413). 60× reduction per query.
- **"off" board disabled**: Redirects to `/board/all`. The `allSnapshots: true` path that pulled everything is removed.

### Egress after fix
| Source | Before | After |
|--------|--------|-------|
| /board/all ISR | 60 MB/day | 0 (static CDN) |
| /board/7d ISR | 60 MB/day | 288 KB/day |
| /board/30d ISR | 60 MB/day | 384 KB/day |
| /board/90d ISR | 60 MB/day | 326 KB/day |
| /hall ISR | 240 MB/day | 1 MB/day |
| /research ISR | 60 MB/day | 0 (static CDN) |
| /methodology ISR | 2.5 MB/day | 0 (static CDN) |
| **Monthly total** | **~16 GB** | **~60 MB** |

**60 MB/month = 0.01× the free plan limit.** No Pro plan needed.

### Data integrity
- 1,642 operators in static snapshot (matches DB count)
- Top 3: Richard Fu (Υ=2.46M), younhomaeng-svg (Υ=2.27M), honggilgim (Υ=1.13M) — all TRANSMITTER class
- 133 non-compounding operators (null yield — Codex/ChatGPT gap, cache_creation=0) — still on board, ranked last
- 16 claimed (interactive humans) — included in static snapshot
- Cascade metrics computed in the generate script (mirrors `lib/analytics/cascade.ts`)

### Files changed
| File | Action |
|------|--------|
| `lib/board/queries.ts` | DB-side window filter for 7d/30d/90d |
| `lib/board/static-board.ts` | NEW — static all_time board reader |
| `scripts/generate-board-snapshot.mjs` | NEW — generates static JSON |
| `public/data/board-all_time.json` | NEW — 1.2 MB static snapshot |
| `app/board/[window]/page.tsx` | all_time reads static, "off" redirects to /all |
| `app/research/page.tsx` | reads static all_time |
| `app/methodology/page.tsx` | reads static all_time |
| `app/hall/page.tsx` | all_time window reads static |
| `app/api/v1/contact/route.ts` | CodeQL fix (length check before regex) |
| `app/api/v1/account/removal-request/route.ts` | CodeQL fix |
| `package.json` | added `board:snapshot` script |
| `.github/workflows/refresh-board-snapshot.yml` | NEW — daily GitHub Action |

### Verification
- `npx tsc --noEmit`: 0 new errors (pre-existing errors in `payload-schema.ts` + `middleware.ts` unchanged)
- `npm run test:canonical`: 11/11 pass
- Static JSON validated: 1,642 entries, correct yield rankings, non-compounding operators included

### GitHub secrets needed
- `SUPABASE_ACCESS_TOKEN` — for the migration-parity CI job (already handled by owner)
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — for the daily board snapshot GitHub Action (likely already set as Vercel env vars; need to add as GitHub secrets)

— Drep2
