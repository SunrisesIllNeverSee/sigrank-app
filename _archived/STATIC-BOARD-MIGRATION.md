# Static Board Migration — 2026-09-02

## What moved

The static all-time leaderboard (`board-all_time.json`, ~1.2MB) was removed
from sigrank-app and the full seeded board now lives on **sigeconomy.com**.

## Why

sigrank-app (signalaf.com) is the live proof surface — it should show only
claimed operators with verified submissions. The seeded corpus (1,628
operators including unclaimed seed data) is a historical archive and belongs
on the satellite site (sigeconomy.com), not the primary product.

## What was deleted

- `public/data/board-all_time.json` — static JSON snapshot (1.2MB)
- `lib/board/static-board.ts` — static board reader + shape converter
- `scripts/generate-board-snapshot.mjs` — daily generation script
- `.github/workflows/refresh-board-snapshot.yml` — daily generation workflow
- `.github/workflows/snapshot-archive.yml` — 5-day release tagging workflow

## What changed

### Board pages (`/board/all`, `/board/7d`, `/board/30d`, `/board/90d`)
- All windows now filter to `claimed: true` operators only
- Seed operators (unclaimed) no longer appear on signalaf.com boards
- Pagination fetch changed from static JSON to `/api/v1/leaderboard` API

### `/hall`
- "All" scope now shows only claimed/live operators (same as "Active" scope)
- Previously showed top 50 by yield including seed data

### `/methodology`
- Key figures now computed from claimed operators only
- Previously read from static JSON snapshot

### `/llms.txt` + `/llms-full.txt`
- Removed static board fallback for `top_yield`
- `top_yield` now comes from `system_stats` (populated by migration 0048)

### Redirect
- `/board/seeded` → `https://sigeconomy.com/all-time` (301 permanent)
- Pointer note added to bottom of `/board/all` page

## Where the seeded board lives now

- **sigeconomy.com/all-time** — full archive including all seed operators
- Built in sigarena PRs #9, #10, #11
- Fetches from signalaf.com's public API (`/api/v1/leaderboard`)
- Includes HCM filter toggle (Human / All)
- Uses sigarena's own theme/components (RankCard, gradient-text, etc.)

## Verification

- `npx tsc --noEmit` — 0 errors
- `npm run test:canonical` — 11/11 pass
- Seed data remains in Supabase DB (tokscale_seed_full.sql migration)
- sigarena /all-time shows the full seeded field via API
