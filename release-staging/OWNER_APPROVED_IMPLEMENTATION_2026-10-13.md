# SignalAF owner decisions — implementation receipt (October 13, 2026)

Branch target: `integration/site-a315435`. **STAGING ONLY**. Main/production is not authorized for promotion.

This record implements the approved 2026-10-13 owner decision JSON and subsequent instruction to include Markdown for editorial sharing. No metric scoring formula, claim policy, seeded ranks, or verified workflow classification was changed.

## By owner decision

| ID | Status | Applied behavior |
|---|---|---|
| H1 | Implemented / real-auth verified | Existing 50/Next/All archive preserved. Each scored submission row can share a public per-record anchor. Only its verified linked operator sees an **Original Kernel** button. Server GET reads stored `snapshot_submissions.payload_json`, **not** reconstructed metrics. Dialog separates submitted raw pillars/telemetry from submitted metric blocks and allows expanding unaltered original JSON privately. Non-owner requests do not retrieve payload. |
| H2 | Implemented as defensible PRORATION | Removed seeded random daily colors. For each calendar day, choose the narrowest valid recorded scored window, breaking ties by latest submission, divide its four raw pillar totals equally over window days. Label `PRORATED · ESTIMATED`, disclose method and no proof of actual daily sessions/streaks. No history shows NO DAILY DATA. No changes to stored actual submissions or canonical score formulas. |
| T1 | Preserved | Hall places 1–3 retain true gold/silver/bronze cup artwork. |
| T2 | Rejected / not changed | No new trophy cups on the main leaderboard. |
| T3 | Implemented | Profile right-rail record hex medallions enlarged to 22–23px; popup honors 24px. |
| T4 | Implemented | Replaced Passport footer colored dots with compact actual gold/silver/bronze **hex medallions**. |
| T5 | Implemented with evidence limit | Native record dialogs preserved. Display available board snapshot as-of date instead of unqualified LIVE STANDING. When original source submission is present in public scored history, evidence links to that exact row; otherwise explicitly fall back to current leaderboard. No invented source or award date. |
| T6 | Preserved | Trophy/record ledger remains separate from Pixel achievements. Existing earned/pending/unavailable states and badges preserved. |
| W1 | Implemented | Mixed mode view labeled **AUTONOMOUS / REVIEW** where necessary; unresolved operators remain REVIEW, not verified autonomous. OITL/Hybrid cohorts and rank predicates unchanged. |
| W2 | Implemented | OITL human checkpoint-loop symbol, automated continuous-cycle robot head, hybrid human/machine cycle, dashed question-ring for unresolved. No additional hex chassis. |
| W3 | Implemented | Full labeled marks remain on profiles; dense leaderboard rows have icon-only tooltip marks. |
| S1 | Implemented | One reusable lightweight, unboxed Share popover for X, LinkedIn, Facebook, Pinterest, Instagram image workflow, GitHub Markdown embed, Email and Copy Link. Native file/PNG flows are used where an ordinary social deep link is not available. |
| S2 | Implemented | Four Degrees top-right Share with public chart screenshot/download support; existing chart/report evidence preserved. |
| S3 | Implemented | Existing leaderboard **single-row** toolbar preserved; one Share button opens all social icons plus CSV export and existing board screenshot control. Search placement NOT moved: owner only floated it for later consideration. |
| S4 | Implemented / old cards retained for review | Compare Share includes screenshot of the actual center stage body `#compare-vs-artwork` and public A/B URL; existing separate summary/matchup card downloads retained for owner's review. |
| S5 | Implemented | Individual Hall **rank positions 1–10** get compact Share with deep-link anchored to their metric board row; no blanket Share on every record outside that top-ten range. |
| S6 | Implemented | Blog entries plus articles index, research and Field Analysis expose **X, LinkedIn, Email, Copy Link, Copy Markdown**; no extra social network buttons for editorials. Markdown is a link/embed, not a claim that unmodified publication-source Markdown was copied. |
| S7 | Implemented | Public profile Passport share (existing export preserved); earned record-detail Share with screenshot; scored history rows receive shareable public anchors. Private Watchlists and raw submission JSON are not exposed via sharing. |
| S8 | Preserved | Existing `/s/{codename}` social card URLs reused for public operator image share. Existing canonical identity / privacy / noindex behavior left untouched. |

## Security and provenance
- Private route: `GET /api/v1/operators/[codename]/submissions/[submissionId]/kernel`.
- Requires validated Supabase user; checks owner account → linked operator id → matching codename → scored submission belonging to that operator; returns 401 signed out and 404 for unlinked/foreign operator. `Cache-Control: private, no-store`.
- Real authenticated Safari check: original JSON returned 200 for linked operator; attempted cross-operator read returned 404; no private payload was logged or copied; temporary QA page removed.
- Heatmap prorations use scored reporting-window pillars and date ranges, **not** original JSON, so public display remains privacy-safe.

## Testing
- TypeScript strict: PASS.
- ESLint scoped: 0 errors (pre-existing field warnings may remain).
- Canonical scoring invariants: 11/11 PASS.
- Full unit test suite: 682 PASS / 4 SKIPPED (686 total).
- Added deterministic proration tests covering shortest window, newest tie, and malformed/absent records.
- WebKit browser checks on staging worktree: leaderboard, Compare, Hall, Four Degrees, articles, research Share menus all opened; authenticated kernel success/denial verified; prorated and no-data profile labels verified; single-row leaderboard not rearranged.
- Known independent issue: blog route emits a React hydration warning in both the untouched :3230 baseline and modified preview; the editorial Share menu itself works. Do not misrepresent this as a new passing clean console.
- Social composer POSTs were not performed; eight-icon destinations were checked for interface and URL-construction behavior only. Safari screenshot/image export may depend on CORS and available browser file sharing.

## Integration discipline
- Work was performed in isolated worktree `feat/owner-approved-sharing-trophies-workflow-20261013` starting at commit `55a2926` and reconciled with the shared integration branch only after status/overlap checks.
- The owner rejected top-three cups on the main leaderboard, so that change was intentionally excluded.
- **No production promotion.** Owner should inspect the staging preview, particularly trophy visual scale and workflow icon semantics, before any production release.
