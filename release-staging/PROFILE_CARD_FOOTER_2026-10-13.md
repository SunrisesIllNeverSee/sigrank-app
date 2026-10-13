# Profile navigation and holocard footer — 2026-10-13

- Aligned owner Settings with profile tabs and Share Gallery using shared link spacing and zero child bottom margins.
- Mirrored the purple passport card top cuts at the bottom on both shell and inner card.
- Added a full-width black footer reading npx sigrank; retained card height and shine.
- Reserved footer space and tightened avatar/spacing so platform, medals and all six stats remain visible.
- Shared PassportCard also renders these changes in the share gallery and its card captures.

Verification: signed-in native Safari profile visually confirmed owner Settings alignment, matching bottom cuts and black footer after reload from origin. Browser geometry confirmed platform/medals end above the footer. TypeScript and scoped lint passed; canonical 11/11 passed. No production deploy.
