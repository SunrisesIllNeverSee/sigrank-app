# GPT leaderboard lane review — October 12, 2026

## Verdict

Reported code is present in the integration worktree and compatible with the local profile/badge work. No implementation defect was identified in the reviewed scope. Real owner watch/unwatch persistence remains an acceptance check; do not mark it verified from mock-session tests.

## Baseline

- Worktree: `/Users/dericmchenry/Developer/active/SigRank-repos/signalaf-integration-a315435`
- Branch: `integration/site-a315435`
- HEAD and pushed branch: `a37a866443033424040db4e631b4485f016d45d8`.
- GPT report checkpoint `e28490c` is included; a37a866 adds the applied preference migration receipt.
- Existing dirty profile/gallery/artwork/session edits and shared screenshots preserved. No production code was changed by this review.

## Reverified

- WebKit toolbar at 1680/1440/1280/1152/1100/900/750px: nine controls, 0px center-Y spread, 0px gap spread, no document overflow. At 1280px and below the toolbar itself scrolls. This is controlled Playwright WebKit viewport testing, not native Safari browser zoom testing.
- Scale V sorting: descending values 10.73, 10.72, 10.71, 10.63, 10.51.
- Chromium toolbar/export suite: 19/19 checks, including Raw-only Platform column, both-mode Platform filter, filtered CSV, PNG download, and Share closing after screenshot.
- Separate full CSV export: 22 rows with exact numeric totals; all 22 Scale V values match log10(total_tokens_exact) within two-decimal rounding.
- Wiki definition route HTTP 200.
- Owner default, other-operator compare URL, and MY PROFILE restoration passed in WebKit with controlled auth/session responses; no live watch writes or user impersonation.
- Owner default URL `/user/signal-92b4f9f485`; COMPARE absent on own card, present with correct a/b operands after selecting another operator.
- Owner/watchlist and saved Pixel session test suites: 9/9 passed.
- Anonymous `/api/v1/me/watches` returned HTTP 401.
- Actual Supabase operator_watches policies verified: authenticated SELECT/DELETE use watcher_user_id=auth.uid(); INSERT checks the same condition. API additionally scopes the lookup to the resolved user and returns private,no-store headers. No watch data was read from another user's account.

## Remaining checks / reconciliation

- Real signed-in owner: WATCH another operator, reload, confirm WATCHING and their My Watchlist entry; UNWATCH, reload, confirm removal. This was not performed automatically.
- Existing simulated heatmap is intentional per owner clarification. Do not remove it as a bug or treat its cells/streaks as observed submission evidence. Actual daily wiring remains future work.
- The API-versus-combined-field rank semantics issue documented in the profile review remains separate from this toolbar/selection review.
- Local badge/gallery/Settings/navigation edits are uncommitted and therefore not included in the GitHub preview of a37a866. The localhost:3230 server includes them. Do not describe GitHub preview and local staging as byte-identical until the scoped application changes are committed and pushed.

No code fixes, merges, pushes, database mutations, or production deployment were performed in this review.
