# Owner review — Submission history and design decision editor (October 13, 2026)

## Scope
User corrected priorities: Scale V and Watch are out of the task list; badges/pixels are already handled. User wants historical scored submissions, trophy icon/placement review, workflow naming/symbol artwork review, and a reusable Share menu placement review across Four Degrees, leaderboard, Compare, Hall, editorials/blogs and selected profile modules. No changes to scoring formulas, taxonomy, privacy, live trophies, workflow classification, or sharing actions authorized.

## Submissions (implemented in this branch)
- components/profile-v2/SubmissionsView.tsx previously restricted the detailed scored archive and fallback history to HISTORY_LIMIT=12, although lib/board/queries.ts already retrieves up to 1,000 scored snapshots per operator.
- Initial view now shows 50, with SHOW NEXT 50, SHOW ALL [count], and BACK TO LATEST 50. All fetched records are available; no change to database queries.
- Read-only database count on Oct 13: 1,245 scored submissions total, 25 operators with scored records, maximum 387 scored submissions for an operator. Actual public profile signal-92b4f9f485 had 387, including Oct 8 actual submitted_at records (all_time/multi, 90d/multi). This is stored submitted history, distinct from estimated heatmap.
- WebKit on isolated preview port 3281: profile HTTP 200, initial 50 rows, SHOW ALL expanded to 387, collapsed to 50. TypeScript, scoped lint, canonical checks passed.
- Potential future cap: per-operator query currently limits to 1,000; if any operator exceeds 1,000, add server pagination with an honest total. Do not claim an archive beyond actual stored scored submissions.

## Standalone owner design editor (review artifact only)
- File: release-staging/OWNER_DESIGN_DECISIONS_2026-10-13.html.
- Local Safari preview: http://127.0.0.1:3280/OWNER_DESIGN_DECISIONS_2026-10-13.html served from release-staging by a local static Python server. Not part of Next.js public route, not automatically deployed to staging or production.
- 19 review decisions across submissions (2), trophies (6), workflow labels/symbols (3), Share menu/placements (8).
- Real examples based on the staged Trophy.tsx, HallSubmissionRow, RecordMarks/RecordDetailList/ProfileRailPanels/PassportCard, WorkflowMark/workflow-cohort and current Share code; links to existing staged screenshots from release-staging/evidence.
- Each decision has Yes, No, Discuss and comments with local autosave. Export JSON or Markdown for handoff. A popover prototype demonstrates 8 destination icons (X, LinkedIn, Facebook, Pinterest, Instagram, GitHub embed, Email and Copy Link) without sending posts. The example actions are a PREVIEW, not operational social sharing.
- WebKit: 19 items, 4 sections, 16 menu-preview buttons, browser persistence after reload, JSON download, demo Share popover all passed.
- No production merge or live design changes. Wait for owner answers and exported notes before modifying trophies, workflow naming, or sharing placements.

## Review priorities
1. Trophies across Hall cups, leaderboard rank, profile rail metric medallions, record detail dialogs, Passport metal dots and profile medal archive; do not touch Pixel system.
2. Workflow labels: current Autonomous cohort contains unresolved REVIEW candidates, so glyph and naming must not imply verified automation absent attestation.
3. Share: one compact popover reusing existing exports. Distinguish GitHub Markdown embed, Pinterest image card, Instagram native-file share/PNG fallback, and ordinary URL-network posts. Respect canonical URLs, privacy/opt-outs and audience.
