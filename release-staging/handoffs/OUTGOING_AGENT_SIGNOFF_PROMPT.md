# OUTGOING AGENT — SIGN OFF, FREEZE, RESET CONTEXT

This is a SIGNOFF & PRESERVATION directive. Do not begin a new campaign, deploy, merge, redesign or overwrite another agent's work.

Location: /Users/dericmchenry/Developer/active/SigRank-repos/sigrank-app-live-board
Branch: feat/live-board-2b
Staging registry: release-staging/
Existing open PR: https://github.com/SunrisesIllNeverSee/sigrank-app/pull/239

The owner wants a fresh context and a complete, truthful handoff. BEFORE YOU SIGN OFF:

1. Inspect Git state. Run git status --short --branch, git rev-parse HEAD, git log -5 --oneline, git worktree list. Enumerate EVERY changed and untracked file and its workstream owner. Do not describe the shared dirty tree as clean.
2. Read release-staging/README.md, STATUS_BOARD.md, GATES.md, manifest.json, all five STATUS.md files. Do not overwrite staging's original archives; they are dated evidence.
3. PROFILE V2: independently identify the seven live components in components/profile-v2 and the changed app/user/[codename]/ page and ProfileBody. Verify ProfileTabsV2 wires all seven panels. Review mock/candidate snapshot and known watcher-count placeholder. Confirm whether any final owner review/acceptance is recorded. Do not mark RELEASE READY based only on HTTP 200.
4. CI BLOCKER: GitHub PR #239 currently fails hygiene because git ls-files -ci --exclude-standard returns exactly 40 tracked-but-ignored _workspace assets, including Hall/Compare layout JSON and screenshots. Preserve originals, document scope, propose a reviewed Git-index-only correction and get owner approval before making it; DO NOT git clean or delete files. See release-staging/VERIFICATION_2026-10-11.md.
5. LEADERBOARD/HOMEPAGE: another GPT session controls these actively edited files. Do not change their code, claims, release flags or branch tip without coordinated owner signoff.
5. TEXT: the current GPT session controls uniform page layout next. Expandable navigation is already in live local source and archived; do not rebuild or rewrite navigation.
6. HALL/COMPARE: rough page implementations and approved-layout JSON are staged. No final release acceptance yet.
7. TESTS: Run scoped TypeScript, ESLint, relevant UI/canonical tests and browser smoke without killing another active server or changing DB state. Record exact pass/fail, not just a verbal PASS. A full build is optional only if safe for active shared workspace.
8. MCP TOOLS: use Remote Desktop Commander for local branch/files/processes, GitHub MCP for PR #239 reviews/CI/commit comparison, and Playwright in Mac dev environment for layout and route checks. Supabase MCP is READ-ONLY and only if needed to validate aggregated provenance; never write or expose private data. Devin CLI is already authenticated; verify without exposing credentials. No automation/bridge installation without approval.
9. SAVE CONTEXT: Export the existing Devin conversation before wiping context (CLI supports --export; check devin --help first). Write factual final summary into release-staging/handoffs/OUTGOING_SIGNOFF.md using OUTGOING_SIGNOFF_TEMPLATE.md. If archives are stale because other agents edited source, create a NEW named snapshot and update manifest without overwriting existing zip.
10. COMMIT SAFETY: release-staging is a new untracked tracked-intent folder, not under gitignored _workspace. Propose an isolated preservation commit for this folder separately. Seek owner confirmation BEFORE staging and committing; never include other parallel branches' dirty code inadvertently. DO NOT git clean/reset/stash-pop/force-checkout. DO NOT delete originals.
11. REPORT: provide current branch/commit, session ID, existing PR, exact changed files, profile V2 map, test status, owner gates, open risks, and incoming prompt location. Explicitly state: no merge, no deploy, no hidden fixes. Sign off only after the owner has the report and can open the next session.

MCP actions available:
- mcp__Remote_Desktop_Commander__list_devices / start_process / read_process_output / read_file
- mcp__GitHub__list_pull_request_reviews / fetch_commit_workflow_runs / compare_commits
- mcp__Supabase__list_projects / execute_sql (strictly SELECT if needed)
- Existing Devin CLI: devin --help, devin auth status, devin list --format json, devin --export <path>; check syntax before executing.
- Next context entry: devin --prompt-file release-staging/handoffs/INCOMING_AGENT_PROMPT.md

When a source file has been modified concurrently, STOP and document owner conflict instead of resolving by overwrite. Work only on this signoff task.
