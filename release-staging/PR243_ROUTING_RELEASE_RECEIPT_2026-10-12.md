# PR 243 routing release receipt — 2026-10-12

- PR: https://github.com/SunrisesIllNeverSee/sigrank-app/pull/243
- Reviewed head: e147690d3e097980cdaf347ccac7d61c41375073
- Merged main commit: 54484c7d8ce6e40e2649c78101ee0631707d4469
- CI hygiene/types/canonical, CodeRabbit status, and Vercel preview: successful. Supabase Preview: skipped.
- Production deployment: dpl_BLeqWAM1dg1XCpPnhEFyGLiJ7fi2 / https://sigrank-1zef83tht-burnmydays.vercel.app
- Existing signalaf.com deployment was pinned to 5b1357a6dbe16d1bcea14ccf2a627a7c82835e33 (October 10 rollback). Source comparison from that SHA to merged main changes only proxy.ts and __tests__/agent/readiness.test.mjs; redesign source is excluded.
- Initial automatic production build was READY but the custom domain continued serving the rollback. Promoted the existing READY build using the correct burnmydays team scope. No manual build was created.
- Confirmed signalaf.com now resolves to the new deployment.

## Live checks with Accept: text/markdown

| Route | Status | Content type |
| --- | --- | --- |
| /privacy | 200 | text/html |
| /wiki/four-degrees | 200 | text/html |
| /blog/volume-isnt-yield | 200 | text/html |
| / | 200 | text/markdown |
| /missing-page-pr243-verification | 404 | text/html |

Existing non-home pages fall through to HTML; this fix does not add markdown versions of every page. Homepage markdown negotiation remains intact.

The shared staged integration worktree was not switched, reset, merged with main, or committed during this release. Its uncommitted badge/settings work remains in place. A scoped backport of the routing fix to integration can be made separately. Plugin repository visibility and external directory submission were not changed.

Profile follow-ups remain in PROFILE_LANES_RECONCILIATION_2026-10-12.md: observed-data-only heatmap/streaks, consistent badge artwork/legacy ownership, preference migration plus owner save verification, and documented API-versus-combined-field rank semantics. The owner disputes older hybrid/agentic taxonomy assumptions; do not revise thresholds without checking current rules/evidence.
