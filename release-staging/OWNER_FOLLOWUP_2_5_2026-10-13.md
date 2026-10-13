# SignalAF Owner Follow-up — Items 2–5
Date: October 13, 2026. Scope: Items 2–5 ONLY. Items 1, 6, 7 and 8 are held. Staging-only; production unchanged.

## 2 — Real signed-in Watch / Unwatch / My Watchlist
Item: Verify persistent WATCH and owner-only My Watchlist using a real signed-in account.
Status: IMPLEMENTED & VERIFIED.
Solution or answer: Used the REAL authenticated Safari session, not a mocked user, on a localhost-only isolated staging preview. First read original Watch and My Watchlist state; POST toggled a public operator; fresh GET returned the changed state and the private Watchlist agreed; a second POST restored the initial state, confirmed with fresh GET/list. No net state change remained.
Code changed: NO.
Files and function/component: Existing WatchButton.tsx, MyWatchlist.tsx, API /api/v1/operators/[codename]/watch GET/POST and /api/v1/me/watches GET.
Commit: Existing implementation 06cccaf; this dated verification receipt is new.
Where to see it: http://localhost:3230/me and http://localhost:3230/board/all.
Verification and evidence: Safari /me resolved to /user/signal-92b4f9f485. The temporary same-origin QA page reported WATCH_QA_PASS_REAL_AUTH_PERSIST_RESTORED. Server logged HTTP 200 for authenticated baseline, both POSTs, and all subsequent GETs; database verified operator_watches RLS enabled with three policies, public view has the needed columns. Temporary QA page removed and Safari test tab closed. No credentials or watcher identities exported. Prior browser tests verified watchlist UI with controlled authentication; this check establishes real session persistence.
Remaining decision or dependency: Optional final owner visual approval; no backend blocker shown.

## 3 — Modelled daily activity must say ESTIMATED
Item: Explicitly label prorated/illustrative activity until daily data arrives.
Status: IMPLEMENTED & VERIFIED.
Solution or answer: Keep existing modeled day colors. Distinguish snapshot-date cells from unobserved modeled days; label the panel and popup ESTIMATED, mark each modeled cell with an explanation, and prefix approximate ACTIVE/BEST/STREAK with ~ and EST. captions. Clearly state these are NOT verified daily submissions. A pending operator without history shows NO DAILY DATA. Do not call the seeded display mathematically prorated: it remains a model-based illustration until a daily rate or actual daily samples exist.
Code changed: YES.
Files and function/component: components/profile-v2/ProfileRailPanels.tsx.
Commit: See owner-estimation staging merge commit.
Where to see it: http://localhost:3230/user/xoxo, /user/zachlagden, /user/sex.
Verification and evidence: WebKit on isolated staging (localhost:3274), 154 cells each, no JS errors: xoxo 153 modeled days and estimated activity counts; zachlagden 99 modeled days; sex zero and NO DAILY DATA. TypeScript, scoped lint and canonical 11/11 passed.
Remaining decision or dependency: Replace interpolation with measured daily activity when reliable daily observations become available.

## 4 — Records & Honors, trophies and badge catalog
Item: Review the other agent's visual presentation and record details.
Status: RECOMMENDATION ONLY — reviewed; owner visual approval pending.
Solution or answer: Earned/pending/unavailable medal hexagons and click-to-open detail dialogs are present. Dialogs show DEFINITION, VALUE, COHORT, PERIOD, DATE and EVIDENCE when supported. Badge Index separates 38 Pixel designs (5 existing, 1 existing-disputed, 27 proposed, 5 blocked) and 30 Achievement designs (8 candidates, 15 proposed, 7 blocked), correctly indicating concepts versus awarded marks.
Code changed: NO.
Files and function/component: RecordDetailList.tsx, RecordMarks.tsx, ProfileRailPanels.tsx, BadgeArtwork.tsx, BadgeDirectory.tsx, badge catalog JSONs.
Commit: Other agent's staging profile/artwork commits; no change here.
Where to see it: http://localhost:3230/user/xoxo (open a record); http://localhost:3230/user/zachlagden (pending milestone); http://localhost:3230/hall/badges.
Verification and evidence: WebKit HTTP 200 on all three routes. Opened a current Yield record dialog and verified all six fields and evidence link. Visual inspection found rail medal sigils small (~16px), with low contrast on zero-count tallies; date often reads LIVE STANDING (not an actual timestamp), and evidence link often leads to a broad leaderboard rather than an individual source record.
If recommendation only: On owner approval, increase small rail medal symbols toward 22–24px; raise tally contrast; show source-specific evidence and as-of timestamps when real data permits.
Remaining decision or dependency: Owner approval of trophy size/color and record popup presentation. Do not mark proposed badge designs as earned.

## 5 — OITL / Autonomous / Hybrid marks and ranks
Item: Verify symbols, distinct cohort rank labels, and Devin classification evidence.
Status: IMPLEMENTED & VERIFIED for current board membership/rank arithmetic; owner naming review outstanding.
Solution or answer: Devin reconciled old Operator → OITL, Outlier → Autonomous/Review (includes unresolved), All → Hybrid combined field. Current predicates: OITL = hitl + hybrid, Autonomous/Review = agentic + hybrid + null, Hybrid view = whole field. Cohort ranks use Yield sorting within each displayed cohort. SVG labels distinguish operator-in-loop, automation, hybrid and unresolved review; null mode is visibly REVIEW, not confirmed autonomous.
Code changed: NO.
Files and function/component: lib/analytics/workflow-cohort.ts; lib/board/workflow-mode.ts; components/profile-v2/WorkflowMark.tsx, ProfileRailPanels.tsx; components/live/LiveBoardWorkspace.tsx; release-staging/NEXT_PUSH_WIRING_AUDIT.md (Devin Round 6).
Commit: Devin reconciliation a87391a and profile visual commit 260b849 (plus follow-up). No code changed here.
Where to see it: http://localhost:3230/board/all and /user/xoxo, /user/zachlagden.
Verification and evidence: Devin documented current 22 combined, 13 OITL, 9 Autonomous/Review. Independent WebKit current staging: xoxo FIELD #3/22, AUTO #3/9, individual badge REVIEW/UNRESOLVED; zachlagden FIELD #11/22, OITL #2/13, correct readable icon label. This verifies mapping to the current rendered board, NOT real third-party automation attestation; Devin reports no live verified HTTPS attestation for agentic/hybrid submissions.
Remaining decision or dependency: Owner naming choice: the pill AUTONOMOUS includes unresolved candidates, so consider AUTONOMOUS / REVIEW to prevent a false implication. Final glyph aesthetics and rank prominence require owner signoff. Do not silently alter classification rules.
