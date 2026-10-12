# NEXT PUSH — WIRING & UI AUDIT

**Branch:** `integration/site-a315435`
**Preview:** `http://localhost:3230/` (use `localhost`, not `127.0.0.1` — dev chunks are blocked cross-origin on the IP host, so hydration silently fails there)
**Date:** 2026-10-12
**Commits:** `33b66c9` (board data) + `a5c60f9` (profile UI) + `b4793c7` (audit) + `68feff6` + `53f3d38` (round-2) + `7a95d3f` + `4157d68` (round-3) + `30b8506` + `c26b5aa` (round-4) + `05c95b5` (round-5) + `a87391a` (round-6) — pushed to `origin/integration/site-a315435`

---

## 1. Opening profile presentation — ✅ DONE

Restored the approved mock split (passport card + railway flap board) as the first Overview section, wired to live data.

- **New** `components/profile-v2/PassportCard.tsx` — holo card: real initials, display name, codename, rank/percentile, class tier, archetype, platform, live metric tiles (yield/SNR/velocity/leverage/10xDev/Scale V), radar normalized against `fieldAvg`, medal dots from `TrophyCounts`. `—` for missing values, never 0.
- **New** `components/profile-v2/FlapBoard.tsx` — ticker board: token pillars (in/out/cache-r/cache-w/total) + derived rows (Υ, SNR, LEV, VEL, DEV, SCL, EFF, $/1M, OP RATIO) with field-average column.
- `components/profile-v2/OverviewView.tsx` — `pv2-opensplit` section added; `fieldAvg` prop.
- `components/profile-v2/profile-workspace.css` — ported pcard/flapboard styles.
- `app/user/[codename]/ProfileBody.tsx` — passes `fieldAvg`.

**Verified:** `/user/xoxo` renders "Karthikeyan KK", 976.9K Υ, IGNITER I, live radar + board. Switching operator changes everything (no mock names). Chromium + WebKit screenshots clean, 0 console errors.

## 2. Snapshot history — ✅ DONE

- **New query** `lib/board/queries.ts` → `getOperatorSnapshotRecords(codename)` + `SnapshotRecord` type. Mirrors `app/api/v1/operators/[codename]/snapshot-history/route.ts`: `snapshot_submissions` scored rows, `submitted_at`, `window_type`/`window_start`/`window_end`, `platform`, `ruleset_version`, four pillars, `computeCascadeMetrics`, `snapshotThroughput`, `resolveWorkflowMode` (+`hcm-v1` tag for HITL).
- Wrapped in `unstable_cache` (`operator` tag, 150s) in `lib/board/cached.ts`; re-exported via `lib/board/index.ts`. New submissions invalidate via the existing `operator` tag.
- `SubmissionsView` renders a 12-column records table: Date · Window · Platform · In · Out · Cache-R · Cache-W · Υ · SNR · Vel · Mode (HITL·hcm-v1 / AGENTIC) · Ruleset. Unreported cells render `—` ("— = NOT REPORTED" in the footer). Falls back to the legacy yield table when no scored records exist.

**Verified:** `/user/xoxo?tab=submissions` shows 12 scored rows across all_time/90d/30d/7d × multi/codex/claude with real pillar values.

## 3. Tier position + HCM graph — ✅ DONE

**What HCM is (from docs):** "Human Center of Mass" — the HITL composition rule in `lib/board/workflow-mode.ts` (`resolveWorkflowMode`): fresh-input share ≤ 0.80 → HITL, with a deep-reuse fallback for share < 0.01 rows. The "historical HCM screen" is a *composition rule*, not an intervention log.

- **Tier Position** (pre-existing) verified complete: yield-vs-log10-tokens scatter, tier-colored field, median crosshair, operator ring+label, `FIELD N=`, rank/top-% — matches R4 mock coordinates exactly.
- **New `HcmSignature`** in `AnalysisView.tsx`: field scatter in the HCM space (x = fresh-input share 0→1, y = yield). Gold dashed boundary at 0.80 (`HCM ≤ 0.80`), cohort region tinted; dots colored by **resolved** `workflow_mode` (HITL gold / AGENTIC cyan / HYBRID violet / unresolved muted); operator halo + `share% · vel · INSIDE/OUTSIDE HCM · mode` in the footer. Same all-time `boardRows` cohort as Tier Position — no window/cohort mixing.

**Verified:** `/user/xoxo?tab=analysis` — N=21 field, operator at 0.0% share → INSIDE HCM · UNRESOLVED · VEL 58.2. Chromium + WebKit identical.

## 4. Records and Honors — ✅ DONE

`OverviewView.tsx` `MedalSvg` rebuilt from a 20px circle to a 30px ribbon-and-disc medal; record summary at 30px, hall-record list at 26px. Counts still from `TrophyCounts`; zero-count medals stay dim, empty states preserved.

## 5. Badges and Achievements — ✅ DONE

- **New** `components/profile-v2/BadgesView.tsx`:
  - *Badges Earned* — same derivation as `SocialView` (metric-rank badges from `trophyCounts.dynamicRecords`, class badge, verified/audited identity, record-holder) plus per-card earn criteria; locked cards at reduced opacity.
  - *Class Ladder* — RS-0.5 `RS05_CLASS_THRESHOLDS` rungs around the operator: locked above, current gold, passed below; live progress bar + "N banked · M to NEXT".
  - *Milestones* — 500-snapshot milestone with real `scoredSnapshots` progress.
