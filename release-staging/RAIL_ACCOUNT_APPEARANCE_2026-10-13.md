# Rail and account appearance cleanup — 2026-10-13

Stage: signalaf-integration-a315435, integration/site-a315435, localhost:3230.

## Owner-requested changes
- Removed the top brand/home button from both workspace shells; page navigation starts with Leaderboard.
- Removed Back/Home controls from the narrow icon rail and wide left sidebar in both shells.
- Moved icon-style selection into the bottom-left account menu beside Theme.
- Preserved account actions, sign-in/out, privacy, notifications and sidebar reopening controls.
- Icon style persists across navigation and tabs through a shared external-store hook; server rendering retains a stable pixel default.

## Verification
- TypeScript: passed.
- Scoped ESLint: passed.
- Canonical tests: 11/11 passed.
- Diff whitespace check: passed.
- Browser: inspected leaderboard and SigRank rails, confirmed adjacent 88px selects at identical vertical position, selected glyph on the leaderboard and verified it persisted on SigRank. Theme selection updated the root theme. Restored pixel/green after verification.
- Preview-only Next.js development overlay overlaps the account button in the test browser; keyboard activation verified the actual account menu without changing development configuration.

Production was not changed.
