# SignalAF integrated staging manifest
Updated October 12, 2026. This is the current integration receipt. Historical STATUS files and manifest.json remain unchanged evidence.

## One workspace and one preview
- Workspace: /Users/dericmchenry/Developer/active/SigRank-repos/signalaf-integration-a315435
- Branch: integration/site-a315435 (local, no upstream).
- Frozen base: a3154353299ab7a60e5abd5383eac95da99c394b.
- Application checkpoint: 766c6f0 (homepage/navigation integration).
- Preview: http://127.0.0.1:3230/ — production build and server from this workspace, Node 22.23.1, Next 16.3.8.
- Home / now renders the existing all-time leaderboard component; /board/all remains available.
- Preserved editorial landing: /sigrank. Its original content is unchanged; only its canonical path changed.
- Same-site routes: /articles, /blog, /wiki, /fieldhub, /hall, /compare, /user/xoxo.
- Original sources and running :3210/:3222 previews remain untouched.

User coordination: the user explicitly directed the leaderboard to become home and the :3210 work to be integrated into it. Scoped candidate imports and navigation glue were completed here. No production/shared page was edited; no merge, deployment, remote push, database mutation, reset, discard, or new Devin session occurred.

## Repository relationship
GitHub origin is https://github.com/SunrisesIllNeverSee/sigrank-app.git. The GitHub repository name is independent of its local folder name.
The shared source already resides at /Users/dericmchenry/Developer/active/SigRank-repos/sigrank-app-live-board.
Its branch feat/live-board-2b and the live GitHub branch/PR #239 head matched a315435 at audit.
Registered worktrees share /Users/dericmchenry/Developer/active/SigRank-repos/_01_sigrank-app/.git, but have separate files and indexes.
This integration branch starts exactly at a315435 and adds preservation and scoped integration commits. It does not reconcile main.
Other worktrees: _01_sigrank-app/main at 02a5007; sigrank-app-graphics-hardening/feat/graphics-hardening at 93b6ec1; sigrank-app-live-board/feat/live-board-2b at a315435.
Remote main at audit was 5b1357a; 18 main-only and 82 feature-only commits. PR #239 is open with 170 changed files.
Inherited CI failure: 40 tracked-but-ignored _workspace files. Physical assets have not been deleted or removed from the index.

## Scoped commits
| Commit | Contents |
|---|---|
| 6adfb11 | Preserve candidate archives, hashes, original status/handoffs, and audit |
| 1d08240 | Profile V2 r2: seven view modules plus two profile route files |
| 5fdcd76 | Completed editorial navigation: seven source files, including scoped appended CSS |
| 766c6f0 | Home uses leaderboard; original landing at /sigrank; shared navigation, sitemap classification, root cache refresh |

All commits are local on integration/site-a315435. Do not imply they were pushed. Candidate-import receipt gives the source archive and original hash of every imported file.

## Source custody
- Profile r2: release-staging/user-profile/profile-v2-candidate-2026-10-11-r2.zip; seven components and two route files now active in this worktree. r1 preserved for history.
- Editorial: release-staging/text-pages/editorial-nav-integrated-2026-10-11.zip; completed navigation now active.
- Hall/Compare: bcc5c3a (workspace migration) and 7bb4c2b (ledger-to-stage fix) are ancestors of a315435. Hall remains byte-identical to that baseline. Compare now has the owner-requested fixed-stage integration described below.
- Approved design evidence: original _workspace/layout-editors/{hall,compare}.html and approved/{hall,compare}-layout.json in the shared source; custody JSON in release-staging/{hall,compare}. Screenshots are historical evidence, not proof of later edits.
- Profile HTML review mocks remain in the source _workspace/profile-mocks and inside the preserved archives. They are not routable production pages.
- AUDIT_EVIDENCE.json fingerprints 39 dirty/untracked source files and the archive verification. Current source-preservation check is in INTEGRATION_RECEIPT.json.
- Each source/archive member was verified before selective copying; no bulk extraction or old patch was applied.
- Original .env.local was copied privately into an ignored local file for this preview; no secret is committed or printed.
- Dependencies are an independent APFS clone of existing dependencies, not a shared symlink. No package or lockfile edits and no new app dependency.
- Original historical manifest.json and outgoing signoff mention 09a45dc; they are immutable historical receipts. This manifest controls current integration status.

