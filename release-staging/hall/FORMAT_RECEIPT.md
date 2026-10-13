# Hall formatting checkpoint — October 12, 2026

Hall-only visual changes: solid card borders, consistent heading inset, subtle ranked-row separators, compact row rhythm and 21px clearance between metric values and each card edge. Shared Compare styles and scoring/data queries unchanged.

Hall and board both import getLeaderboard from lib/board. Hall displays claimed non-retired operators and uses cached window snapshots; it is not an instant push feed.

Verified: TypeScript, scoped ESLint, canonical 11/11, production build, Metrics/Tokens switching in browser, 21px inset and no horizontal card overflow in Tokens, staged screenshot. Local development preview restarted to recover stale client assets after build verification.

Publish gate: integration branch diverged from origin during concurrent work (origin's staging workflow commit is absent from local history). Preserve all active files; reconcile histories before publishing this checkpoint. Never force-push over the remote staging receipt.
