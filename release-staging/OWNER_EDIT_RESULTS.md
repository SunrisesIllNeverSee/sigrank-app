# Owner edit results — October 12, 2026

Scope: October 12 narrowed owner instruction — leaderboard Scale V + Wiki, linked operator dock default, PROFILE/WATCH actions, and owner-only My Watchlist. Profile Phase 3 work was independently reconciled at staging commit 260b849; Compare remains Devin-owned and future visual choices require owner approval. Production MUST remain untouched.

Feature implementation commit: `06cccafe0f0f6ba4782122397748fea8574f6af9` (isolated staging branch). Merge into integration/site-a315435 is verified separately below; refer to the final merge commit.

Verification receipts: 2026-10-12; production-style isolated Next.js webpack build PASS. Browser checks: /board/all and /wiki/metrics/scale-v HTTP 200, Scale V sort descending, CSV exact raw total + Scale V, owned profile watchlist and view privacy with controlled authenticated session, /api/v1/me/watches returns HTTP 401 signed out. TypeScript 0, ESLint 0, 11/11 canonical, 15/15 targeted and comparison UI tests. No live owner credentials or real watch writes were used.

## Leaderboard

### LB-01 — Scale V in leaderboard
Item: Scale V in leaderboard
Status: IMPLEMENTED & VERIFIED
Solution or answer: Sortable SCALE V metrics column; existing projected scalev and raw Total Tokens remain unchanged. CSV includes total_tokens (compact), total_tokens_exact (numeric), and scale_v.
Code changed: YES
Files and function/component: components/live/rows.tsx (BoardHead, BoardRow), components/live/utils.ts (SORT_KEY, CONTROLS), components/live/LiveBoardWorkspace.tsx (exportCsv, table colspans), components/live/board-cols.css
Commit: 06cccafe0f0f6ba4782122397748fea8574f6af9
Where to see it: http://localhost:3230/board/all — Metrics table SCALE V, header sort and ⓘ Wiki link; Share → Export CSV.
Verification and evidence: Production-style isolated staging build HTTP 200, 14 columns, 22 scale cells; header sorting descending [10.73, 10.72, 10.71]; CSV numeric raw total 53904803774, Scale V 10.73; TypeScript, ESLint, canonical 11, UI 15, Next webpack build PASS.
Remaining decision or dependency: None; no formula change.

### LB-02 — Scale V Wiki definition
Item: Scale V Wiki definition
Status: IMPLEMENTED & VERIFIED
Solution or answer: Wiki definition distinguishes recorded activity from reused cache context, unique content, quality, efficiency and retrieval success. Formula = log10(I+O+W+R) for positive total. Leaderboard tooltip and Wiki reference link.
Code changed: YES
Files and function/component: app/wiki/metrics/scale-v/page.tsx (ScaleVPage), app/wiki/page.tsx (CascadeList/Y.06), components/live/rows.tsx (BoardHead)
Commit: 06cccafe0f0f6ba4782122397748fea8574f6af9
Where to see it: http://localhost:3230/wiki/metrics/scale-v — direct page; from /board/all select the SCALE V ⓘ link.
Verification and evidence: Production-style staging build and browser verified HTTP 200; 'Scale V = log' text present; no claims for zero totals or unique content.
Remaining decision or dependency: Needle-in-a-haystack remains a separate exploration, not measured by Scale V.

### LB-03 — Needle in a haystack metric exploration
Item: Needle in a haystack metric exploration
Status: RECOMMENDATION ONLY
Solution or answer: Do not redefine Scale V. Before considering a signal-retrieval metric, specify the question, retrieval success labels, ground truth, and evaluation dataset.
Code changed: NO
Files and function/component: None; original owner checklist only.
Commit: None — not part of scoped implementation
Where to see it: Not applicable — no new metric exposed.
Verification and evidence: Not implemented and intentionally left unchecked.
If recommendation only: Do not redefine Scale V. Before considering a signal-retrieval metric, specify the question, retrieval success labels, ground truth, and evaluation dataset.
Remaining decision or dependency: Owner decides whether to pursue later.

