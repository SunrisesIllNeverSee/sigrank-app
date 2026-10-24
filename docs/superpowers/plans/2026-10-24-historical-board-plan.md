# Historical Leaderboard Island Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/board/history`: the frozen July 31, 2026 leaderboard (1,642 rows) rendered by the original July 31 table inside the current WorkspaceShell, with a left-sidebar mini profile and a right-sidebar historical compare, fully isolated from live data.

**Architecture:** A byte-identical copy of the July 31 JSON lives in `data/history/` with a manifest; a pure reader in `lib/history/` validates it. The original `LeaderboardTable.tsx@4c610df9` is vendored verbatim under `components/history/legacy/`, then minimally adapted (no routing, no live links, no analytics). A static page composes it in `WorkspaceShell` with `left` (mini profile) and `right` (compare) panels and a scoped CSS bridge that maps the legacy palette to the four workspace themes.

**Tech Stack:** Next.js App Router (webpack build), React, TypeScript, node `--test` with `--experimental-strip-types` (`__tests__/**/*.test.mjs`), vitest + Testing Library (`__tests__/ui/`), Playwright (`e2e/`).

**Spec:** `docs/superpowers/specs/2026-10-24-historical-board-design.md` (until Phase 0 copies it in: `~/Developer/active/SigRank-repos/_handoff/specs/2026-10-24-historical-board-design.md`).

## Global Constraints

- Source commit `4c610df9`, path `public/data/board-all_time.json`, git blob `1a24939623ea0a8efeaaa68ba0e5818c684f7203`, 1,237,309 bytes, `generated_at` `2026-07-31T12:09:09.303Z`, `window` `all_time`, `total_operators` 1642, 1,626 seeded, 16 real, ranks exactly 1..1642.
- Never edit, reformat, regenerate or re-rank `data/history/board-all_time-2026-07-31.json`.
- Names render as the original did: `anonId` main line, `subLabel` under it, seeded rows italic, nothing masked (owner 2026-10-24).
- `percentile` (0 on every row) is never displayed.
- No metric or class label may be invented or renamed; labels come from `LeaderboardTable.tsx@4c610df9` verbatim (canon rule, `lib/identity/canon-ids.ts`).
- Isolation: `lib/history/**`, `components/history/**`, `app/board/history/**` never import `lib/board/**`, `lib/supabase/**`, `components/board/**`, `lib/infra/posthog/**`, `components/live/medal-leaders*`, `components/live/enrich*`, or any `/api` client.
- Live components get exactly one edit each: an `ORIGINAL BOARD` footer link in `components/live/WorkspaceShell.tsx` and `components/live/LiveBoardWorkspace.tsx`.
- Work only in a fresh worktree from `origin/main`. Stage by explicit path. No push without the owner; no merge; no deploy.
- Themes: `green`, `gold`, `bone`, `purple` (`components/live/utils.ts` `THEMES`).

## Review Focus

1. Sorting by any column, then searching, then toggling Seeded only: a person expects each row to still show its archived rank and italic/non-italic seed styling.
2. Rows with null `yield_`/`leverage`/`dev10x` (133–134 rows) and the one null `signalClass`: a person expects "—" and the row to sort last, not crash, not show 0, not drop out of the board.
3. Opening the page on a 390px phone: a person expects the 1,642-row table to scroll inside the shell, and the mini profile and compare panels to be reachable and closable.
4. Clicking a row whose codename also exists on the live board (e.g. `zachlagden`, `glnarayanan`): a person expects the archived card only, with no jump to a live profile.
5. Switching theme (Shift+T or account menu) while on the island: a person expects the legacy table colors to follow immediately, readable in all four themes.

Tests for each are added in the owning tasks (4, 4, 10, 7, 5).

---

## Phase 0 — Setup

### Task 0: Worktree, bus note, baseline screenshots

**Files:**
- Create: `docs/superpowers/specs/2026-10-24-historical-board-design.md` (copy from `_handoff/specs/`)
- Create: `docs/superpowers/plans/2026-10-24-historical-board-plan.md` (copy from `_handoff/specs/`)
- Create: `e2e/history/capture.spec.ts` (screenshot capture used here and in Task 10)

