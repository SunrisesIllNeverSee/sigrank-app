# Site review editor and release capsule

Review UI: http://localhost:3230/editor/review (development only, production returns 404).

## How to review
1. Find a page in the scrollable miniature previews, or enter a custom same-origin path.
2. Browse mode follows links normally; Annotate mode intercepts a click and selects an element without activating it.
3. Enter an instruction and Save edit. Notes record page, target text, selector, viewport and date. Mark Open/Fixed as work is verified.
4. Export checklist (Markdown) or JSON regularly. Notes stay in this browser/local origin; they do not sync to GitHub or Safari from another browser.
5. Checklist includes resolution, code location/commit and verification fields for the implementing agent.

Inventory includes concrete app pages, Markdown blog pages, representative board/profile routes; other parameter combinations use Custom page path. It is an inventory, not proof that every route is functional. Thumbnails only mount near the visible list so hundreds of page apps do not run at once. Main review iframe uses the current browser session; thumbnails cannot accept input.

Acceptance: selected a sign-in control in Annotate mode without triggering OAuth; saved note survived reload; editing then canceling preserved the existing note; exported checklist successfully to Downloads. Types, scoped lint and canonical 11/11 passed.

## Capsule / fresh review workspace
Capsule directory: ../SignalAF-Redesign-Capsule-2026-10-13 (source archive, Git bundle, hash manifest, branch receipts).
Fresh checkout: ../signalaf-postlaunch-review-2026-10-13 on review/postlaunch-2026-10-13. Does not replace the current localhost:3230 checkout. Runtime dependencies and local secrets are not archived; configure those locally when running the fresh checkout.

Production release status: the remote main and integration/site-a315435 branches diverged when checked (25 main-only, 68 staging-only commits before the editor commit). Do not force-push or substitute a snapshot for main. Reconcile main changes in a release branch and pass CI before publishing. The exact deployed Vercel alias was not verified by this editor work. No production deploy performed.