### LB-04 — Signed-in dock defaults to linked operator
Item: Signed-in dock defaults to linked operator
Status: IMPLEMENTED, NOT VERIFIED
Solution or answer: A verified /api/auth/session linked codename selects the matching live field row, with ↶ MY PROFILE after deliberate row selection. No linked op → setup prompt; operator absent in window → no fabricated replacement identity; signed out retains featured field operator.
Code changed: YES
Files and function/component: components/live/LiveBoardWorkspace.tsx (session, ownIndex, handleSelect, restoreMyProfile, profile module)
Commit: 06cccafe0f0f6ba4782122397748fea8574f6af9
Where to see it: http://localhost:3230/board/all — sign in to a linked account; select another row; use ↶ MY PROFILE.
Verification and evidence: Controlled browser session passed: linked rank #2 default and successful return after selection; no page JS errors. Real signed-in owner session and missing-window case not independently authenticated in browser.
Remaining decision or dependency: Authenticated owner acceptance of their own actual operator still required.

### LB-05 — Earlier rich operator dock restoration (owner withdrew)
Item: Earlier rich operator dock restoration (owner withdrew)
Status: RECOMMENDATION ONLY
Solution or answer: No restoration performed by owner direction; existing OperatorDock, ColumnRanks, DualSignatureRadar, observation traces and record elements preserved.
Code changed: NO
Files and function/component: None for historical restoration.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/board/all — existing profile display unchanged apart from default selection/actions.
Verification and evidence: Existing assets located; this scope was explicitly removed by owner.
If recommendation only: No restoration performed by owner direction; existing OperatorDock, ColumnRanks, DualSignatureRadar, observation traces and record elements preserved.
Remaining decision or dependency: Do not initiate rich-dock redesign without new request.

### LB-06 — PROFILE and WATCH only
Item: PROFILE and WATCH only
Status: IMPLEMENTED, NOT VERIFIED
Solution or answer: Dock and peek primary action rows render PROFILE and WATCH, with COMPARE added in the dock only for an authenticated operator viewing someone other than their own linked account. PROFILE routes to selected /user/<codename>; WATCH uses the existing session-authorized toggle and shows WATCHING when active. COMPARE is seeded with both valid operator codenames when available.
Code changed: YES
Files and function/component: components/live/ProfileActions.tsx (ProfileActions), components/live/WatchButton.tsx (WatchButton watch-changed event, correct signed-in state)
Commit: 06cccafe0f0f6ba4782122397748fea8574f6af9
Where to see it: http://localhost:3230/board/all — select operator, inspect sidebar dock action row; click PROFILE or WATCH.
Verification and evidence: Browser DOM shows 'PROFILE☆ WATCH'; UI test 2-button count/href passed; existing watch GET/POST route preserved, server-side RLS reviewed, but actual owner-session POST was not executed.
Remaining decision or dependency: Verify actual authenticated watch/unwatch persistence on owner account.

## User Profile

### UP-01 — My Watchlist on signed-in profile (new owner item)
Item: My Watchlist on signed-in profile (new owner item)
Status: IMPLEMENTED, NOT VERIFIED
Solution or answer: New owner-only right-sidebar MY WATCHLIST shows operator names and PROFILE links, with per-row WATCHING/Unwatch; GET /api/v1/me/watches reads own watch rows through JWT+RLS and resolves only public operator profiles. Watch change refreshes list.
Code changed: YES
Files and function/component: components/profile-v2/MyWatchlist.tsx (MyWatchlist), components/profile-v2/ProfileWorkspace.tsx (right sidebar), components/profile-v2/profile-workspace.css, app/api/v1/me/watches/route.ts (GET), components/live/WatchButton.tsx
Commit: 06cccafe0f0f6ba4782122397748fea8574f6af9
Where to see it: http://localhost:3230/me — redirected to linked /user/<codename>, right sidebar MY WATCHLIST. Other operators' profiles must not show it.
Verification and evidence: Controlled signed-in browser QA PASS for owner sidebar and refresh with mocked API; other public profile hides panel; unauthenticated real GET returns 401; targeted tests cover privacy, links, event refresh; full authorized DB read/unwatch not performed with real owner's session.
Remaining decision or dependency: Final reconciliation with concurrent profile sidebar agent and real authenticated owner RLS round-trip required.

## Compare

### CP-01 — Throw-Downs/Challenge/Share/Preview/Download inventory
Item: Throw-Downs/Challenge/Share/Preview/Download inventory
Status: BLOCKED
Solution or answer: Owned independently by Devin; no changes by this workstream.
Code changed: NO
Files and function/component: Devin Compare workstream.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/compare — existing staged controls.
Verification and evidence: Not reviewed here to avoid duplicate ownership.
Remaining decision or dependency: Devin action-wiring evidence.

### CP-02 — Challenge on X selected operators / URL
Item: Challenge on X selected operators / URL
Status: BLOCKED
Solution or answer: Devin owns selected-pair challenge URL integrity. No post authored.
Code changed: NO
Files and function/component: Devin Compare workstream.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/compare
Verification and evidence: Not tested here.
Remaining decision or dependency: Devin confirmation.

