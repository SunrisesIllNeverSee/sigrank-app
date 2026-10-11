# Release status board / owner control

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
