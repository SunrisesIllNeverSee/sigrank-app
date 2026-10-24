# Historical Leaderboard island (`/board/history`) — design

Stamped 2026-10-24 09:24 UTC (v2; v1 07:11 UTC). Owner: Deric. Repo: `_01_sigrank-app`.
Supersedes the owner brief "SignalAF Historical Leaderboard Integration" where they differ: source is the July 31 snapshot (not Aug 31), the table is the original July 31 table (not restyled), and historical compare is in scope.

## Owner decisions (recorded)

All by Deric in the planning session, 2026-10-24 (UTC):
- Source = the July 31, 2026 board file, as exported. Default view = full board (1,642 rows); a "Seeded only" filter hides the 16 real rows, rank gaps kept.
- The page is an **island** inside the site: current site chrome (WorkspaceShell rail, themes, top/bottom bars) around it; inside, the **older version of the leaderboard** (the July 31 table's look and behavior), all-time only.
- Clicking a row opens a **mini profile in the left sidebar**. Users can **compare in the right sidebar** (historical vs historical only).
- Names show **as the original did**: display name (`anonId`) as the main line, `@handle` under it, seeded rows in italics, real users included, nothing masked.
- Earlier standing decisions still apply: P1 keep real handles for seeded tokscale operators; P2 no history rewrite.

## 1. Intent

Show where SignalAF came from. `/board/history` is the origin record: the board as first frozen to a file, built from seeded tokscale numbers, before live submissions took over, before the reclassification, before the redesign. It has to read as a primary source nobody touched, and show what the board looked like at full scale (~1,600 rows).

### Goals
- Byte-identical copy of the July 31, 2026 export, rendered by the original July 31 table inside the current shell, in all four themes.
- Local search, filter, sort, pagination as the original table did them. The archived rank is never rewritten.
- Left sidebar: snapshot-only mini profile with the existing email claim path.
- Right sidebar: historical-to-historical compare.
- A discoverable entry point that does not displace the live leaderboard.

### Non-goals
- No change to homepage, live board, Compare, Hall, profiles, nav order, or any live component's behavior.
- No other windows (7d/30d/90d), no "off" board, no per-platform breakdown routing.
- No sidebar modules beyond mini profile (left) and compare (right).
- No PNG capture button (BoardCapture) on the island.

### Anti-goals (fail even if it "works")
- Any value on the page differs from the file.
- Any live data leaks in: live ranks, field averages, population, medals, movers, live Compare, live profile links, `/api/v1/leaderboard` lazy fetch.
- The snapshot gets regenerated, reformatted, re-ranked or "fixed" (including the null class and null metrics).
- A historical row can be used to take ownership of a live account.

## 2. Source (verified 2026-10-24)

The board lived in Supabase (seeded July 13 via `supabase/migrations/tokscale_seed_full.sql`); no frozen ranked copy existed until the static snapshot pipeline landed. The first frozen file is the source.

| Field | Value |
|---|---|
| Commit | `4c610df9` (2026-07-31, "fix: Supabase egress overage + CodeQL alerts") |
| Path at commit | `public/data/board-all_time.json` |
| Git blob | `1a24939623ea0a8efeaaa68ba0e5818c684f7203` |
| Size | 1,237,309 bytes |
| `generated_at` | `2026-07-31T12:09:09.303Z` |
| `window` | `all_time` |
| `total_operators` / entries | 1,642 / 1,642 |
| Seeded / real | 1,626 / 16 |
| Ranks | exactly 1–1642 |
| Status | 1,621 active, 21 retired |
| Fields per row | 34 (`StaticBoardEntry` in `lib/board/static-board.ts@4c610df9`) |
| Known nulls (preserve) | `signalClass` 1, `yield_` 133, `leverage` 133, `dev10x` 134, `subLabel` 7 |
| Placeholder | `percentile` is 0 on every row |
| Classes | pre-reclassification labels: ARCH, POWER, ARCH+, TRANSMITTER, BASE, SEEKER, IGNITER, REFINER, BEARER |

Top three: Richard Fu (furic), younhomaeng-svg, honggilgim, all seeded.

The July 31 data path: `app/board/[window]/page.tsx@4c610df9` passed `getStaticAllTimeBoard()` rows straight (cast) into `BoardTableClient` → `components/sigrank/LeaderboardTable.tsx@4c610df9`. `BoardTableClient` lazily fetched more rows from `/api/v1/leaderboard`; the island must not.

Also verified, not used: Aug 31 snapshot (`3d63a2ef`, blob `d6a9d2de…`, 1,649 rows) matches the original brief exactly; Aug 14 file has 1,643 rows.

## 3. Data asset and reader

- Copy byte-for-byte: `git show 4c610df9:public/data/board-all_time.json > data/history/board-all_time-2026-07-31.json`. Server-only location (not `public/`). Add `data/history/*.json -text` to `.gitattributes`.
- `data/history/manifest.json`: source commit, source path, git blob, byte size, sha256, `generated_at`, `window`, entry/seeded/real counts.
- Reader in its own module `lib/history/` (not under `lib/board/`). Static JSON `import` (bundles on both Vercel and OpenNext/Cloudflare; `fs` would not on Cloudflare). Validates header fields and counts against the manifest at load and throws on mismatch. The byte-level check (blob + sha256) is a unit test = CI gate.
- Never regenerated. No script writes to `data/history/`.
- Isolation: `lib/history/**`, `components/history/**`, `app/board/history/**` must not import `lib/board/**`, `lib/supabase/**`, `/api` clients, `components/board/BoardTableClient`, posthog, or live-workspace data helpers (`medal-leaders`, `enrich`, field/population). Allowed: `components/live/WorkspaceShell.tsx` (chrome), `lib/identity/claim-contact.ts`, and frozen copies under `components/history/legacy/`.

## 4. The island (route + table)

- `app/board/history/page.tsx` (static segment beats `app/board/[window]`). `dynamic = "force-static"`, no revalidate.
- Chrome: `WorkspaceShell` with `active="board"`, title strip, four themes, mobile chrome, `.lbw-root` body opt-out as on the board.
- Title strip: **Historical Leaderboard** · **Snapshot: July 31, 2026** · **1,642 operators** · `ARCHIVE · FROZEN` badge. Fingerprint line: commit `4c610df9` + blob `1a249396`, linking to the commit on GitHub.
- Explainer (2–3 sentences, builder drafts, owner approves in PR): the original board, built from seeded public tokscale numbers, frozen July 31, 2026, not updated; today's board is operators who submit their own data (link `/board/all`).
- Table: **frozen copy** of `LeaderboardTable.tsx@4c610df9` and its types and helpers as they were on July 31 (vendored under `components/history/legacy/`), with only these changes:
  1. Window/platform/breakdown controls that called `router.push` become local state or are removed (all-time only). No URL navigation.
  2. Operator-name `<Link href="/user/...">` becomes a button calling `onSelect(entry)`.
  3. `track()` (posthog) and `BoardCapture` removed.
  4. A "Seeded only" filter added beside the existing filters.
  5. Theme bridge: the legacy palette reads site tokens (`--bg-surface`, `--bg-elevated`, `--bg-base`, `--bg-border`, `--bg-border-subtle`, `--text-primary`, `--text-muted`, `--gold`, as `rgb(var(--x))` triplets). A scoped stylesheet maps them from each workspace theme (green, gold, bone, purple) so the table follows the shell theme.
  Everything else (columns, labels, Metric/Raw toggle, sort behavior, search across name/codename/handle, italics for seeds, top-3 boxes, null display) stays as it was.
- Rank integrity: the archived `rank` value is what shows in the rank position. If the original table's `#` cell shows "sort rank over volume rank", keep that behavior only if the archived rank stays visible; it must never be replaced by a computed rank. Nulls sort last.
- `percentile` (all 0) is not displayed.
- All 1,642 rows go to the client once (the original did client-side sort/search). Builder measures and reports the payload.
- SEO: indexable; title/description/OG. No per-person JSON-LD.

## 5. Left sidebar: mini profile

- Left panel opens with an empty state ("Select an operator") and fills on row click.
- Card: display name, `@handle`, codename, archived rank, class, platform(s), status, account age, last seen, and the metrics the original table displayed, as stored. Banner: "Snapshot from July 31, 2026. Not linked to a live profile."
- No link to `/user/[codename]`, even when the codename exists live.
- "Claim this profile" uses `claimMailto(codename)` from `lib/identity/claim-contact.ts` unchanged. Manual email review, identity check before any ownership. No live enrollment, rank transfer or merge. Nothing is written anywhere.
- "Add to compare" sends the row to the right sidebar.

## 6. Right sidebar: compare

- Two slots (A, B), historical rows only, filled by "Add to compare" or a search picker in the panel (search over the snapshot only).
- Shows the two operators' archived rank, class, and the original table's displayed metrics side by side, with which is higher per metric. Nulls show "—" and are not compared.
- No reuse of live Compare components or data (my call: a small self-contained panel; no radar in v1).
- State is local to the page (my call: no URL params, so the route stays static).

## 7. Entry point

My call, owner can change in review: an `ORIGINAL BOARD` link right after `LEADERBOARD` in the two footer link rows (`components/live/WorkspaceShell.tsx` ~L608 and `components/live/LiveBoardWorkspace.tsx` ~L2327). That one link per file is the only edit to live components. No new rail icon.

## 8. Acceptance tests

Unit (`node --test`, `__tests__/**/*.test.mjs`):
- File blob == `1a24939623ea0a8efeaaa68ba0e5818c684f7203`; sha256/bytes == manifest; header fields == manifest; 1,642 rows; 1,626 seeded; ranks exactly 1..1642.
- Reader output deep-equals the raw file rows (nulls, `isSeed` intact).
- Every legacy sort key × both directions, and seeded-only: each row's `rank` and `isSeed` unchanged; counts right.
- Import isolation scan per §3.
- Compare helper: per-metric winner, null handling.

UI (vitest, `__tests__/ui/`): mini profile has no `/user/` link and claim href == `claimMailto(codename)`; row click calls `onSelect`; table shows archived rank after sorting.

E2E (Playwright, `e2e/`):
- `/board/history` makes zero requests to `/api/live-board`, `/api/v1/leaderboard`, other ranking/field/hall/compare APIs, or Supabase. Allowlisted: shell session calls `/api/auth/session`, `/api/v1/profile`.
- Four themes × desktop 1440 / mobile 390 screenshots; scroll, select, compare, mobile chrome.
- Regression: homepage, `/board/all`, `/compare`, `/hall`, one `/user/[codename]` unchanged (existing specs pass; before/after screenshots).

## 9. Delivery and process

- Fresh worktree from `origin/main`; never check out, reset or pull the shared tree. Stage by explicit path. Start note on `~/Developer/active/SigRank-repos/D-REP-SCRATCH.md`.
- Deliverables: source evidence, architecture notes, before/after screenshots in four themes, test results, changed-file list, one PR. No merge, no deploy (owner gate).
- This doc and the plan go into the PR under `docs/superpowers/`.

## 10. Left to the builder
Component split inside `components/history/`, payload projection, empty-state copy, compare picker UI, test file names, screenshot tooling.