- [ ] **Step 1:** `git -C ~/Developer/active/SigRank-repos/_01_sigrank-app fetch origin` then `git worktree add ../_01_sigrank-app-history -b feat/historical-board origin/main`. Record `origin/main` SHA in the PR notes.
- [ ] **Step 2:** Append one entry to `~/Developer/active/SigRank-repos/D-REP-SCRATCH.md`: `→ CLAUDE · <date -u> · historical board island` with branch name and the spec path. Own entry only.
- [ ] **Step 3:** In the worktree, `npm ci` and `npm run build && npm start` (or `npm run dev`) on :3000.
- [ ] **Step 4:** Write `e2e/history/capture.spec.ts`: for each theme in `["green","gold","bone","purple"]` × viewport `{1440×900, 390×844}` × path in `["/", "/board/all", "/compare", "/hall", "/user/furic"]`, `page.goto(path + "?theme=" + theme)`, wait for network idle, `page.screenshot({ path: \`_shots/${label}/${slug}-${theme}-${w}.png\`, fullPage: false })`. `label` comes from `process.env.SHOTS_LABEL` (default `before`). Skip under CI (`test.skip(!!process.env.CI)`).
- [ ] **Step 5:** Run `SHOTS_LABEL=before E2E_BASE_URL=http://localhost:3000 npx playwright test e2e/history/capture.spec.ts`. Expected: 40 PNGs in `_shots/before/`. Add `_shots/` to `.gitignore`.
- [ ] **Step 6:** Commit:
```bash
git add docs/superpowers/specs/2026-10-24-historical-board-design.md docs/superpowers/plans/2026-10-24-historical-board-plan.md e2e/history/capture.spec.ts .gitignore
git commit -m "docs(history): design + plan for /board/history island; baseline capture spec"
```

## Phase 1 — Frozen data

### Task 1: Frozen asset, manifest, integrity test

**Files:**
- Create: `data/history/board-all_time-2026-07-31.json` (byte copy)
- Create: `data/history/manifest.json`
- Create: `data/history/README.md` (3 lines: what it is, source commit, "never edit or regenerate")
- Modify: `.gitattributes` (create if absent)
- Test: `__tests__/history/snapshot-integrity.test.mjs`

**Interfaces:**
- Produces: `data/history/manifest.json` with exactly these keys: `source_commit` ("4c610df9" full SHA), `source_path`, `git_blob`, `bytes`, `sha256`, `generated_at`, `window`, `total_operators`, `entries`, `seeded`, `real`, `copied_at` (UTC from `date -u`).

- [ ] **Step 1: Write the failing test** `snapshot-integrity.test.mjs`:
  - `git hash-object data/history/board-all_time-2026-07-31.json` (via `execFileSync`) === `"1a24939623ea0a8efeaaa68ba0e5818c684f7203"`
  - file byte length === 1237309 === `manifest.bytes`; sha256 (node `crypto`) === `manifest.sha256`
  - parsed `generated_at === "2026-07-31T12:09:09.303Z"`, `window === "all_time"`, `total_operators === 1642`, `entries.length === 1642`
  - seeded count 1626, real count 16; sorted ranks deep-equal `[1..1642]`
  - `.gitattributes` contains the line `data/history/*.json -text`
- [ ] **Step 2:** `node --test __tests__/history/snapshot-integrity.test.mjs` → FAIL (file missing).
- [ ] **Step 3:** `git show 4c610df9:public/data/board-all_time.json > data/history/board-all_time-2026-07-31.json`; write `.gitattributes` line; compute sha256 and write `manifest.json`; write README.
- [ ] **Step 4:** Re-run → PASS.
- [ ] **Step 5:** Commit (explicit paths: the 4 files + test).

### Task 2: Reader

**Files:**
- Create: `lib/history/types.ts`, `lib/history/parse.ts`, `lib/history/board-2026-07-31.ts`
- Test: `__tests__/history/parse.test.mjs`

