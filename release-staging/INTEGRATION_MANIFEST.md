# SignalAF integration staging — a315435

Current integration entry point. Created October 11, 2026 (America/New_York).
This manifest supersedes stale status summaries for integration planning; copied historical handoffs remain immutable evidence, not new instructions or approvals.

## Workspace and authority
- Local parent: /Users/dericmchenry/Developer/active/SigRank-repos
- Canonical integration worktree: /Users/dericmchenry/Developer/active/SigRank-repos/signalaf-integration-a315435
- Integration branch: integration/site-a315435 (local only; no upstream configured).
- Frozen baseline: a3154353299ab7a60e5abd5383eac95da99c394b.
- GitHub origin: https://github.com/SunrisesIllNeverSee/sigrank-app.git
- Pushed source branch: feat/live-board-2b; live remote ref, local HEAD, and PR #239 head all matched a315435 during audit.
- Original shared source: /Users/dericmchenry/Developer/active/SigRank-repos/sigrank-app-live-board
- Git common directory: /Users/dericmchenry/Developer/active/SigRank-repos/_01_sigrank-app/.git
- Existing worktrees: _01_sigrank-app on main at 02a5007; sigrank-app-graphics-hardening on feat/graphics-hardening at 93b6ec1; sigrank-app-live-board on feat/live-board-2b at a315435.
- Remote main at audit: 5b1357a6dbe16d1bcea14ccf2a627a7c82835e33. Baseline diverges by 18 main-only and 82 feature-only commits; no main reconciliation attempted.
- GitHub repository name and local folder name are independent. The existing source already lives under the requested SigRank-repos parent.
- A worktree isolates files and index, but shares Git refs/history. Do not modify other worktree branches.

Authorized now: audit, isolated worktree, preservation copies, integration planning/checklist.
Not authorized here: page implementation changes without coordination, merge, deployment, force push, file discard, database writes, or restarting existing previews.
No application changes have been applied to this integration worktree. Candidate ZIPs are evidence, not active source.
No new Devin session has been launched or messaged.

## Evidence and preservation
AUDIT_EVIDENCE.json records exact source state, 39 source-file hashes, capture time, archive hashes, and drift.
All 23 original release-staging files were copied byte-for-byte. The original release-staging remains untracked and untouched.
Original manifest.json, STATUS_BOARD.md, and signoff mention 09a45dc; retain them as historical receipts.
Use Profile r2 for proposed integration. Its 28 members and all 8 editorial archive members match current source; r1 differs in two expected files.
All three ZIP hashes and every archived member hash were verified. Hall/Compare layout copies match their approved source JSON.
Fresh editorial-against-a315435.patch and profile-against-a315435.patch record tracked diffs against the actual baseline. They omit untracked modules; pair them with the verified ZIP members.
Never bulk-extract an archive over app source or apply an old patch without checking current hashes and ownership.

## Page ownership and commit boundaries
Owner labels identify existing responsibilities; they do not assign authority to a new session.

