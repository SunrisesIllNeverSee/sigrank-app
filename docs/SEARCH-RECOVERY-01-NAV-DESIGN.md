# SEARCH-RECOVERY-01 §I — Interior Navigation Design

**Status:** design manifest drafted; implementation deferred to the
post-rollout evidence window (§L freeze). This document is the agreed
target-state contract so the work is reviewable when unfrozen.

## Goal (per addendum)

Interior navigation becomes hierarchical: `page → parent hub → closely
related supporting pages`. Link count itself is not a penalty; topical
relationships must be legible. The broad homepage discovery directory is
kept — it is the site's own sitemap-equivalent surface for users.

## Hub topology (derived from config/search-index-policy.ts families)

| Family | Parent hub | Child pages |
|---|---|---|
| Metrics | `/metrics` | `/metrics/*` (each metric leaf links up to `/metrics` + sibling metrics it composes with) |
| Wiki | `/wiki` | `/wiki/*` (each entry links to `/wiki` + the metric/methodology pages it documents) |
| Tools | `/tools` | `/tools/*` (each tool page links to `/tools` + its `/vs/*` or `/metrics/*` counterpart where one exists) |
| Comparisons | `/vs` index | `/vs/*` (each comparison links to the `/vs` hub + adjacent comparisons) |
| Alternatives | `/alternatives` | `/alternatives/*` |
| Guides | `/guides` | `/guides/*` |
| Board windows | `/board/all` | `/board/7d`, `/board/30d`, `/board/90d` cross-link each other |
| Extensions | `/extensions` | `/extensions/*` |

Rules when implemented:

- Every leaf carries an up-link to its parent hub (breadcrumb or
  "Back to X" affordance) — currently many leaf pages only reach the hub
  via the global footer.
- Each leaf carries 2–4 lateral links to *closely related* siblings only —
  not the full family listing (the hub owns exhaustive listing).
- Hub pages (`/metrics`, `/wiki`, `/tools`, `/vs`) enumerate their families
  completely — they are the crawl-dense layer.
- Homepage discovery directory remains as-is (kept per spec).

## Operator/profile link-graph architecture (from §D audit)

Established rule: **search-authority surfaces and machine-readable lists
preferentially describe the live/indexable operator population.**

- Board tables (`/board/*`) — link `/user/<codename>` from the claimed
  population only. ✓ already correct (`claimedOnly`).
- Hall top-ten cards (`MetricTopTen`) — link only non-placeholder rows.
  ✓ fixed in this PR (placeholder rows render the name without href).
- Hall non-all-time windows — can display unclaimed rows; profile links to
  them stay `noindex,follow`-reachable for UX (documented decision in
  LINK-GRAPH.md). Phase-2 review: consider a `claimed` server filter or a
  claim-CTA affordance rather than links to seed profiles.
- JSON-LD emitters — must never reference profile URLs that don't resolve.
  `leaderboardItemList` uses claimed rows. ✓
- Related-operator links / comparison selectors — reviewed in
  LINK-GRAPH.md; no dead-URL emitters found.

## Footer/global architecture

Global footer groups links under the same hub taxonomy (Board / Metrics /
Wiki / Tools / Compare) rather than a flat link inventory — footer item
count is not itself a problem; the grouping is what makes it legible.

## Freeze compliance

No nav markup changes in this PR beyond the `MetricTopTen` dead-link fix
(a production correctness fix, allowed under §L). The hierarchy work is a
design artifact pending the spam-rollout completion + evidence window.