- `ProfileTabsV2.tsx` — `badges` tab key/label/prop/panel.
- `ProfileWorkspace.tsx` — sidebar `BADGES` nav item + `?tab=badges` URL support.
- Global rail badge (`PixelBadge`) untouched.

**Verified:** `/user/xoxo?tab=badges` — 10 earned / 3 locked, ladder 49%→BEARER III, 12/500 milestone.

## 6. Leaderboard toolbar — ✅ VERIFIED (no change needed)

`.fbar` (`proto-scoped.css:242`) is `flex; justify-content:center; gap:10px 14px; flex-wrap` inside the fixed header strip — stays at y=37 through board scroll. Contains: HITL/Hybrid/Autonomous seg, All-time/platform/class selects, ⌕ search, Metrics/Raw toggle, ↓ sort, `details.board-share` → Export CSV + Screenshot PNG. Pagination `1/26` present. Raw mode keeps `⬡PLATFORM` column. At 820px the filters collapse cleanly (no clipping; `scrollW == clientW`).

## Wiring verification — journeys

| # | Journey | Result |
|---|---------|--------|
| 1 | Board row → inspector → SEE PROFILE → `/user/xoxo`; name + 976,944 Υ match board | ✅ |
| 2 | Unranked operator `/user/sex` → profile renders with unranked/pending copy | ✅ |
| 3 | `/compare?a=xoxo&b=h82` → both pickers render operators; B-pick to MO§ES updates URL `?b=signal-92b4f9f485` and all surfaces | ✅ |
| 4 | Reload shared compare URL → same operators persist (`a`/`b` slugs canonicalize, e.g. `h82`→`signal-d4e0290661`) | ✅ |
| 5 | `/hall` record chips → `/user/<holder slug>` (Kabir Acharya → `signal-d4e0290661`, etc.) | ✅ |
| 6 | Passport card, flap board, Tier Position, HCM Position, expanded records, enlarged medals, Badges tab all live + real data | ✅ |
| 7 | Public viewer: REPORT/LAB render locked with LockGlyph; rail badge preserved | ✅ |
| 8 | Filters, Metrics/Raw, pagination, CSV (`signalaf-board-all_time.csv`) + PNG (`signalaf-board-workspace-*.png`) downloads | ✅ |
| 9 | Wiki sidebar branches open independently (SigRank + Field + Wiki simultaneously); summary text is a link — click the toggle/gap to expand | ✅ |
| 10 | Playwright WebKit (Safari engine): overview/analysis/badges/submissions render identical to Chromium, 0 errors | ✅ |

## Data sources / intentional differences

- Profile tab views share `getOperator`/`ScoredSnapshot`/`telemetry`/`boardRows`/`history`/`snapshotRecords` — same all-time cohort as the board.
- `fieldAvg` = `computeFieldAverages(boardRows)` — radar + ticker compare against the same live field.
- Compare uses `strictLive` all_time operator-total rows; its history chart draws a **field mean** line (labeled "Field avg"), which is a different baseline than the profile's field-avg radar normalization — intentional (mean vs normalized-at-50 radar convention).
- Snapshot history = `snapshot_submissions` scored archive (append-only); the legacy `HistoryPoint` table remains as fallback for mock/degraded paths.

## Gates

- `npx tsc --noEmit` — clean.
- `npm run test:canonical` — 11/11.
- `npm test` — 682 pass / 0 fail / 4 skipped.
- `npm run test:ui` (vitest) — 223 pass / 22 files; includes `mock-fallback-guard.test.ts` (13/13) and `snapshot-records.test.ts` (18/18).
- `npm run lint` — 0 errors, 68 warnings (all pre-existing in scripts/older modules; touched files clean).
- Automated live E2E test suites (100% pass across 95 checks):
  - `e2e-owner-privacy.mjs` (20/20): signed-out visitor, signed-in non-owner, signed-in owner, report API, serialized payload inspection, visibility toggle next-request cache invalidation, alternate casing, and clean DB teardown.
  - `e2e-cross-page.mjs` (30/30): leaderboard -> inspector -> profile link, opening split stat agreement, profile -> compare flow, compare selector swap + reload persistence, hall page links, profile tabs (submissions, analysis OCM/Tier, badges), and pending/unranked operator honest rendering (`/user/sex`).
  - `e2e-toolbar.mjs` (17/17): toolbar layout at 1229x739 & 1440x900, scroll persistence with clearance, Platform in Raw only, search input usable width (130px), filtered CSV export matching view, PNG screenshot capturing clean board without Share menu obscuring.
  - `e2e-webkit-safari.mjs` (28/28): WebKit verification across 9 routes (`/`, `/sigrank`, `/fieldhub`, `/articles`, `/blog`, `/wiki`, `/hall`, `/compare`, `/user/xoxo`), sidebar uniformity, Back/Home controls, independent editorial navigation details branches, compare stage fit, profile surfaces, and screenshots.

## Reviewer rejection fixes (round 2)