**Interfaces:**
- Produces:
  - `type HistoricalEntry` = `StaticBoardEntry` copied verbatim from `lib/board/static-board.ts@4c610df9` (all 34 fields, same optionality).
  - `interface HistoryManifest` (keys from Task 1).
  - `interface HistoricalBoard { meta: { generatedAt: string; window: "all_time"; totalOperators: number; sourceCommit: string; gitBlob: string; seeded: number; real: number }; entries: HistoricalEntry[] }`
  - `parseHistoricalBoard(raw: unknown, manifest: HistoryManifest): HistoricalBoard` in `parse.ts` — relative imports only (node test runner has no `@/` alias). Throws `Error("history snapshot mismatch: <field>")` on any header/count mismatch. Returns entries as-is (same object order, no copying of fields, no defaults).
  - `getHistoricalBoard(): HistoricalBoard` in `board-2026-07-31.ts` — static `import raw from "@/data/history/board-all_time-2026-07-31.json"` and manifest import; memoized.

- [ ] **Step 1: Write failing tests** in `parse.test.mjs` (import `../../lib/history/parse.ts`):
  - `parseHistoricalBoard(file, manifest).entries` deep-equals `file.entries` (strict, including `null`s and `isSeed`).
  - `meta.totalOperators === 1642`, `meta.seeded === 1626`, `meta.real === 16`.
  - Mutated header (`generated_at` changed) throws `/history snapshot mismatch: generated_at/`; one entry removed throws `/mismatch: entries/`.
  - Entry with `rank: 1` has `anonId === "Richard Fu"` and `codename === "furic"`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement the three files per the Interfaces block.
- [ ] **Step 4:** Run → PASS. Also `npx tsc --noEmit` clean for `lib/history`.
- [ ] **Step 5:** Commit.

## Phase 2 — The original table

### Task 3: Vendor the July 31 table verbatim

**Files:**
- Create under `components/history/legacy/`: `LeaderboardTable.tsx`, `types.ts`, plus each dependency the table imports **whose relevant export differs on `origin/main`** from `4c610df9`: `PlatformIcon.tsx`, `constants.ts` (only `PLATFORM_UI`, `PLATFORM_DOMAIN_MAP`, `CLASS_FILTER`, `type PlatformUI` and their transitive needs), `outlier-classify.ts` (only `isOutlierEntry`), `canon-glyph.ts` (only `glyphFor`). A dependency whose export is identical on main (e.g. `OperatorAvatar.tsx`) is imported from main instead.

- [ ] **Step 1:** For each file, `git show 4c610df9:<path>` into the legacy folder; trim helper files to the listed exports only. Add a 3-line header to each: `ARCHIVAL COPY of <path>@4c610df9 (2026-07-31) for /board/history. Frozen: do not sync with live code. Not canon.`
- [ ] **Step 2:** Rewrite import paths inside the legacy folder to point at the vendored copies. No other edits in this task (a reviewer diffs this commit against `4c610df9` and sees only headers, trims and import paths).
- [ ] **Step 3:** `npx tsc --noEmit` → no errors from `components/history/legacy/` (the table may be unused until Task 4).
- [ ] **Step 4:** Commit: `chore(history): vendor July 31 LeaderboardTable + deps verbatim (4c610df9)`.

### Task 4: Adapt the table for the island

**Files:**
- Modify: `components/history/legacy/LeaderboardTable.tsx`
- Test: `__tests__/ui/history-table.test.tsx`, fixture `__tests__/fixtures/history-subset.json` (rows ranked 1–60 + all 16 real rows + every row with null `signalClass`/`yield_` among ranks ≤ 300, taken verbatim from the snapshot)

**Interfaces:**
- Consumes: `HistoricalEntry` (Task 2).
- Produces: `export function HistoricalLeaderboardTable(props: { entries: HistoricalEntry[]; totalUsers: number; onSelect: (e: HistoricalEntry) => void; selectedCodename?: string }): JSX.Element` (rename of the vendored export; keep the original also exported only if needed internally).
- Every rendered operator row carries `data-archived-rank={entry.rank}` and `data-seed={entry.isSeed ? "1" : "0"}`.