## Ownership boundaries
| Lane | Ownership and scope | Remaining gate |
|---|---|---|
| Leaderboard | Existing leaderboard owner controls rankings, filters, API, privacy and projection. Integrator changed only the navigation link in LiveBoardWorkspace. | Resolve hydration warning; preserve hardened baseline behavior |
| Editorial | Existing editorial owner controls content and uniform text-page structure. Imported archive is the completed navigation candidate. | Uniform formatting remains separate work |
| Profile | Profile owner controls components/profile-v2 and app/user/[codename]. Integrator imported r2 without rewriting it. | Resolve xoxo rank #0, watchCount=0, IdentityHero unwired; owner/private checks |
| Hall | Product owner controls final layout; implementer owns app/hall and components/hall. Existing committed design retained. | Owner final visual acceptance, responsive/medal/vacancy review |
| Compare | Product owner controls final layout; integrator owns this scoped fixed-stage pass in app/compare and components/compare. The implemented stage content and original sidebars are composed into one fixed dashboard, with every ledger row visible. | Owner final visual acceptance; smaller-screen refinement |
| Shared glue | One integration lead owns app/page, app/sigrank, shared rails, route classification and cache glue in this worktree. | Coordinate shared changes with page owners; no concurrent wholesale CSS rewrites |
| Preservation | Integration lead owns release-staging and receipts. | Keep historical snapshots intact |
| Release/hygiene | Separate reviewed change after source custody. | Resolve inherited ignored-file CI failure; reconcile main and release approval |

Scoring formulas, server-only weights, database schema, ranking/API projection, auth/privacy policies, lockfiles and deploy config are outside this integration's edit scope.
Root cache refresh adds only two revalidatePath("/") calls to existing mutation-triggered refresh functions; no database query or per-render cost was introduced.
Root rendering reuses the existing all-time board page and its cache/data logic. No second leaderboard implementation was created.

## Verification
- TypeScript: passed (including production build).
- Canonical: 11/11 passed.
- Full unit suite: 682 passed, 4 skipped, 0 failed (686 total).
- UI suite: 155/155 passed across 16 files.
- Scoped ESLint and git diff --check: passed.
- Production build: passed, 286 routes generated; no offline-font source workaround.
- HTTP 200 for /, /sigrank, /user/xoxo, /hall, /compare, /articles, /blog, /wiki, /fieldhub.
- Browser: home renders Global AI Operator Leaderboard; initial settled table includes 22 ranked +29 signed-up members (52 rows including the section row).
- Browser: HITL, Hybrid, Autonomous controls activate and change rendered rows; Metrics/Raw and ascending sort respond.
- Browser: SigRank rail link opens /sigrank; visible SigRank button toggles real page-section anchors; topic selector opens Articles/document navigation.
- Browser: Profile Overview, Stats, Analysis, Lab, Submissions and Social panels respond; public Report tab disabled. This is not authenticated-owner or full privacy signoff.
- Browser: Hall and Compare render in same origin and shared Compare link navigates successfully.
- Observed React error #418 on board/editorial loads is an open gate, not a clean-console claim. Existing :3210 had a previously documented hydration issue; attribution of the new warning needs diagnosis.
- Observed xoxo Overview #0/0.0%ile needs reconciliation with board identity/rank before release.
- Production preview is local and temporary. It does not change signalaf.com.

## Commit/release checklist
- [x] Verify remote a315435 and worktree relationships.
- [x] Isolate integration at a315435; preserve dirty source and snapshots.
- [x] Verify/import/commit Profile r2 separately.
- [x] Verify/import/commit completed editorial navigation separately.
- [x] Verify Hall/Compare commits are inherited; retain them.
- [x] Make leaderboard the new home and preserve editorial landing.
- [x] Connect routes in one production preview.
- [x] Run required tests/build and sample browser interactions.
- [x] Record current ownership boundaries and concrete remaining gates.
- [x] Compose all Compare content into one fixed stage in this isolated worktree, using the original sidebar proportions and no view-switch tabs.
- [ ] Resolve hydration warning and profile rank mismatch with lane owners.
- [ ] Complete uniform editorial formatting and owner final Hall/Compare edits.
- [ ] Verify authenticated owner/private profile behavior and remaining interactions.
- [ ] Resolve inherited repository hygiene failure in a separate reviewed commit.

