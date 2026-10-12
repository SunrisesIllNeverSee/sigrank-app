# NEXT PUSH — WIRING & UI AUDIT

**Branch:** `integration/site-a315435`
**Preview:** `http://localhost:3230/` (use `localhost`, not `127.0.0.1` — dev chunks are blocked cross-origin on the IP host, so hydration silently fails there)
**Date:** 2026-10-12
**Commits:** `33b66c9` (board data) + `a5c60f9` (profile UI) + `b4793c7` (audit) + `68feff6` + `53f3d38` (round-2 corrections) + `7a95d3f` (round-3 corrections) + `56fed14` (round-3 audit) — pushed to `origin/integration/site-a315435`

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
- `npm run test:ui` (vitest) — 205 pass / 21 files; `snapshot-records.test.ts` 13/13 (guard parity on both snapshot reads, watch-count contract, mapping, null handling, mode resolution, evidence gating).
- `npm run lint` — 0 errors, 66 warnings (all pre-existing in scripts/older modules; touched files clean).
- Live re-verification (Chromium): real `WATCHED BY` count, FIELD AVG labels, roving tabindex + arrow/Home/End tab navigation + aria linkage, no private report in the RSC payload, `Locked · 12/500` social milestone, `OUTSIDE OCM · OUTLIER` footer. 0 page errors.

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

## Remaining blockers

- Owner-only surfaces (Report/Lab) verified as *locked for public*; the private-report owner-fetch path (`/api/v1/operators/{codename}/report` → gate render) is code-verified but not exercised with a real authenticated session in the local preview.
- No hybrid/agentic scored submissions exist in current data — the distinct `HYBRID` label and evidence ↗ link are code-verified (unit tests + type-level) but not yet exercised by live rows.