All items from the review of `33b66c9`/`a5c60f9`/`b4793c7` addressed:

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| 1 | **Critical** — `INSIDE HCM` for outlier operators (`share ≤ 0.8` only) | Membership now computed by `isOutlier` — the shared classifier implementing the full documented rule (share ≤ 0.80 AND (share ≥ 0.01 OR deep-reuse fallback) + verified-operator whitelist). Verified live: `/user/xoxo` now reads `SHARE 0.0% · VEL 58.2 · OUTSIDE OCM · OUTLIER · UNRESOLVED` — consistent with the resolver. Module renamed to canonical **OCM** (Operator Center of Mass, per `a3d1f61`): title, subtitle, band labels, footer. The 0.01 floor is drawn as a second dashed bound; footer notes the deep-reuse carve-out. `OUTSIDE OCM` distinguishes `OUTLIER` (below floor) vs `INPUT-DOMINANT` (above ceiling). | `components/profile-v2/AnalysisView.tsx` |
| 2 | `hybrid` mislabeled "AGENTIC" | `ModeChip` renders the three-valued mode distinctly (`HITL`/`AGENTIC`/`HYBRID`), `—` for null, version suffix, and — for agentic rows — an evidence ↗ link (http/https-only) plus assessed timestamp in the title. | `components/profile-v2/SubmissionsView.tsx` |
| 3 | `TOP CLASS REACHED` on pending profiles | Subtitle is now `CLASS STANDING UNAVAILABLE` when `tierProgress == null` (pending/unranked) and for unmapped classes; `TOP CLASS REACHED` only when the operator genuinely sits at ladder index 0. Current rung text degrades to `CURRENT CLASS` when no progress data exists. Verified `/user/sex`. | `components/profile-v2/BadgesView.tsx` |
| 4 | Mixed median/mean "AVERAGE USER" column | `FieldAverages` gained `inputTokens`/`outputTokens`/`cacheReadTokens`/`cacheCreateTokens`/`totalTokens` means over the same ranked cohort (zeros count); `FlapBoard` now reads every average cell from `computeFieldAverages` — one statistic, one source of truth. Local `medianOf` (which silently dropped zeros) and the `boardRows` prop removed. | `lib/analytics/field-average.ts`, `components/profile-v2/FlapBoard.tsx`, `OverviewView.tsx` |
| 5 | Unused `hasHistory` lint warning | Removed the declaration. | `SubmissionsView.tsx` |
| 6 | Provenance fields fetched but dropped | `SnapshotRecord` now carries `workflowEvidenceUrl` + `modeAssessedAt` (agentic-only, mirroring the API's gating); surfaced via `ModeChip` link + title. | `lib/board/queries.ts`, `SubmissionsView.tsx` |
| 7 | No tests for the new data-layer read | New `__tests__/board/snapshot-records.test.ts` (8 tests): visibility-guard parity (unclaimed/retired/private → no query issued), operator+status constraint, complete-row mapping/derivation, null-pillars → null derived metrics, null window stays null, agentic evidence carried, hybrid resolved distinctly, non-https evidence rejected. | `__tests__/board/snapshot-records.test.ts` |

Suggestions applied: `window` null-preserving (was `?? "all_time"`) — renders `—`; footers read `SHOWING n OF m` instead of the false `PAGE 1/1`; OCM terminology applied; public-API visibility guards (`claimed`/`status`/`profile_visibility`) now gate the records read identically to the snapshot-history route.

Compare-lane reconciliation: `baseline-labels.test.mjs` FIX 8 and `the-field-board-exclusion.test.mjs` asserted the pre-rework contract ("The Field" pseudo-operator as compare baseline). The live-operators-only rework (`liveCompareCandidates` excludes `the-field`) made both stale — the exclusion test was previously passing only on stale comment text. Both retargeted to pin the actual contract: compare carries no unlabeled baseline, and `liveCompareCandidates` excludes `the-field`. Stale "the-field" comments in `app/compare/page.tsx` corrected. The Field remains on the board per the documented CLAIM 9 owner decision.

## Screenshots

`/tmp/profile-submissions.png` (expanded records), `/tmp/profile-badges2.png` (badges tab), `/tmp/profile-analysis.png` + `/tmp/wk-analysis.png` (Tier+HCM, Chromium/WebKit), `/tmp/wk-overview.png` (opensplit, WebKit), `/tmp/board-top.png` / `/tmp/board-raw.png` / `/tmp/board-820.png` / `/tmp/board-share.png` (toolbar states), `/tmp/j5-hall.png`.

## Reviewer rejection fixes (round 3)

All items from the review of `53f3d38` addressed:

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| 1 | **Critical** — hard-coded `watchCount = 0` rendered as `WATCHED BY 0` | New `getOperatorWatchCount(codename)` in `queries.ts` — service-side HEAD count on `operator_watches` (anon has no SELECT on the table; only the count is exposed, never watcher identity — same contract as `/api/v1/operators/{codename}/watch`). Wrapped in `unstable_cache` (150s, `operator` tag), re-exported via the barrel, fetched in the `ProfileBody` `Promise.all`, and wired into both `OverviewView` (`WATCHED BY n`) and `StatsView` (Watchers row). Placeholder removed. | `lib/board/queries.ts`, `cached.ts`, `index.ts`, `ProfileBody.tsx` |
| 2 | **Critical** — means labeled "median" in VsField + DeltaBreakdown | Relabeled to FIELD AVG end-to-end: `vs field avg` toggle label, `{fmt} AVG` bar values, `REF = FIELD AVG · N=` legend, `avg != null` guard (was stale `med`), `Above / below field average` subtitle, `ABOVE AVG`/`METRICS ABOVE FIELD AVG` footer. One baseline source — `computeFieldAverages` — across Overview, VsField, and DeltaBreakdown. The OCM scatter's `DASHED = FIELD MEDIAN` crosshair stays: it is a genuine `median()` of the plotted dots. | `components/profile-v2/AnalysisView.tsx` |
| 3 | **Critical** — cross-tab badge contradiction (Social always locked the 500TH badge) | `SocialView`/`BadgesModule` accept `scoredSnapshots` (the real `snapshotRecords.length`); the milestone renders `Locked · n/500` under the threshold and earned at ≥500 — the same derivation `BadgesView` uses. Verified live: `/user/xoxo?tab=social` shows `500TH Snapshot Locked · 12/500`. | `components/profile-v2/SocialView.tsx`, `ProfileBody.tsx` |
| 4 | Private report serialized into the RSC flight payload | `ProfileBody` now passes `report={null}` to the gate unless `report_visible` — a private report never leaves the server. New route `GET /api/v1/operators/{codename}/report` serves the report when `report_visible` is on, else requires the linked-owner session (`getSessionOperator` — the same check `/api/profile/report-visibility` uses); 404 otherwise, `force-dynamic`, rate-limited. `ReportTabGate` fetches it client-side only after auth resolves as owner; non-owners get a "private — visible to the operator only" notice; owners who genuinely lack a report get the existing empty state. | `app/api/v1/operators/[codename]/report/route.ts`, `components/profile/ProfileAuthGates.tsx`, `ProfileBody.tsx` |
| 5 | Asymmetric visibility guards on the same page | `getOperatorSubmissions` now enforces the identical contract as `getOperatorSnapshotRecords` and the public API: `claimed`, non-`retired`, non-`private` — checked before the `metric_snapshots` read is issued. | `lib/board/queries.ts` |
| 6 | Tabs failing the APG keyboard contract | Roving `tabIndex` (active tab `0`, others `-1`), `ArrowLeft`/`ArrowRight`/`Home`/`End` with automatic activation + focus move, `aria-controls="pv2-tabpanel"` on every tab, `id="pv2-tab-{key}"` + `aria-labelledby` linkage on the panel. Locked affordances stay `disabled` and are skipped by arrow order. Verified live: focus+selection follow End/Home/arrows; `?tab=` persists. | `components/profile-v2/ProfileTabsV2.tsx` |
| 7 | OCM dot vs. label could disagree (differently-aged sources) | The operator point is always built from the profile `telemetry`/`cascade` props — the same source the `isOutlier` membership test reads — never the board row's 3600s-memo telemetry. Only the resolved `mode` chip comes from the board row. Dot and IN/OUT label can no longer diverge. | `components/profile-v2/AnalysisView.tsx` |
| 8 | Ordering parity gap vs the API | `getOperatorSnapshotRecords` now orders `submitted_at DESC, submission_id DESC` — identical to the snapshot-history route; tied timestamps resolve deterministically. | `lib/board/queries.ts` |

Suggestions applied:

- Stale comments corrected — `ProfileBody` header ("Eight tab panels", "7 parallel fetches"), `page.tsx` header (rewritten for the 8-tab workspace), "9 DB queries on a cold miss".
- `components/profile-v2/IdentityHero.tsx` (281 lines, zero imports) deleted.
- `computeTrophyCounts` accepts a `hallRecords` param; `ProfileBody` passes its already-fetched list — no second `getHallOfSignal` read.
- Tests: `snapshot-records.test.ts` extended to 13 — `getOperatorSubmissions` guard parity + operator constraint + mapping, `getOperatorWatchCount` HEAD-count contract + unknown-operator path.

Deferred / noted (not fixed, with reason):

- `ilike("codename", …)` `_` wildcard — repo-wide pre-existing pattern across every codename lookup; `.limit(1)` masks multi-match. A `.eq` + lowercased-column migration or `ilike`-escaping pass is a cross-repo data-layer change, out of this lane's scope. Flagged for the owner.
- Board UX nits (search input collapse, `wftag` Raw-only) — compare/board surface belongs to another lane's design; noted on the bus rather than patched here.

## Reviewer rejection fixes (round 4)

All items from the review of `7a95d3f`/`4157d68` addressed:

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| 1 | **Critical** — fabricated `MOCK_HISTORY` rendered on a real operator's profile | `getOperatorHistory` served `MOCK_HISTORY[codename]` on three live paths: unknown operator, zero `metric_snapshots`, and any thrown error — and `MOCK_HISTORY` is keyed by `TransVaultOrigin`, a real claimed operator. Verified live it rendered the fixture series (Apr 21 → May 19, canonical MO§ES values) under "5 SUBMISSIONS" while the API correctly returned `{"entries":[]}`. Now: mock fallback survives only on the unconfigured `!sb` path; a live read that finds nothing or fails returns `[]` (errors logged via `console.warn`, never silently converted to fixtures). Verified live: `/user/TransVaultOrigin?tab=submissions` shows the honest `0 SNAPSHOTS` empty state. | `lib/board/queries.ts` |
| 2 | **Critical** — privacy guard self-contradicting the Submissions tab | `getOperatorSubmissions` was guarded but `getOperatorHistory` read the same `metric_snapshots` table unguarded — `/user/orcavanguard` (unclaimed) showed "No submissions yet" directly above a populated history. `getOperatorHistory` now applies the identical `claimed`/non-`retired`/non-`private` contract before issuing the snapshot read, so every surface on the tab agrees. Verified live: consistent empty state. | `lib/board/queries.ts` |
| 3 | **Critical** — report-visibility flip never invalidated caches | `POST /api/profile/report-visibility` now calls `revalidateTag("operator", "max")` + `revalidatePath` for the operator's `/user/<codename>` page (original + lowercased, the `materialize.ts` convention) after the update — a flip to private stops serving the serialized report at the next request instead of up to 150s (unstable_cache) / 6h (ISR) later. | `app/api/profile/report-visibility/route.ts` |
| 4 | Pending operators showed an EARNED class badge | `BadgesView` and `SocialView`'s `BadgesModule` gate the class badge on `pending` — renders locked (`—` · "PENDING FIRST SCORED SNAPSHOT" / "Pending") instead of earned, consistent with the ladder's `CLASS STANDING UNAVAILABLE`. Verified `/user/sex?tab=badges`. | `components/profile-v2/BadgesView.tsx`, `SocialView.tsx`, `ProfileBody.tsx` |
| 5 | Report route missing codename validation | `GET /api/v1/operators/{codename}/report` now applies the snapshot-history shape gate (`^[a-zA-Z0-9_-]{1,100}$`) before the `ilike` — `%` wildcards return 400 instead of resolving an arbitrary operator. Verified live: `%25` → 400, private → 404. | `app/api/v1/operators/[codename]/report/route.ts` |
| 6 | `getOperatorHistory` swallowed all errors into mock/empty | Error path now `console.warn`s and returns `[]` — failure is distinguishable from "no data" and never fabricates. (The corpus-level `MOCK_*` fallbacks in `getHallOfSignal`/`getHomepageStats`/`getClassDistribution`/`getOperator` remain the codebase's documented degraded-mode choice — they render unattributed fixture content, not fabricated data under a real operator's identity. Noted for the owner.) | `lib/board/queries.ts` |
| 7 | Minor | `report-visibility`: meaningless `.order().limit(1)` on PATCH removed + comment corrected. `getOperatorWatchCount`: the count read moved to `getSupabaseService()` — `operator_watches` grants no SELECT to anon, so the "service client" contract is now real instead of a silent-0 fallback. `snapshot-history`: `PAGE_SIZE+1` over-fetch documented. | `report-visibility/route.ts`, `queries.ts`, `snapshot-history/route.ts` |

Tests: `snapshot-records.test.ts` extended to 18 — history guard parity, the TransVaultOrigin mock-leak regression, unknown-operator path, error→`[]`+log path, and happy-path mapping.

## Round 5 — Live Mock Fallbacks, E2E Privacy, Cross-Page Wiring, Toolbar & Safari Pass

All items from the round-5 directive implemented and verified:

| # | Task | Implementation & Verification | Files |
|---|------|--------------------------------|-------|
| 1 | **Remove live mock fallbacks** | Audited `getHallOfSignal`, `getHomepageStats`, `getClassDistribution`, `getOperator`, `getLeaderboard`, and `getOnline*`. Every fallback to `MOCK_*` and `fallbackRows()` is now strictly guarded by `if (!sb)`. When Supabase is configured: unknown operators return `null` (genuine 404 on profile route), live DB errors produce unavailable/empty states (`[]` or `UNAVAILABLE_HOMEPAGE_STATS` with `isPlaceholder: true`), and empty queries return `[]`/zeroes — never fixture operators, invented records, or sample totals. Verified live: `/user/does-not-exist-xyz123` returns 404; `/api/v1/stats` returns live DB totals with `is_placeholder: false`; `/api/v1/hall-of-signal` emits no fake single-op records; `/hall` displays real operators. Regression tests in `__tests__/board/mock-fallback-guard.test.ts` (13/13 pass). | `lib/board/queries.ts`, `__tests__/board/mock-fallback-guard.test.ts` |
| 2 | **Owner privacy & cache invalidation E2E** | Live test suite `scripts/e2e-owner-privacy.mjs` (20/20 pass) executed against running server (`http://localhost:3230`) using authenticated test accounts created in Supabase: (a) Signed-out visitor gets 404 on `/api/v1/operators/{codename}/report`, profile HTML/payload does not serialize private report; (b) Signed-in non-owner gets 404 and no private report in HTML; (c) Signed-in owner gets 200 with report JSON, both in canonical and UPPERCASE casing; (d) Toggle to public (`POST /api/profile/report-visibility` with `{ visible: true }`) immediately returns 200 to signed-out visitor on next request (both casings) and serializes report in page payload; (e) Toggle to private immediately returns 404 to visitor on next request and removes report from serialized payload; (f) Browser UI via Playwright confirms visitor sees "This report is private" notice while owner resolves access and renders full Report interface with visibility controls and Health Score. Clean teardown removed all test records and auth users. | `app/api/profile/report-visibility/route.ts`, `app/api/v1/operators/[codename]/report/route.ts`, `scripts/e2e-owner-privacy.mjs` |
| 3 | **Cross-page data wiring** | Live test suite `scripts/e2e-cross-page.mjs` (30/30 pass) verified all user journeys using real ranked operator `xoxo` (Karthikeyan KK, #3, IGNITER I, 976.9K Υ, 18.2K IN, 1.06M OUT, 305.2M CR, 15.8M CW, 322.1M total): (a) Board row -> inspector -> `SEE PROFILE` -> `/user/xoxo`; (b) Profile opening split metrics match leaderboard row exactly; (c) Profile `COMPARE` button targets `/compare?a=xoxo`; (d) Compare selector swap (`?a=xoxo&b=furic`) updates and reloads with persistence; (e) Compare matchup, dual radars, ledger, and history sync; (f) Hall links -> profile; (g) Profile tabs: Submissions (12 scored snapshots, missing values rendered as `—`), Analysis (Tier Position scatter, OCM Position scatter with `OUTSIDE OCM · OUTLIER`, `FIELD AVG` baseline labels), Badges (IGNITER I, 500th milestone progress `12/500`, class ladder); (h) Pending operator `/user/sex` rendered honestly: pending status, no fake #1 rank, `CLASS STANDING UNAVAILABLE`, locked class badge, `0 SNAPSHOTS`. | `scripts/e2e-cross-page.mjs` |
| 4 | **Leaderboard toolbar request** | Live test suite `scripts/e2e-toolbar.mjs` (17/17 pass) verified layout and export behavior: (a) Replaced rigid 9-column grid with adaptive flex toolbar (`display: flex; justify-content: space-between; gap: 6px`) in `board-cols.css`; (b) At 1229×739 and 1440×900, all controls sit evenly across one fixed line with no clipping or overlap; (c) Search input has usable width (130px, never collapsed to 25px); (d) Toolbar remains fixed with >60px clearance above first row while rows scroll in `.stage`; (e) Platform select filter is rendered in Raw mode only (`colMode === "raw"`) and hidden in Metrics mode; switching to Metrics resets platform filter to "All Platforms"; (f) Filtered CSV export matches current view (verified with `xoxo` search filter); (g) PNG screenshot capture via `html-to-image` closes Share details menu and filters out `.board-share-menu` popup so the menu never obscures the board; CSP `connect-src` violation prevented by filtering external avatars. | `components/live/LiveBoardWorkspace.tsx`, `components/live/board-cols.css`, `scripts/e2e-toolbar.mjs` |
| 5 | **Safari / WebKit rendering pass** | Live test suite `scripts/e2e-webkit-safari.mjs` (28/28 pass) evaluated Playwright WebKit at 1440×900 across 9 routes (`/`, `/sigrank`, `/fieldhub`, `/articles`, `/blog`, `/wiki`, `/hall`, `/compare`, `/user/xoxo`): (a) Uniform sidebar widths (56px icon rail, 248px left sidebar), borders and spacing; (b) Centered text-page heroes with pixel headings; (c) Independent editorial navigation branches verified on `/wiki` (both SigRank and Field branches stay open together); (d) Back & Home controls present and accessible below sidebar navigation across all pages; (e) Compare fits desktop stage without clipping; (f) Profile opening split (Passport Card + FlapBoard), history table, OCM scatter, and Badges all render cleanly; (g) Captured screenshots at `/tmp/webkit-leaderboard-toolbar.png`, `/tmp/webkit-profile-opening.png`, `/tmp/webkit-compare.png`, `/tmp/webkit-editorial-wiki.png`. | `scripts/e2e-webkit-safari.mjs` |

## Screenshots

- Native macOS Safari 27.0.1 (1440×900):
  - Leaderboard toolbar: `release-staging/evidence/actual-safari-leaderboard-toolbar.png`
  - Profile opening: `release-staging/evidence/actual-safari-profile-opening.png`
  - Compare matchup: `release-staging/evidence/actual-safari-compare.png`
  - Editorial Wiki: `release-staging/evidence/actual-safari-editorial-wiki.png`
- Automated Playwright WebKit (1440×900):
  - Leaderboard toolbar: `release-staging/evidence/webkit-leaderboard-toolbar.png`
  - Profile opening: `release-staging/evidence/webkit-profile-opening.png`
  - Compare matchup: `release-staging/evidence/webkit-compare.png`
  - Editorial Wiki: `release-staging/evidence/webkit-editorial-wiki.png`
- Historical captures in `/tmp`: `/tmp/profile-submissions.png` (expanded records), `/tmp/profile-badges2.png` (badges tab), `/tmp/profile-analysis.png` + `/tmp/wk-analysis.png` (Tier+HCM, Chromium/WebKit), `/tmp/wk-overview.png` (opensplit, WebKit), `/tmp/board-top.png` / `/tmp/board-raw.png` / `/tmp/board-820.png` / `/tmp/board-share.png` (toolbar states), `/tmp/j5-hall.png`.

## Round 6 — Workflow Reconciliation, Compare Action Wiring, Platform Filter & Native Safari Evidence

### Item 1: Workflow Classification and Launch Gate Reconciliation
- **Item:** Workflow classification and remaining launch gate reconciliation
- **Status:** IMPLEMENTED & VERIFIED
- **Finding and answer:** The old Operator / Outlier / All categories evolved into HITL (Operator-in-the-loop / OCM), Autonomous (Outlier / Review candidates), and Hybrid (Combined Field). The remaining launch gate previously recorded ("no stored hybrid/agentic submissions exist") was narrower than stated: Hybrid is the entire combined field (22 live claimed operators), not an empty cohort waiting for a tag, and Autonomous includes unclassified review candidates (9 live operators outside OCM).
- **Mapping table:**
  | Old Category | Current Label (Board / Hall) | Actual Inclusion Rule | Live Row Count (All-Time) | Evidence Status |
  |---|---|---|---|---|
  | **Operator** | `HITL` / `OPERATOR-IN-THE-LOOP` | **In OCM:** `inputShare ≤ 0.80` AND (`inputShare ≥ 0.01` OR deep-reuse fallback: `velocity ≤ 2`, `yield ≤ 1000`, `output ≥ 1M`, `cacheWrite ≥ 1M`) OR whitelisted (`OPERATOR_WHITELIST`). Resolved via `resolveWorkflowMode(...) === "hitl"`. | **13 rows** | Heuristically stamped `hcm-v1` (Operator Center of Mass rule); verified human-in-the-loop composition. |
  | **Outlier** | `Autonomous` / `AUTOMATED` | **Outside OCM / Unresolved review candidates:** `inputShare > 0.80` (input-dominant) OR `inputShare < 0.01` failing deep-reuse fallback (`resolveWorkflowMode === null`), PLUS any assessed `agentic` rows with verified public HTTPS evidence. Filter: `wf === "agentic" \|\| wf === "hybrid" \|\| wf === null`. | **9 rows** | Legacy outlier candidates pending automation verification / review; `null` mode indicates unclassified review candidate, not proven autonomous operation. Verified `agentic` requires HTTPS attestation. |
  | **All** | `Hybrid` / `HYBRID · COMBINED FIELD` | **Combined Field:** Complete live field combining both OCM (HITL) and Outlier (Autonomous / review candidates) rows. No workflow exclusion filter applied (`wfSel === "hybrid"` includes all qualifying claimed operators). | **22 rows** | Combined field view encompassing all live telemetry records regardless of workflow classification. |
- **Code changed:** YES
- **Files and function/component:** `lib/board/queries.ts` (`getLeaderboard`, ensuring `workflow_mode` and `workflow_mode_version` are resolved and populated for all rows).
- **Commit:** `a87391a`
- **Where to see it:** `http://localhost:3230/board/all` (toggle HITL: 13 rows, Autonomous: 9 rows, Hybrid: 22 rows); `http://localhost:3230/hall` (WORKFLOW: OPERATOR-IN-THE-LOOP, HYBRID, AUTOMATED); `http://localhost:3230/user/xoxo?tab=analysis` (OCM Position scatter: `OUTSIDE OCM · OUTLIER · UNRESOLVED`).
- **Verification performed and result:** Live Playwright query against staging preview confirms exact row counts: Hybrid = 22, HITL = 13, Autonomous = 9 (13 + 9 = 22). Full unit test suite (223 tests) and canonical test suite (11/11) pass.
- **Evidence path:** `scripts/e2e-cross-page.mjs`, `release-staging/evidence/actual-safari-leaderboard-toolbar.png`, `release-staging/evidence/webkit-leaderboard-toolbar.png`.
- **Remaining work or missing decision:** Third-party cryptographic / HTTPS evidence links remain code-verified until live operators submit external attestation URLs via MCP.

### Item 2: Compare Sharing and Action Wiring Audit & Repair
- **Item:** Compare sharing, preview, download, and challenge action wiring
- **Status:** IMPLEMENTED & VERIFIED
- **Finding and answer:** Inventory revealed two distinct artifacts in the Compare Share module: (1) `CompareShareCard` (1200×630 landscape card with gold identity and terminal readouts, downloading `sigrank-compare-<slugA>-vs-<slugB>.png`) and (2) `CompareMatchupCard` (1200×900 vertical matchup + dual radars social card, downloading `sigrank-matchup-<slugA>-vs-<slugB>.png`). Both provide Share matchup, Preview, and Download actions for their respective artifacts. Repaired: (a) Download filenames dynamically reflect selected operators' codenames/slugs; (b) Operand colors aligned with canonical `COMPARE_OPERAND_COLORS` (`#60a5fa` blue for A, `#2dd4bf` teal for B); (c) Dynamic `window.location.origin` in `shareLink` with fallback to prompt if clipboard write is blocked; (d) `ChallengeOnX` strips leading `@` to prevent `@@handle` and reads `links?.x || handle`. `Throw-Downs` remains explicitly "Coming soon".
- **Code changed:** YES
- **Files and function/component:** `components/share/CompareShareCard.tsx` (`CompareShareCard`), `components/share/CompareMatchupCard.tsx` (`CompareMatchupCard`), `components/compare/ChallengeOnX.tsx` (`ChallengeOnX`), `app/compare/page.tsx` (`ThrowDownLine`).
- **Commit:** `a87391a`
- **Where to see it:** `http://localhost:3230/compare?a=xoxo&b=furic` (right rail: Throw-Downs / Coming soon / Challenge on X, Share matchup / Preview / Download card, and Preview / Download matchup card).
- **Verification performed and result:** Click Preview opens matching modal scaled to viewport; download generates valid PNG with matching names and operand colors; Challenge on X generates correct twitter intent with proper handle and public comparison URL.
- **Evidence path:** `release-staging/evidence/webkit-compare.png`, `release-staging/evidence/actual-safari-compare.png`, `scripts/e2e-cross-page.mjs`.
- **Remaining work or missing decision:** Consolidating the two share cards into one unified Share menu is deferred for the owner's future layout redesign.

### Item 3: Platform Column vs Platform Filter Reconciliation
- **Item:** Platform table column vs toolbar Platform filter dropdown
- **Status:** IMPLEMENTED & VERIFIED
- **Finding and answer:** Reconciled owner intent: the owner requested the Platform COLUMN in the table for Raw metrics (`colMode === "raw"`). Hiding the Platform dropdown filter in Metrics mode was a misunderstanding that prevented filtering the board by platform in Metrics view. Corrected: Platform select filter (`All Platforms`, `Claude`, `Codex`, `Multi`, `Pi`) is now accessible in BOTH Metrics and Raw modes on the toolbar. The Platform COLUMN in the table remains displayed in Raw mode only (`{colMode === "raw" && <td>...</td>}`).
- **Code changed:** YES
- **Files and function/component:** `components/live/LiveBoardWorkspace.tsx` (restored Platform select unconditionally in `.fbar`), `components/live/board-cols.css` (compact flex alignment keeping all controls accessible).
- **Commit:** `a87391a`
- **Where to see it:** `http://localhost:3230/board/all` (Platform dropdown visible in Metrics mode; click "Raw" to reveal the ⬡PLATFORM table column).
- **Verification performed and result:** Automated checks in `scripts/e2e-toolbar.mjs` verify Platform dropdown is present and functional in both Metrics and Raw modes, while table `<th>`/`<td>` Platform column appears in Raw mode only.
- **Evidence path:** `scripts/e2e-toolbar.mjs`, `release-staging/evidence/webkit-leaderboard-toolbar.png`, `release-staging/evidence/actual-safari-leaderboard-toolbar.png`.
- **Remaining work or missing decision:** None.

### Item 4: Safari and WebKit Evidence Gap Closure
- **Item:** Native Safari and automated WebKit browser verification and artifact capture
- **Status:** IMPLEMENTED & VERIFIED
- **Finding and answer:** Closed evidence gap by running both automated Playwright WebKit checks and native macOS Safari (Safari 27.0.1) interactive capture at 1440×900 across all 9 routes. Uniform sidebars (56px icon rail, 248px left rail), Back/Home controls, independent navigation details expansion on `/wiki`, stage fit on `/compare`, and complete profile surface rendering confirmed in both engines. High-resolution screenshots saved directly into `release-staging/evidence/`.
- **Code changed:** NO (verification & artifact capture).
- **Files and function/component:** `scripts/e2e-webkit-safari.mjs`, `scripts/capture-actual-safari.mjs`.
- **Commit:** `a87391a`
- **Where to see it:** `release-staging/evidence/`
- **Verification performed and result:** 28/28 checks passed in WebKit; native Safari verified via AppleScript window sizing and screencapture.
- **Evidence path:**
  - `release-staging/evidence/actual-safari-leaderboard-toolbar.png` (Safari 27.0.1, 1440×900)
  - `release-staging/evidence/actual-safari-profile-opening.png` (Safari 27.0.1, 1440×900)
  - `release-staging/evidence/actual-safari-compare.png` (Safari 27.0.1, 1440×900)
  - `release-staging/evidence/actual-safari-editorial-wiki.png` (Safari 27.0.1, 1440×900)
  - `release-staging/evidence/webkit-leaderboard-toolbar.png` (WebKit, 1440×900)
  - `release-staging/evidence/webkit-profile-opening.png` (WebKit, 1440×900)
  - `release-staging/evidence/webkit-compare.png` (WebKit, 1440×900)
  - `release-staging/evidence/webkit-editorial-wiki.png` (WebKit, 1440×900)
- **Remaining work or missing decision:** Owner visual sign-off during final launch review.

## Remaining blockers

- Verified automation HTTPS attestation: no live operator has submitted a third-party evidence link for an assessed `agentic` or `hybrid` workflow mode; evidence ↗ links and `amv-2` tags remain code-verified via unit tests until real attested rows are ingested.
- Design exploration items noted in the owner checklist (consolidated Compare Share menu, chart layout alternatives, and sidebar card relocations) are reserved for owner review.