### CP-03 — Matchup Share, Preview and downloads
Item: Matchup Share, Preview and downloads
Status: BLOCKED
Solution or answer: Devin owns selection correctness and artifact outputs.
Code changed: NO
Files and function/component: Devin Compare workstream.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/compare
Verification and evidence: Not tested here.
Remaining decision or dependency: Devin artifact verification.

### CP-04 — Consolidated Share menu
Item: Consolidated Share menu
Status: RECOMMENDATION ONLY
Solution or answer: Explore one Share menu after Devin's artifact/action inventory, labeling distinct downloadable assets.
Code changed: NO
Files and function/component: None; future Compare UX proposal.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/compare
Verification and evidence: No design implemented.
If recommendation only: Explore one Share menu after Devin's artifact/action inventory, labeling distinct downloadable assets.
Remaining decision or dependency: Owner design decision.

### CP-05 — Yield chart placement and sparklines
Item: Yield chart placement and sparklines
Status: RECOMMENDATION ONLY
Solution or answer: Review moving yield chart higher and provide switchable historic/comparison views with explicit scale labels; no logarithmic radar or paired sparklines assumed approved.
Code changed: NO
Files and function/component: None; future Compare chart design proposal.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/compare
Verification and evidence: No chart changed.
If recommendation only: Review moving yield chart higher and provide switchable historic/comparison views with explicit scale labels; no logarithmic radar or paired sparklines assumed approved.
Remaining decision or dependency: Owner design choice; Devin action stream independent.

## User Profile

### UP-02 — Move submission activity to right sidebar
Item: Move submission activity to right sidebar
Status: IMPLEMENTED, NOT VERIFIED
Solution or answer: Submission Activity moved into ProfileRailPanels at the fixed right rail; the 154-cell heatmap renders and does not spill into the main stage. CAUTION: source fills unobserved dates with deterministic simulated colors when history exists. This presentation should not be accepted as literal daily submission history until source/evidence semantics are corrected or transparently labeled.
Code changed: YES
Files and function/component: components/profile-v2/ProfileRailPanels.tsx (ProfileRailPanels), components/profile-v2/OverviewView.tsx, app/user/[codename]/page.tsx
Commit: 260b849a93dd225b6bb8d067296ce9a92a7e9bba (separate Phase 3 agent)
Where to see it: http://localhost:3230/user/xoxo; http://localhost:3230/user/zachlagden; http://localhost:3230/user/sex
Verification and evidence: Real merged WebKit check: activity in rail, 154 cells; 29/29 Phase 3 test run overall. Data-integrity concern: simulation in gaps requires separate owner/developer review.
Remaining decision or dependency: Replace simulated days with evidenced observations or mark inferred cells prominently; protect privacy and baseline comparability.

### UP-03 — Move Records & Honors into right sidebar
Item: Move Records & Honors into right sidebar
Status: ALREADY CORRECT
Solution or answer: Records & Honors moved to the right rail, with medal totals, record rows, and full detail dialogs; does not leak into main stage.
Code changed: YES
Files and function/component: components/profile-v2/ProfileRailPanels.tsx, components/profile-v2/RecordDetailList.tsx
Commit: 260b849a93dd225b6bb8d067296ce9a92a7e9bba (separate Phase 3 agent)
Where to see it: http://localhost:3230/user/xoxo; http://localhost:3230/user/zachlagden; http://localhost:3230/user/sex
Verification and evidence: Merged WebKit 29/29: records in rail; earned/pending rows; opening modal; evidence and Escape all passed.
Remaining decision or dependency: Owner visual approval of rail stacking alongside My Watchlist.

### UP-04 — Improve trophies/records graphics
Item: Improve trophies/records graphics
Status: ALREADY CORRECT
Solution or answer: Earned, pending, unavailable graphics differentiated. Medal circles carry rank and accessible record labels; larger artist-designed badge set remains another agent’s uncommitted work, not part of this merge.
Code changed: YES
Files and function/component: components/profile-v2/RecordDetailList.tsx, components/profile-v2/ProfileRailPanels.tsx
Commit: 260b849a93dd225b6bb8d067296ce9a92a7e9bba (separate Phase 3 agent)
Where to see it: http://localhost:3230/user/xoxo; http://localhost:3230/user/zachlagden; http://localhost:3230/user/sex
Verification and evidence: Merged WebKit: medal hierarchy, earned/pending states and pending profile zero medals confirmed.
Remaining decision or dependency: Final trophy graphics need owner design signoff; additional badge-art changes still in progress separately.