- [ ] **Step 1: Write failing tests** (vitest; mock `next/navigation` as `__tests__/ui/WorkspaceShell-collapse.test.tsx` does):
  - renders one row per fixture entry; first row `data-archived-rank="1"` text includes "Richard Fu" and "@furic".
  - for every sortable header button, click once and twice: the multiset of `{codename → data-archived-rank, data-seed}` equals the fixture's mapping (no row's archived rank or seed flag changed).
  - the visible rank cell of each row contains its archived rank value after any sort.
  - null `yield_` rows render "—" in that column and sit after all non-null rows when sorted by that column, both directions.
  - "Seeded only" filter: row count == fixture seeded count; real rows absent; remaining rows keep their archived ranks (gaps present).
  - search "zachlagden" → one row; search by display name "Richard" → includes rank 1.
  - clicking an operator name calls `onSelect` with that entry; `document.querySelectorAll('a[href^="/user/"]').length === 0`.
  - no element renders the text of any `percentile` value column header (percentile column absent).
- [ ] **Step 2:** `npx vitest run __tests__/ui/history-table.test.tsx` → FAIL.
- [ ] **Step 3:** Make exactly the design §4 changes: remove `useRouter`/`router.push` (window fixed to all-time, platform filter and breakdown become local state, window control removed); replace `<Link href="/user/...">` with `<button type="button" onClick={() => onSelect(e)}>` keeping the same inner markup and styles; remove `track()` calls and `BoardCapture`; add the "Seeded only" toggle next to the existing filters using the table's existing filter control styling; add the two data attributes; hide any percentile display. If the `#` cell shows a computed sort rank, keep it only alongside the archived rank (archived rank remains visible text).
- [ ] **Step 4:** Run → PASS. Run `npm run test:ui` → no other suite broke.
- [ ] **Step 5:** Commit.

### Task 5: Theme bridge

**Files:**
- Create: `components/history/history-island.css`
- Test: `e2e/history/theme.spec.ts`

**Interfaces:**
- Produces: class `.hist-island` (wrapper around the table and panels). Under `.lbw-root[data-theme="<t>"] .hist-island` for each of the four themes, defines `--bg-surface`, `--bg-elevated`, `--bg-base`, `--bg-border`, `--bg-border-subtle`, `--text-primary`, `--text-muted`, `--gold` as space-separated RGB triplets (the legacy table uses `rgb(var(--x))`), derived from that theme's `.lbw-root[data-theme]` block in `components/live/proto-scoped.css` (lines ~34–70).

- [ ] **Step 1: Write failing e2e test**: for each theme, `goto("/board/history?theme=<t>")`, read computed `background-color` of the table container and `color` of the first operator name; assert they equal the expected RGB from the theme block, and that WCAG contrast between them ≥ 4.5. Then press `Shift+T` once and assert the table container background changed to the next theme's value (Review Focus 5).
- [ ] **Step 2:** Run → FAIL (route missing until Task 6; acceptable to write now and run after Task 6, mark as such in the commit message).
- [ ] **Step 3:** Write the CSS.
- [ ] **Step 4:** After Task 6, run → PASS.
- [ ] **Step 5:** Commit.

## Phase 3 — The page

### Task 6: Route, header, explainer, isolation

**Files:**
- Create: `app/board/history/page.tsx`, `components/history/HistoryIsland.tsx` (client: holds `selected` and `compare` state, renders shell + table + panels), `components/history/HistoryHeader.tsx`
- Test: `__tests__/history/isolation.test.mjs`, `e2e/history/no-live-requests.spec.ts`

**Interfaces:**
- Consumes: `getHistoricalBoard()` (Task 2), `HistoricalLeaderboardTable` (Task 4), `.hist-island` (Task 5).
- Produces: `HistoryIsland({ board }: { board: HistoricalBoard })`; it owns `selected: HistoricalEntry | null`, `compare: [HistoricalEntry | null, HistoricalEntry | null]`, `addToCompare(e: HistoricalEntry): void` (fills A then B; a third add replaces B), `clearCompare(slot: 0 | 1): void`.

