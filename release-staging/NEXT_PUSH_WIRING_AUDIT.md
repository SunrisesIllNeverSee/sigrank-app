# NEXT PUSH — WIRING & UI AUDIT

**Branch:** `integration/site-a315435`
**Preview:** `http://localhost:3230/` (use `localhost`, not `127.0.0.1` — dev chunks are blocked cross-origin on the IP host, so hydration silently fails there)
**Date:** 2026-10-12
**Commits:** `33b66c9` (board data) + `a5c60f9` (profile UI) — pushed to `origin/integration/site-a315435`

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
- `npm test` — 681 pass / **1 pre-existing fail**: `baseline-labels.test.mjs` FIX 8 asserts `app/compare/page.tsx` documents a "live field median" baseline — the lane's compare rework (`196bb34`) removed "The Field" pseudo-operator entirely, so the test targets a superseded design. Flagged on the bus for the compare lane owner; not patched here to avoid fighting their in-flight design.

## Screenshots

`/tmp/profile-submissions.png` (expanded records), `/tmp/profile-badges2.png` (badges tab), `/tmp/profile-analysis.png` + `/tmp/wk-analysis.png` (Tier+HCM, Chromium/WebKit), `/tmp/wk-overview.png` (opensplit, WebKit), `/tmp/board-top.png` / `/tmp/board-raw.png` / `/tmp/board-820.png` / `/tmp/board-share.png` (toolbar states), `/tmp/j5-hall.png`.

## Remaining blockers

- Owner-only surfaces (Report/Lab) verified as *locked for public*; authenticated-owner rendering not exercised (no auth session in the local preview).
- `watchCount` in `ProfileBody` remains a documented placeholder (0) until the profile-level watch fetch lands.
- The stale `baseline-labels` test needs the compare lane owner to either reintroduce the median label or update the test.