| Workstream | Current evidence / state | Existing owner | Allowed future implementation scope after coordination | Next gate |
|---|---|---|---|---|
| Leaderboard / home | a315435 adds 14 board-specific files; inherited branch includes earlier pages | Leaderboard GPT + product owner | Frozen board files listed in docs/live-board-hardening-checkpoint-2026-10-11.md | Preserve board behavior; settle homepage routing explicitly |
| Editorial | text-pages/editorial-nav-integrated-2026-10-11.zip; 8 files; matches shared source | Editorial GPT | app/articles/page.tsx, app/blog/page.tsx, components/blog/BlogWorkspaceFrame.tsx, components/live/EditorialSidebar.tsx, lib/editorial/* | Preserve nav first; uniform page structure is separate follow-up |
| Shared style | 49-line appended editorial navigation block, components/live/proto-scoped.css | Editorial + leaderboard owners jointly | Reviewed hunks only; integrator owns conflict resolution after both confirm | Board and all text-page visual regression |
| Profile V2 | user-profile/profile-v2-candidate-2026-10-11-r2.zip; 7 components plus route edits | Outgoing Devin profile owner; next owner must be named | components/profile-v2/*; app/user/[codename]/page.tsx and ProfileBody.tsx | Public/private/owner tests; watchCount=0; IdentityHero unwired; preserve SplitFlap placement |
| Hall | app/hall/page.tsx, components/hall/* already in baseline; hall/hall-layout.json is design evidence | Product owner for final design; implementer unassigned | Hall-only files | Final medals/vacancies/rails/responsive review and data tests |
| Compare | app/compare/page.tsx, components/compare/* already in baseline; compare/compare-layout.json is design evidence | Product owner for final design; implementer unassigned | Compare-only files | Selectors/query URLs, metric parity, empty states and visual review |
| Integration / preservation | This manifest, audit evidence, preserved snapshots | Codex audit now; one integration lead next | release-staging/* and reviewed cross-page glue | Never absorb another lane's dirty files without explicit scope |
| Repository hygiene | 40 tracked-but-ignored files inherited from baseline | Integration lead after custody review | Separate reviewed index/policy change | Preserve physical assets; no deletion performed in this audit |

Protect scoring/API/privacy contracts, server-only weights, SEO routes, lockfiles, and deployment configuration.
Changes to app/page.tsx, shared navigation/layout, board queries, or global styles require the relevant page owners' coordination.
Treat current page layout approval and production release approval as separate gates.

## Preview receipts and limits
- :3222 PID 5603: /Users/dericmchenry/Developer/active/SigRank-repos/_review_leaderboard_harden_20261011; a disposable copy with no .git, not a registered Git worktree.
- Browser at http://127.0.0.1:3222/board/all rendered Global AI Operator Leaderboard, HITL/Hybrid/Autonomous controls, 22 ranked operators and 29 signed-up members beginning at #23. Settled DOM had 52 tbody rows including the section row. No console errors captured in the sampled load.
- :3210 PID 51171: original dirty sigrank-app-live-board; browser homepage rendered the editorial SigRank landing page and topic navigation.
- Important routing gap: the current / homepage is still editorial; /board/all is the hardened leaderboard. Moving the leaderboard to / is an explicit integration decision, not completed by a315435.
- HTTP smoke results are in PREVIEW_HTTP.json. These are availability checks, not functional or privacy signoff.
- No server runs from the new integration worktree yet. Existing servers and their files were left untouched.
- :3210 has a previously documented hydration/HMR issue; no fresh full interaction audit was done here.
- Dependencies temporarily link to the shared node_modules for read-only checks. No install, package changes, secrets, .env, or build output were copied. Use an independent dependency install and approved local configuration before the integration preview; do not run installs through this symlink.
- Current shell Node is 26.10.0, while package.json pins 22.x. Provision/use Node 22 before release build validation. The repository's older Next 15 notes are stale; package.json and running servers indicate Next 16.3.8.

## Remote release status
PR #239: https://github.com/SunrisesIllNeverSee/sigrank-app/pull/239 — open, 170 changed files, head a315435.
Latest CI run 38121776522 failed the hygiene step for 40 tracked-but-ignored _workspace files; types/canonical success must not be inferred from that run.
Vercel preview status succeeded; Supabase Preview skipped. This audit performed no merge/deployment or remote write.
Starting at a315435 inherits the full branch history and hygiene issue. This is an isolated integration workspace, not a clean-main 14-file PR.

## Ordered commit and integration checklist
- [x] Verify remote checkpoint, upstream, worktree relationships, and preview origins.
- [x] Create one named worktree at the exact checkpoint without moving the dirty shared tree.
- [x] Preserve historical staging artifacts and verify archive/member integrity.
- [x] Required checks passed; preservation-only scope committed locally with SHA recorded in the audit delivery receipt.
- [ ] User names one integration lead; page owners confirm scope and freeze/export any newer candidates.
- [ ] Recheck hashes against AUDIT_EVIDENCE.json; stop on drift and reconcile with that owner.
- [ ] Import Profile r2 source-only members in one scoped commit; keep reference HTML out of app/public. Validate privacy/owner states before considering it release-ready.
- [ ] Import editorial navigation in its own scoped commit, including lib/editorial modules and reviewed CSS hunks.
- [ ] Standardize editorial formatting as a separate owner-reviewed commit.
- [ ] Resolve / versus /board/all routing and link behavior with product owner; preserve intentional discovery pages.
- [ ] Apply approved Hall edits in a Hall-only commit.
- [ ] Apply approved Compare edits in a Compare-only commit.
- [ ] Review preserved asset custody and fix inherited hygiene in an isolated commit without discarding physical files.
- [ ] Install exact locked dependencies independently under Node 22; configure environment locally without committing secrets.
- [ ] Start one integration preview on a checked-free port (suggest :3230), record cwd, branch, SHA, command, logs, and dirty state. Keep :3210/:3222 unchanged.
- [ ] Per commit: explicit path staging, inspect staged diff, TypeScript and 11 canonical tests. Run API/scoring tests if those paths change.
- [ ] Integrated checks: home→board→profile→compare→hall→editorial navigation, 3 workflow filters, ranks vs member positions, sorting, Raw/Metrics, no private signup identities, profile visibility, empty states, keyboard/mobile, build/lint/CI.
- [ ] Capture screenshots and test receipts tied to the exact integration SHA; product owner reviews the whole site.
- [ ] Only after an explicit later instruction: decide remote publication/PR strategy and main reconciliation. No merge or production deployment under this audit.

## Recommendation for Devin and specialized tools
A fresh Devin session is suitable as the sole integration executor after ownership is coordinated. Start it in this worktree and give it this manifest; do not start another parallel editor in the dirty source.
Keep product/design decisions with the owner and existing page leads. Devin should implement narrowly, commit by workstream, and report exact preview provenance.
Use GitHub tools/CLI for commits and CI, browser/Playwright for interactive verification, and Filesystem/Remote Desktop Commander for scoped file inspection.
Use Figma or MagicPath for approved design references and spacing/type comparison; PostHog for existing navigation/drop-off evidence; read-only Supabase for profile/data-contract checks; Wolfram or local reproducible calculations for metric parity when needed.
These capabilities are available in this Codex environment but must be discovered and authenticated in Devin's actual session; do not claim they ran merely because they are listed.
Knowledge-graph read_graph, codebase-memory, and Repomix tools were not exposed here; targeted Git and filesystem evidence was used instead. No external design project, analytics account, or database was modified.