- [ ] **Step 1: Write failing tests:**
  - `isolation.test.mjs`: walk `lib/history`, `components/history`, `app/board/history`; regex every `import ... from "<spec>"`; assert none match `^@/lib/board`, `^@/lib/supabase`, `^@/components/board`, `^@/lib/infra/posthog`, `medal-leaders`, `enrich`, `/api/`, `next/navigation` (inside `components/history/legacy`). Allowed `@/components/live/WorkspaceShell`, `@/lib/identity/claim-contact`, `@/components/sigrank/OperatorAvatar`, and any other main import named in Task 3's identical-export list.
  - `no-live-requests.spec.ts`: record every request on `goto("/board/history")`, scroll the table to the bottom, click a row, add two rows to compare; assert no URL matches `/api/live-board`, `/api/v1/leaderboard`, `/api/(field|hall|compare|movers|board)`, `supabase.co`. Allowed: `/api/auth/session`, `/api/v1/profile`.
- [ ] **Step 2:** Run both → FAIL.
- [ ] **Step 3:** `page.tsx`: `export const dynamic = "force-static"`; `generateMetadata` with title "Historical Leaderboard · July 31, 2026 · SignalAF", description stating 1,642 operators and frozen snapshot; no JSON-LD. Renders `<HistoryIsland board={getHistoricalBoard()} />`. `HistoryIsland` renders `WorkspaceShell` with `active="board"`, `title` = `HistoryHeader`, `leftTitle="OPERATOR · JULY 31"`, `rightTitle="COMPARE"`, `leftDefaultOpen`, `rightDefaultOpen`, children = `.hist-island` wrapper around the table. `HistoryHeader` shows: "Historical Leaderboard", "Snapshot: July 31, 2026", `${totalOperators.toLocaleString()} operators`, an `ARCHIVE · FROZEN` badge, the fingerprint "4c610df9 · blob 1a249396" linking to the commit on GitHub, and the explainer (draft copy; flag for owner in PR).
- [ ] **Step 4:** Run both → PASS. Load `/board/history` manually in each theme; confirm `/board/all` still renders the live board (static segment did not shadow `[window]`).
- [ ] **Step 5:** Record RSC/HTML payload size for `/board/history` in PR notes.
- [ ] **Step 6:** Commit.

## Phase 4 — Sidebars

### Task 7: Left sidebar mini profile + claim

**Files:**
- Create: `components/history/MiniProfile.tsx`
- Modify: `components/history/HistoryIsland.tsx` (pass `left`)
- Test: `__tests__/ui/history-mini-profile.test.tsx`

**Interfaces:**
- Consumes: `HistoricalEntry`, `claimMailto(codename?: string): string` from `@/lib/identity/claim-contact`, `addToCompare` (Task 6).
- Produces: `MiniProfile({ entry, onAddToCompare }: { entry: HistoricalEntry | null; onAddToCompare: (e: HistoricalEntry) => void })`.

- [ ] **Step 1: Write failing tests:**
  - `entry=null` → text "Select an operator".
  - entry rank 1 → shows "Richard Fu", "@furic", "furic", archived rank "1", class as stored, banner text "Snapshot from July 31, 2026. Not linked to a live profile."
  - claim link `href === claimMailto("furic")`.
  - entry `zachlagden` → zero `a[href^="/user/"]`, zero `a[href^="/me"]` inside the card (Review Focus 4).
  - entry with null `yield_` → "—" for that metric.
  - "Add to compare" click calls `onAddToCompare(entry)`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement; metrics shown = the metric columns the legacy table displays in its default (Metric) view, using its labels (import the label list from the vendored table module rather than retyping). Use the shell's `.mod` box styling.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit.

### Task 8: Right sidebar compare

**Files:**
- Create: `lib/history/compare.ts`, `components/history/ComparePanel.tsx`
- Modify: `components/history/HistoryIsland.tsx` (pass `right`)
- Test: `__tests__/history/compare.test.mjs`, `__tests__/ui/history-compare.test.tsx`

