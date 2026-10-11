# SignalAF leaderboard — hardened staging checkpoint

**2026-10-11 · branch feat/live-board-2b · OWNER REVIEW PRE-RELEASE**

This tracked, board-only checkpoint provides a stable baseline for future
per-page staging. It excludes ongoing unrelated editorial pages, profile V2,
EditorialSidebar, broad stage CSS, and release-staging/ changes.

## Owner-approved view model

- HYBRID is the landing COMBINED VIEW: full 22 ranked operators plus
  29 real registered-but-unranked positions, #23 through #51.
  This does not assert that every operator has verified hybrid execution.
- HITL represents legacy Human-Centered Mass assessed rows. The current
  all-time dataset has 13 mode=hitl ranked rows.
- AUTONOMOUS represents 9 legacy unresolved/Outlier CANDIDATES plus 29
  not-yet-ranked members in an Autonomous review queue. A null workflow
  assessment or a signup is NOT proof of autonomous agent execution.
- Only three filter tabs: HITL / Hybrid / Autonomous. Hybrid is default.
- All 29 signed-up accounts occupy individual rows after ranked operators;
  positions #23–#51 are member positions, NOT earned performance ranks.
  HITL omits this autonomous review queue; Hybrid and Autonomous include it.
- No pre-board identity consent policy has been implemented yet. Public
  rows show private-safe SIGNED-UP OPERATOR labels, NO names/emails/user IDs/
  codenames/links. Never invent identities or use seeded research profiles.
- Metrics 14 columns / Raw 10, correct group spans and adjacent Total & ∑/day.
  Raw I/O/W/R remain separate, no Metrics token-pillar subline. Inline true
  Signa Rate history, separate table-only precision, full three-term ratio,
  real cost, gold/blue/indigo per-numeric-column podiums and secondary ranks.

## Deferred threshold study (requested AFTER this commit)

Existing public API returns 22 claimed/eligible ranked operators, of which
13 currently resolve HITL and 9 have null/unresolved workflow_mode.
The presentation uses the unresolved cohort as provisional Outlier candidates.
This must NOT be confused with scored evidence of autonomous operation.
The owner explicitly deferred deeper legacy HCM vs Outlier thresholds until
after the hardened checkpoint; reconcile API and UI filter semantics in that
subsequent review without losing the 51-member Hybrid view.

## Safety and release gates

- Source is feature branch feat/live-board-2b, not a production deployment.
- The registration endpoint is a read-only server-side anti-join of distinct
  active linked accounts against full all-time ranked IDs. Current count:
  51 active signed-up, 22 ranked, 29 unranked. No private identities in JSON.
- Real per-operator Signa Rate histories load in one bounded batch endpoint.
- Next.js localhost:3210 has a pre-existing HMR/hydration defect. Verify
  interactive behavior in a disposable production-style build. Any offline
  Google Font workaround belongs only inside that disposable build copy.
- Keep frozen original board backup:
  ~/Desktop/SigRank/References/Board_Reference_2026-10-10_FROZEN.zip
- PR/CI, full responsive visual acceptance, explicit pre-board signup consent,
  definitive HCM/Outlier thresholds, and owner deployment approval are OPEN.
- Another agent owns unrelated release-staging/, profile, and editorial files.
  Do not include, reset, stash, or silently modify their changes.
- Push this checkpoint to the feature branch only: NO merge or deployment.

## Board file scope

app/api/v1/leaderboard/route.ts;
app/api/v1/board/signup-summary/route.ts;
app/api/v1/board/trends/route.ts;
components/live/LiveBoardWorkspace.tsx, rows.tsx, utils.ts, board-cols.css;
lib/board/live-projection.ts, live-types.ts, types.ts, workflow-mode.ts;
__tests__/board/live-projection.test.ts, workflow-throughput.test.ts;
this handoff document.