### UP-05 — Clickable record detail interactions
Item: Clickable record detail interactions
Status: ALREADY CORRECT
Solution or answer: Clickable native record detail dialogs show supported definition, value, cohort, period, date, progress/evidence when available; Escape closes.
Code changed: YES
Files and function/component: components/profile-v2/RecordDetailList.tsx (RecordDetailList)
Commit: 260b849a93dd225b6bb8d067296ce9a92a7e9bba (separate Phase 3 agent)
Where to see it: http://localhost:3230/user/xoxo; http://localhost:3230/user/zachlagden; http://localhost:3230/user/sex
Verification and evidence: Merged WebKit 29/29: earned and pending dialogs open; details and evidence link render; Escape closes.
Remaining decision or dependency: Owner design approval; source-evidence precision and return-focus behavior should be independently assessed if further changes are made.

### UP-06 — Restore holographic shine
Item: Restore holographic shine
Status: ALREADY CORRECT
Solution or answer: Holographic shine restored on staged passport card with WebKit-compatible animation and reduced-motion media support.
Code changed: YES
Files and function/component: components/profile-v2/PassportCard.tsx, components/profile-v2/profile-workspace.css
Commit: 260b849a93dd225b6bb8d067296ce9a92a7e9bba (separate Phase 3 agent)
Where to see it: http://localhost:3230/user/xoxo; http://localhost:3230/user/zachlagden; http://localhost:3230/user/sex
Verification and evidence: Merged WebKit: shine animation pv2-shine-sweep present; reduced-motion computed animationName=none.
Remaining decision or dependency: Owner Safari visual signoff pending.

### UP-07 — OITL and agentic/operator-agent symbols
Item: OITL and agentic/operator-agent symbols
Status: IMPLEMENTED, NOT VERIFIED
Solution or answer: Readable OITL / AUTO / HYBRID / REVIEW marks implemented. Unresolved review candidates are not silently classified as verified autonomous operators.
Code changed: YES
Files and function/component: components/profile-v2/WorkflowMark.tsx, components/profile-v2/ProfileRailPanels.tsx
Commit: 260b849a93dd225b6bb8d067296ce9a92a7e9bba (separate Phase 3 agent)
Where to see it: http://localhost:3230/user/xoxo; http://localhost:3230/user/zachlagden; http://localhost:3230/user/sex
Verification and evidence: Merged WebKit: OITL glyph and REVIEW/UNRESOLVED note render; cohort context labels visible.
Remaining decision or dependency: Owner nomenclature and Devin-confirmed membership rules require final approval.

### UP-08 — Hybrid combined and workflow ranks
Item: Hybrid combined and workflow ranks
Status: IMPLEMENTED, NOT VERIFIED
Solution or answer: Hybrid combined-field and workflow-context ranks displayed separately with explicit cohort counts and pending/unranked states.
Code changed: YES
Files and function/component: components/profile-v2/ProfileRailPanels.tsx, lib/analytics/workflow-cohort.ts, app/user/[codename]/page.tsx
Commit: 260b849a93dd225b6bb8d067296ce9a92a7e9bba (separate Phase 3 agent)
Where to see it: http://localhost:3230/user/xoxo; http://localhost:3230/user/zachlagden; http://localhost:3230/user/sex
Verification and evidence: Merged WebKit: FIELD #3 OF 22, AUTO #3 OF 9, OITL #2 OF 13, pending UNRANKED all pass; 29/29 Phase 3.
Remaining decision or dependency: Cohort inclusion follows staged board predicate; Devin must reconcile final classification semantics and evidence.

### UP-09 — Compact ticker stat boxes
Item: Compact ticker stat boxes
Status: ALREADY CORRECT
Solution or answer: Ticker and stat cards compacted by Phase 3 agent, avoiding clipping at narrower widths.
Code changed: YES
Files and function/component: components/profile-v2/profile-workspace.css, components/profile-v2/OverviewView.tsx
Commit: 260b849a93dd225b6bb8d067296ce9a92a7e9bba (separate Phase 3 agent)
Where to see it: http://localhost:3230/user/xoxo; http://localhost:3230/user/zachlagden; http://localhost:3230/user/sex
Verification and evidence: Merged WebKit: 820px viewport no horizontal overflow; record/ticker cells not clipped.
Remaining decision or dependency: Optional further density change only after owner review.

