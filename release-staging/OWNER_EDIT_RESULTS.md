# Owner edit results — October 12, 2026

Scope: October 12 narrowed owner instruction — leaderboard Scale V + Wiki, linked operator dock default, PROFILE/WATCH actions, and owner-only My Watchlist. All other checklist items remain owned by Devin / concurrent profile workstreams or awaiting owner design selection. Production MUST remain untouched.

Feature implementation commit: `06cccafe0f0f6ba4782122397748fea8574f6af9` (isolated staging branch). Final shared integration commit/HEAD to be recorded in handoff.

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
Solution or answer: Dock and peek primary action rows contain only PROFILE and WATCH; PROFILE routes to selected /user/<codename>; WATCH uses existing session-authorized toggle and shows WATCHING when active. Compare remains available separately in global navigation.
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
Status: RECOMMENDATION ONLY
Solution or answer: Sidebar placement and fixed-shell interactions belong to concurrent User Profile design workstream; not changed here.
Code changed: NO
Files and function/component: Concurrent profile agent owns ProfileBody.tsx, OverviewView.tsx, ProfileRailPanels.tsx.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/user/<codename>
Verification and evidence: Not verified here.
If recommendation only: Sidebar placement and fixed-shell interactions belong to concurrent User Profile design workstream; not changed here.
Remaining decision or dependency: Preserve concurrent edits; coordinate rail stacking with My Watchlist.

### UP-03 — Move Records & Honors into right sidebar
Item: Move Records & Honors into right sidebar
Status: RECOMMENDATION ONLY
Solution or answer: Keep access to existing detailed records; coordinate layout with submission activity and watchlist.
Code changed: NO
Files and function/component: Concurrent profile agent owns record rail code.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/user/<codename>
Verification and evidence: Not verified here.
If recommendation only: Keep access to existing detailed records; coordinate layout with submission activity and watchlist.
Remaining decision or dependency: Owner sidebar design approval.

### UP-04 — Improve trophies/records graphics
Item: Improve trophies/records graphics
Status: RECOMMENDATION ONLY
Solution or answer: Preserve earned/pending/unavailable distinction and expand labels; no unapproved badge art change here.
Code changed: NO
Files and function/component: Concurrent profile graphics workstream.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/user/<codename>
Verification and evidence: Not verified here.
If recommendation only: Preserve earned/pending/unavailable distinction and expand labels; no unapproved badge art change here.
Remaining decision or dependency: Owner approves design.

### UP-05 — Clickable record detail interactions
Item: Clickable record detail interactions
Status: RECOMMENDATION ONLY
Solution or answer: Propose accessible click/keyboard record details carrying supported metric value, scope, date/window, rank and evidence; don't infer missing facts.
Code changed: NO
Files and function/component: Concurrent profile record workstream.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/user/<codename>
Verification and evidence: No dialog tests in this workstream.
If recommendation only: Propose accessible click/keyboard record details carrying supported metric value, scope, date/window, rank and evidence; don't infer missing facts.
Remaining decision or dependency: Owner interaction approval.

### UP-06 — Restore holographic shine
Item: Restore holographic shine
Status: RECOMMENDATION ONLY
Solution or answer: Reconcile earlier card artwork with Safari and reduced-motion; avoid replacing the passport card.
Code changed: NO
Files and function/component: Concurrent profile PassportCard.tsx workstream.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/user/<codename>
Verification and evidence: Not tested here.
If recommendation only: Reconcile earlier card artwork with Safari and reduced-motion; avoid replacing the passport card.
Remaining decision or dependency: Owner visual signoff.

### UP-07 — OITL and agentic/operator-agent symbols
Item: OITL and agentic/operator-agent symbols
Status: BLOCKED
Solution or answer: No unverified workflow evidence promoted. Existing workflow identification preserved.
Code changed: NO
Files and function/component: Devin classification evidence + concurrent WorkflowMark.tsx.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/user/<codename>
Verification and evidence: Not tested in this workstream.
Remaining decision or dependency: Devin ruleset mapping and owner nomenclature.

### UP-08 — Hybrid combined and workflow ranks
Item: Hybrid combined and workflow ranks
Status: BLOCKED
Solution or answer: No derived ranks changed here. Workflow rank must use verified cohort data; Hybrid denotes combined field.
Code changed: NO
Files and function/component: Devin workflow reconciliation + concurrent workflow-cohort.ts.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/user/<codename>
Verification and evidence: Not tested in this workstream.
Remaining decision or dependency: Verified classification mapping.

### UP-09 — Compact ticker stat boxes
Item: Compact ticker stat boxes
Status: RECOMMENDATION ONLY
Solution or answer: Apply measured padding/height reductions after checking long values and narrow Safari widths; no ticker edit this pass.
Code changed: NO
Files and function/component: Concurrent profile OverviewView.tsx workstream.
Commit: None — not part of scoped implementation
Where to see it: http://localhost:3230/user/<codename>
Verification and evidence: Not implemented.
If recommendation only: Apply measured padding/height reductions after checking long values and narrow Safari widths; no ticker edit this pass.
Remaining decision or dependency: Owner layout selection.
