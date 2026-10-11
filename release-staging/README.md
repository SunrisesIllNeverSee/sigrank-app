# SignalAF release staging / organized custody

Created: 2026-10-11T07:13:52+00:00 UTC | branch: feat/live-board-2b | source HEAD: 09a45dc.

This directory is the single staging INDEX and point-in-time candidate vault, not a second source code tree or a deployment target. Production code remains in app/, components/ and lib/. Candidate archives are preservation snapshots, not automatic merge material. No code is to be overwritten from them without comparing against later work.

Important: _workspace is gitignored and deletable. This NEW release-staging directory is NOT ignored and should be preserved as a separate documentation/checkpoint commit after owner approval, without committing other agents' mixed work. Currently no commit or push has been performed.

## Workstream directories
- leaderboard-home — new homepage/board; active other GPT ownership.
- text-pages — editorial navigation done; uniform page structure next, managed by current GPT.
- hall — roughed layout; final edits pending.
- compare — roughed layout; final edits pending.
- user-profile — seven-tab V2 source and HTML mock snapshots, pending validation.
- handoffs — outgoing signoff and new-agent instructions.
- artifacts — reserved for signed, verified evidence.

Review STATUS_BOARD.md, then GATES.md, then workstream status files. Compare manifest hashes before restoring candidate snapshots. Never claim the whole website is release-ready merely because a route responds.

Current local Next server: http://127.0.0.1:3210/ . Old preview proxy 61173 is down.
Existing PR #239 targets main, and is OPEN. No merge or deploy approval.
