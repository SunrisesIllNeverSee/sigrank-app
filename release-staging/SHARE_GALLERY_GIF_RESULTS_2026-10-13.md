# Share gallery, GIF and account shell — 2026-10-13

Preview: localhost:3230. Branch: integration/site-a315435. Local uncommitted changes; no production deployment.

## Completed

- Existing /s/<codename> gallery converted to WorkspaceShell columns. Original signal/outreach/interactive card surfaces and canonical/social metadata retained.
- Holocard entry reuses PassportCard and the profile's cached field, trophy, workflow rank and earned-mark helpers. Public saved Pixel/secondary choices read with one operator-id-scoped query; private profiles do not expose a holocard here.
- Share card field reads use the existing getLeaderboard memo key and cached Hall read; no new raw corpus queries or per-render uncached population scans.
- Download GIF added below the profile holocard and gallery entry. Local canvas captures the card, renders foil-motion frames and writes an optimized-palette GIF89a with an infinite loop. No dependencies or uploads added. PNG controls preserved.
- General screen-capture section links Four Degrees, leaderboard, Compare / VS and user profile to their capture controls. Profile left sidebar now contains Screen Capture and a Shareables Gallery link. It exports the current stage viewport and active tab.
- /login and /me/edit converted to the same column shell. Existing verified-owner access checks and callback logic retained. GitHub authorize request intercepted in WebKit: redirect_to = http://localhost:3230/auth/callback?next=%2Fme. No real OAuth approval or email sent.

## Verification

- WebKit gallery shell and actual GIF download succeeded.
- GIF decoded independently with ffmpeg/ffprobe: 324×484, 24 frames, 4.08 seconds. First and middle frames visually inspected; moving foil differs.
- Actual profile screen-capture PNG downloaded; current badges view retained.
- /login renders the workspace shell and all three sign-in options.
- TypeScript and touched-file lint clean; existing share page img-element lint warning remains. Canonical scoring checks 11/11; diff whitespace clean.

## Follow-up observation

The original flagship/OG card still uses getOperator's rank, whereas the holocard follows the loaded board row rank (as the profile does). Existing original cards were preserved during this layout task; reconcile that pre-existing rank discrepancy before release.