## Compare marked arrangement — October 12, 2026

The owner's eight browser annotations specify the current arrangement. All comparison content remains visible together.

- Operator A selector is at the left end of the title bar; Operator B is at the right end. The centered Compare h1 is retained. Search/select behavior is unchanged.
- Left sidebar: Operator A, Operator B immediately beneath it, then metric context. Compare Against Me remains alongside the Operator A summary when applicable.
- Right sidebar: matchup context, Throw-Downs/challenge controls, both share tools, then Related links.
- Stage: quick comparison report on the left, paired Raw/Metric radars on the right, full parallel ledger beneath, history at the bottom. There is no separate stage selector or challenge row.
- No metric values, winner calculations, canonical IDs, comparison facts or history were removed.
- Shared WorkspaceShell gains an optional titleControls slot. Only Compare supplies it. Existing pages retain their current title rendering; global shell CSS was not edited.
- Browser fit passed at the owner's 1229×739 viewport and at 1280×720, including xoxo selected through title search. Document dimensions match the viewport, both sidebar scroll/client heights match, all 16 ledger rows are present, and final matchup facts fit their panels.
- Node 22 TypeScript, scoped ESLint, canonical 11/11, whitespace check and production build (286 routes) passed. Captured Compare error logs are empty for these interactions.
- Preview: http://127.0.0.1:3230/compare?a=signal-92b4f9f485&b=the-field.
- Evidence: calling chat outputs/compare-marked-layout-1229.png and compare-marked-layout-checks.json. Earlier layout receipts are retained as history.
- Scope: integration worktree only. Shared dirty source, Hall/profile/editorial implementations, ranking/database logic, lockfiles and deployment configuration remain untouched by this pass.
- Limits: owner visual acceptance and authenticated Compare Against Me verification remain open. Narrow screens retain horizontal access; phone-size composition is separate.
- [ ] Owner visual acceptance of this marked arrangement.
- [ ] Reconcile remaining site-wide release gates before any merge/deployment.

## Next coordinator
Keep one integration lead and this worktree. A new Devin session is not needed to assemble the pages: that assembly now exists.
If Devin is used for follow-up hardening, supply this manifest and exact branch; give it a scoped lane and insist on explicit commits, current source hashes, and no edits in the shared dirty worktree.

## SigRank annotated formatting — October 12, 2026

- Owner-requested scope: SIGNALAF header becomes hover topic navigation; SigRank hero fits the center column.
- Files: EditorialSidebar.tsx, WorkspaceShell.tsx, proto-scoped.css, app/sigrank/page.tsx.
- Editorial topic pages share the header navigation. Compare and Hall retain their existing column headings.
- Hero typography uses its column width; canonical copy, destinations, telemetry and scoring remain unchanged.
- Commit checklist: TypeScript, scoped ESLint, canonical 11 tests, production build, browser hover/focus and wordmark bounds.
- Shared source checkout untouched; no merge, push or deployment authorized or performed.

## Profile workspace correction — October 12, 2026

- Owner reported V2 content still outside the required four-column shell; corrected in the integration checkout.
- Layout source: original `_workspace/profile-mocks/shell.html`; production uses shared WorkspaceShell with icon rail, profile navigation, center stage and operator inspector.
- Sidebar and stage tabs share selection state. Existing ProfileAuthGate, Report/Lab gates, edit/claim controls and server data queries remain in place.
- The legacy animated signature card is preserved in an expandable section below the profile rather than preceding the identity.
- Ownership: app/user/[codename]/page.tsx and ProfileBody.tsx; components/profile-v2/ProfileWorkspace.tsx, ProfileTabsV2.tsx and profile-workspace.css.
- Checked: TypeScript, scoped ESLint, canonical 11 tests, production build; public tabs and both navigation controls in browser.
- Remaining: full owner/private/pending regression acceptance and detailed inspector chart parity with design mocks. This is shell integration, not final profile release approval.
- Shared source remains untouched. No push, merge or deployment.