**Interfaces:**
- Produces:
  - `type CompareKey` = the metric keys the legacy table displays (same list Task 7 imports).
  - `compareEntries(a: HistoricalEntry, b: HistoricalEntry, keys: CompareKey[]): { key: CompareKey; a: number | null; b: number | null; higher: "a" | "b" | "tie" | null }[]` — `higher` is `null` when either side is null; `"tie"` on equal.
  - `ComparePanel({ slots, onPick, onClear, entries })` where `slots: [HistoricalEntry | null, HistoricalEntry | null]`, `onPick(slot: 0 | 1, e: HistoricalEntry)`, `onClear(slot: 0 | 1)`, `entries: HistoricalEntry[]` (snapshot rows for the picker search).

- [ ] **Step 1: Write failing tests:**
  - `compare.test.mjs`: rank 1 vs rank 2 on `yield_` → `higher: "a"`; a row with null `yield_` vs rank 1 → `higher: null`, values `null`; identical entry vs itself → all `"tie"` or `null`.
  - `history-compare.test.tsx`: empty slots show "Pick an operator" twice; picker search "honggilgim" lists it, selecting fills slot; with two slots filled shows both archived ranks and one row per key; clear removes; no `a[href^="/compare"]` and no `a[href^="/user/"]`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement; picker searches `anonId`, `codename`, `subLabel` over `entries` only, max 8 results.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit.

## Phase 5 — Entry point

### Task 9: ORIGINAL BOARD footer link

**Files:**
- Modify: `components/live/WorkspaceShell.tsx` (~L608, after `<Link href="/board/all">LEADERBOARD</Link>`)
- Modify: `components/live/LiveBoardWorkspace.tsx` (~L2327, same spot)
- Test: `__tests__/ui/history-entry-link.test.tsx`

- [ ] **Step 1: Write failing test:** render `WorkspaceShell` (mocks as in the collapse test); `screen.getByRole("link", { name: "ORIGINAL BOARD" })` has `href="/board/history"`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Add `<Link href="/board/history">ORIGINAL BOARD</Link>` in both footers. No other change to either file.
- [ ] **Step 4:** Run → PASS; `git diff --stat` shows +1 line in each live file (plus import if `Link` absent).
- [ ] **Step 5:** Commit.

## Phase 6 — Verification and delivery

### Task 10: E2E, screenshots, PR

**Files:**
- Create: `e2e/history/island.spec.ts`

- [ ] **Step 1: Write the e2e spec:**
  - desktop 1440: `/board/history` shows "Historical Leaderboard", "1,642 operators", "ARCHIVE · FROZEN"; scroll table to last row → `data-archived-rank="1642"` reachable (paginate if the table paginates); click a row → left panel shows its name; add two to compare → right panel shows both.
  - mobile 390 (Review Focus 3): page loads, table scrolls vertically inside the shell, row tap opens mini profile, panel can be closed, mobile chrome menu opens and closes, no horizontal page scroll (`document.documentElement.scrollWidth <= 390`).
  - for each theme: page renders with `data-theme=<t>` on `.lbw-root`.
- [ ] **Step 2:** Run `E2E_BASE_URL=http://localhost:3000 npx playwright test e2e/history/` → all PASS (island, theme, no-live-requests).
- [ ] **Step 3:** Run the full gates: `npm test`, `npm run test:ui`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, existing `npx playwright test e2e/leaderboard.spec.ts e2e/compare-themes.spec.ts e2e/profile.spec.ts e2e/theme-cycle.spec.ts`. Record pass/fail counts; any failure that also fails on `origin/main` is noted as pre-existing, not fixed here.
- [ ] **Step 4:** Add `/board/history` to `capture.spec.ts` paths; run with `SHOTS_LABEL=after`. Compare `before/` vs `after/` for the five existing pages (expected: identical except the new footer link).
- [ ] **Step 5:** Re-verify `origin/main` (`git fetch && git log origin/main -1`); rebase if it moved and re-run Step 3.
- [ ] **Step 6:** Commit the spec. **Stop.** Ask the owner before `git push` and opening the PR (estate rule: push needs the owner). After approval: push the branch and open the PR with: source evidence table, architecture notes, owner-review items (explainer copy, entry-link placement, compare layout), test results, changed-file list (`git diff --stat origin/main`), screenshots (four themes, desktop + mobile, before/after). No merge, no deploy.
