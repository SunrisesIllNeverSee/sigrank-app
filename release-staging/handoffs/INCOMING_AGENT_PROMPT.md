# INCOMING DEVIN / FRESH CONTEXT — SignalAF

You are continuing an already active, multi-agent SigRank/SignalAF project. This is not permission to start another rewrite.

Repo: /Users/dericmchenry/Developer/active/SigRank-repos/sigrank-app-live-board
Branch at prior capture: feat/live-board-2b, HEAD 09a45dc (VERIFY current HEAD)
Open GitHub PR #239: https://github.com/SunrisesIllNeverSee/sigrank-app/pull/239
Local site: http://127.0.0.1:3210/ . Ports 61173 and 8766 were temporary preview servers and may be OFF.

FIRST: read release-staging/README.md, STATUS_BOARD.md, GATES.md, manifest.json, each of the five per-page STATUS.md files, and handoffs/OUTGOING_SIGNOFF.md when available. Then read the actual working tree status, Git worktrees and any existing agent rules or coordination files. Do NOT assume other agents' changes have been committed or can be discarded.

Workstreams and boundaries:
- New homepage/leaderboard — currently another GPT session's active work. Preserve current state; avoid modifying it without that owner and a precise request. Must verify user-selected HITL/Hybrid/Autonomous filter, initial Hybrid view, reliable signed-up but unranked roster/privacy and metrics before future release.
- Text/Field/Articles/Blog/Wiki — THIS GPT/editorial thread already integrated shared nav. Next task here is to establish consistent stage/page formatting: centered content, spacing, headings, document structure, right inspector/citations. Do not redesign nav or invent content.
- Hall — rough page; final graphics/layout edits next, approved layout JSON located in release-staging/hall/.
- Compare — rough page; final layout/metric/scoring interactions next, approved layout JSON in release-staging/compare/.
- User Profile V2 — new seven-tab implementation is already built locally. Seven modules in components/profile-v2/, changed app/user/[codename]/ProfileBody.tsx and page.tsx; 17 review mock HTML files archived from _workspace/profile-mocks. Snapshot and patch are under release-staging/user-profile/. Inspect actual modules, validate authenticated/private vs public claims, pending states, mobile, links, performance, and fix watchCount=0 placeholder only when explicitly assigned. The earlier planning document is not proof of current completion or final owner approval.

Current CI blocker: 40 tracked-but-ignored _workspace files cause PR #239 hygiene check failure. Staged layout JSON copies exist in release-staging/hall and /compare. Do not physically delete files or untrack without owner-approved scope. See VERIFICATION_2026-10-11.md.

Release flags are all NO. Do not merge, push, deploy, alter schema, remove credentials, or run destructive Git commands on this shared worktree.

Use MCP intentionally:
- Remote Desktop Commander MCP on the authorized Mac: list_devices, start_process, read_process_output, read_file. This is the canonical local filesystem/terminal tool; no hidden alternate repo checkout.
- GitHub MCP: list_pull_request_reviews, fetch_commit_workflow_runs, compare_commits for PR #239; alternatively gh pr view via the local authenticated CLI. Read-only unless owner explicitly asks for writes.
- Devin CLI is locally installed/authenticated: check command -v devin and devin --help, devin list --format json, devin --prompt-file. Before future signoffs use devin --export with verified syntax.
- Playwright via the Mac dev repo to validate actual site routes/DOM/screenshots.
- Supabase MCP only for minimal read-only aggregate or provenance checks when required; no SQL write, no secrets, no private logs.

Required order of operations:
1. Identify scope, owner, latest source SHA, current changes and any conflicts.
2. Verify stored snapshots and source hashes; do not apply older patch/zip without diffing against current code.
3. Confirm the previous agent signed off or clearly mark missing signoff.
4. Surface a concise priority list and blockers to the owner. Ask for a narrow next instruction if ambiguous.
5. Do not autonomously run another full redesign or publish. Build only when assigned.
6. Before closing a session, write a truthful outgoing handoff and leave source/receipts in durable staging.

Goal: bring the existing site home with independent checks and explicit owner decisions, not loop forever around mockups or recreate prior engineering.
