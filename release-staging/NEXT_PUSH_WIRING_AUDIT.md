# NEXT PUSH — WIRING & UI AUDIT

**Branch:** `integration/site-a315435`
**Preview:** `http://localhost:3230/` (use `localhost`, not `127.0.0.1` — dev chunks are blocked cross-origin on the IP host, so hydration silently fails there)
**Date:** 2026-10-12
**Commits:** `33b66c9` (board data) + `a5c60f9` (profile UI) + `68feff6` (reviewer corrections) — pushed to `origin/integration/site-a315435`

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
- `npm test` — 682 pass / 0 fail / 4 skipped (was 681/1 — the two stale compare-baseline tests retargeted to the live-operators-only contract, see fix log below).
- `bunx vitest run __tests__/board/snapshot-records.test.ts` — 8/8.
- `bun run lint` — 0 errors, 66 warnings (was 67 — `hasHistory` warning removed; remaining warnings are pre-existing in scripts/older modules).

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

## Remaining blockers

- Owner-only surfaces (Report/Lab) verified as *locked for public*; authenticated-owner rendering not exercised (no auth session in the local preview).
- `watchCount` in `ProfileBody` remains a documented placeholder (0) until the profile-level watch fetch lands.
- No hybrid/agentic scored submissions exist in current data — the distinct `HYBRID` label and evidence ↗ link are code-verified (unit tests + type-level) but not yet exercised by live rows.
