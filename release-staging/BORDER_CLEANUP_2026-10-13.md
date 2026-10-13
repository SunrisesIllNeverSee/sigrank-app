# Shared border cleanup — 2026-10-13

Owner screenshot showed thick broken outlines on OAuth buttons.

## Cause and changes
The terminal theme globally applied dashed borders to standard border utilities. The workspace button reset used border:none, which reset border width to medium and border color to currentColor. The global dashed style then exposed 3px bright outlines.

- Standard terminal surface borders now solid; explicit border-dashed placeholders remain intentional.
- Workspace button reset clears width without resetting style/color.
- Explicit bordered buttons receive a 1px outline.
- Standard border utilities use the active workspace line palette.
- No auth handlers, routes, score logic, chart-series dashes, or live production changes.

## Verified
Browser sign-in: GitHub, X and email input all 1px solid rgb(38,54,28), formerly OAuth 3px dashed rgb(233,243,223). Visual preview inspected.
Share gallery controls: Share, Preview and Download outlines 1px solid; cards inspected.
Profile badge route: shared bordered control remains 1px solid.
TypeScript passed; canonical 11/11 passed; whitespace check passed.