## Integration review — 2026-10-12

- Phase 3 Profile agent commit: `260b849`. Owner watchlist/leaderboard source commit: `06cccaf`; original results commit `a01c516`.
- Conflict resolved additively in `components/profile-v2/ProfileWorkspace.tsx`: preserved `{panels}` server-rendered Phase 3 right rail and appended `<MyWatchlist codename={codename} />` only for the authenticated operator's own profile.
- Merged checkout: TypeScript 0, scoped ESLint 0, 11/11 canonical, 22/22 targeted UI/Compare tests; integrated Phase 3 WebKit 29/29; owner My Watchlist WebKit controlled session PASS, public profile hides watchlist, unsigned-in watchlist GET HTTP 401, reduced-motion CSS computed animation none. These tests use controlled mock auth for privacy/UI; no real owner credentials or watch POST were used.
- Build caveat: production webpack build on this separate worktree failed on external `next/font/google` fetch/loader, unrelated to TypeScript diagnostics; dev webpack render and WebKit checks passed. No canonical font configuration changed.
- **Data-integrity review finding:** `ProfileRailPanels` fills missing activity days with seeded simulated colors when any history exists. The e2e checks verify layout, not that each colored day represents an observed submission. This must be resolved before labeling those cells verified observation evidence.
- **Independent concurrent work:** Local integration checkout currently has uncommitted badge/profile work beyond `260b849`. It is deliberately excluded from this merge and must be preserved. The live :3230 server can display those unfinished edits; for an exact merge revision use a dedicated worktree preview.
- Final staging merge commit/remote HEAD: see Git history of `integration/site-a315435` after successful merge. Production `main` unchanged.

## Leaderboard follow-up — owner visual adjustments, October 12

### LB-07 — Move contextual operator actions above radar
Item: Position PROFILE / WATCH / conditional COMPARE above the radar.
Status: IMPLEMENTED & VERIFIED
Solution or answer: PROFILE and WATCH always appear directly after the selected operator identity tile and immediately before the radar slide. COMPARE appears there only when a signed-in, linked operator has deliberately selected a different operator. Prefills /compare?a=<signed-in codename>&b=<selected codename> when both are present in the board. On own account and signed-out views the action group contains exactly two buttons. No change to WATCH permission checks.
Code changed: YES
Files and function/component: components/live/LiveBoardWorkspace.tsx (railBody(profile)), components/live/ProfileActions.tsx (ProfileActions), components/live/proto-scoped.css (peek-actions); __tests__/ui/owner-board-watchlist.test.tsx
Commit: see latest integration/site-a315435 HEAD after the staging-only merge.
Where to see it: http://localhost:3230/board/all — select a user from a signed-in session; operator dock right rail, action group immediately before radar.
Verification and evidence: WebKit controlled auth showed PROFILE + WATCH for signed-in own operator; after selecting another, PROFILE + WATCH + COMPARE in that order, with /compare?a=...&b=...; geometry tile.bottom=540, actions.top=549, actions.bottom=577, radar.top=589; no page JS errors. UI tests cover both states.
Remaining decision or dependency: Real owner sign-in acceptance remains separate; simulated session uses no private credentials.

### LB-08 — Center and responsively wrap leaderboard filters
Item: Fix toolbar centering and formatting without requiring Safari Cmd+0.
Status: IMPLEMENTED & VERIFIED
Solution or answer: Split the toolbar into a centered filtering row (workflow, window, platform, class, sort direction, search) and a centered views/pagination/export row. Remove the old one-line justify-space-between and auto-margin interaction. Controls wrap based on available stage width even when both sidebars remain pinned; readable 10px form text, consistent sizing.
Code changed: YES
Files and function/component: components/live/LiveBoardWorkspace.tsx (board-filter-controls), components/live/board-cols.css (responsive filtering rows), components/live/proto-scoped.css (action spacing).
Commit: see latest integration/site-a315435 HEAD after the staging-only merge.
Where to see it: http://localhost:3230/board/all — normal Safari view, check at standard and enlarged page zoom.
Verification and evidence: WebKit layout checks at 1440, 1280, 1152 (~125%-zoom equivalent), 1100 and 900 logical viewport pixels: both rows had exact centered bounding boxes (0px error), 0 filter/group/secondary-action overflow, and controls remained legible at 10px. Browser selection tested independently.
Remaining decision or dependency: Actual Safari page zoom state is a browser preference; the CSS no longer relies on manually resetting it. At extremely narrow viewports the fixed three-panel shell remains a separate owner constraint.
