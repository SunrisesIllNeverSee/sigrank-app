# Release status board / owner control

## Current whole-site preview — October 12, 2026

This current-state receipt supersedes older audit rows below. Preview :3230 is now a Next development server in signalaf-integration-a315435, not the earlier production build. The local branch is at 6d30d9e; origin/integration/site-a315435 is at f0a39eb (nine local commits ahead at this check).

| Area | Current source / visible preview | Custody |
|---|---|---|
| Homepage / leaderboard | Latest committed board work and shared account/navigation at / | Committed locally |
| Compare | 5b7172e operator radars and vertical ledger; newer live-operator/token-longevity additions visible at /compare | Newer additions remain uncommitted and owned by active Compare workstream |
| SigRank / Field / Articles / Blog / Wiki | 410f4ee shared editorial layout and Back/Home navigation; 6d30d9e terminal hero sizing; all five routes verified in browser | Committed locally |
| Hall | Shared workspace at /hall, Back/Home navigation present | Existing staged implementation; no new design acceptance implied |
| Profile | Four-column shared shell at /user/signal-92b4f9f485 | Existing staged implementation; mock parity/owner acceptance gates remain |

All eight page families were loaded without an application-error page. This is a preview synchronization check, not whole-site release signoff or approval of uncommitted Compare changes. Other agents' files were not changed, committed, or discarded. No push, merge, or deployment performed by this audit.


Updated October 12, 2026. **Review candidate; not merged, pushed or deployed by this session.**

## Current profile checkpoints

| Location | Saved state | Commit | Preview |
|---|---|---|---|
| Original shared source: sigrank-app-live-board | V2 route + seven components; R1–R4 archives and original hash manifest committed | ba29f02 | :3210, shared standalone route |
| Integration: signalaf-integration-a315435 | Four-column profile shell and synchronized navigation | 9deca2a | :3230/user/signal-92b4f9f485 |
| Integration latest candidate import | R3/R4 preserved; updated tab links and heading merged; newer shell designs preserved | 37d5f7e | :3230/user/signal-92b4f9f485 |

Verification: shared source TypeScript, scoped ESLint, canonical tests 11/11; integration TypeScript, scoped ESLint, canonical tests 11/11, production build and public-tab/sidebar browser checks passed. R4 SHA256 verified against the original manifest and all 28 current shared candidate files.

Open gates: inspector chart/design parity, full owner/private/pending and empty-data regression acceptance, watch-count placeholder, owner release approval. R4's standalone route is preserved as source history; the staged preview keeps the owner-requested shell.

Continue current integrated redesign work in `SIGNALAF-Website-Redesign/01-Staged-Website`. Original shared editorial changes remain owned by their existing workstream.

## Launch navigation scope — October 12, 2026

- Operators: Leaderboard, Profile, Compare, Hall.
- Writings: SigRank (§), Field, Articles, Blog, Wiki.
- Coming soon: Hacks, VS, Teams — gray disabled icons, no destinations or popovers.
- Homepage and shared workspace use the same grouped rail. Profile resolves through /me to the signed-in operator; existing login flow applies.
- Profile and Articles have pixel icons; leaderboard uses descending multicolor bars. Existing scoring, datasets and page bodies unchanged.
- Updated review mock mirrors these groups; current live preview remains :3230.

## Earlier audit snapshot — October 11 (historical)

Checkpoint 2026-10-11T07:13:52+00:00 UTC; HEAD 09a45dc; branch feat/live-board-2b; PR #239 OPEN.

| Page / workstream | Engineering state | Design state | Next gate | Release-ready | Deployed |
|---|---|---|---|---|---|
| New homepage + leaderboard | Active edits by another GPT | In owner review | board evidence, consent, filters, regression, final owner signoff | NO | NO |
| Field / Articles / Blog / Wiki / text | Expandable nav integrated locally, working patch and ZIP saved | Navigation approved | standard centered/consistent editorial stage and typography | NO | NO |
| Hall of Signal | Existing rough page + layout JSON | Initial reviewed layout | final owner design edits, live data/UX audit | NO | NO |
| Compare | Existing rough page + layout JSON | Initial reviewed layout | final page edits, compare logic and UX audit | NO | NO |
| User Profile V2 | Seven new components + route edits, source preserved | Mock set present; release approval unverified | fix watch count placeholder, security/privacy, tab tests, owner signoff | NO | NO |

Local smoke routes responding 200: /, /board/all, /fieldhub, /field, /articles, /blog, /wiki, /hall, /compare, /user/the-field. Route 200 is not release verification. **CI BLOCKER:** PR #239 hygiene check fails because 40 files in _workspace/ are tracked despite ignore rules. See VERIFICATION_2026-10-11.md.

The other GPT owns leaderboard/new-homepage changes. The editorial GPT owns text-page formatting next. The agent may sign out only after it preserves its exact unfinished scope and the context export. No other developer's changed files should be bundled into an opportunistic commit.

Update each page status only with a dated, reproducible test result, commit SHA, owner approval, deployment target and rollback note.


### Account button audit — October 12, 2026

Shared staged rail now includes profile/edit/setup, settings, devices & keys, privacy/data, appearance and sign-out options appropriate to account state. Keyboard/outside closing, error handling and session refresh corrected. Customized mock button opens links to live account controls rather than impersonating a session. Production checks passed; owner session was not signed out or otherwise altered. This completes the menu audit, not whole-site launch acceptance. See INTEGRATION_MANIFEST.md for scope and remaining frame migration.
