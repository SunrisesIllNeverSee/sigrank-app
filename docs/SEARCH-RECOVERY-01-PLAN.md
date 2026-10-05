# SEARCH-RECOVERY Phase 1 — Implementation Plan

**Project:** SEARCH-RECOVERY · **Branch:** `fix/search-recovery-01-index-surface`
**Scope:** Operator search surface + sitemap authority only. No page content,
titles, H1s, canonical URLs, or product behavior changed. Seed/unclaimed
profiles remain live 200 pages; they are excluded from the index, not deleted.

## The indexing contract

A profile is search-indexable iff:

```text
claimed === true
AND status !== "retired"
AND profile_visibility !== "private"
AND operator has at least one metric snapshot
```

`verification_status === "verified"` is deliberately NOT required — at
implementation time zero claimed operators were verified, so requiring it
would have noindexed the entire eligible population.

## Files changed

| File | Change |
|---|---|
| `lib/seo/indexing-policy.ts` | NEW — shared predicate `isIndexableOperatorProfile`, plus `operatorProfileRobots` (page metadata) and `operatorSitemapEntry` (sitemap entry builder). Import-free so `node --test` can import the real module. |
| `lib/board/queries.ts` | NEW `getIndexableOperatorRows()` + `IndexableOperatorRow`. Two bounded queries: claimed operators from `operators_public`, then `operator_id`-only `metric_snapshots` existence scan restricted to those ids. |
| `lib/board/cached.ts` | `unstable_cache` wrapper, `revalidate: 300`, tags `["board","operator"]` (busted by `revalidateTouchedWindows` on every verified submission). |
| `lib/board/index.ts` | Barrel re-export of cached reader + row type. |
| `app/user/[codename]/page.tsx` | `generateMetadata` now returns `robots: operatorProfileRobots(row.operator, !row.pending)`. `!pending` == "has ≥1 snapshot" (pending is set exactly when `operatorTotalCollapse` finds no snapshot). |
| `app/sitemap.ts` | Operator entries sourced from `getIndexableOperatorRows()` + filtered through `operatorSitemapEntry`; the `/api/v1/leaderboard?limit=500` HTTP fetch is removed. `STATIC_LAST_MODIFIED` fallback and generation-time `lastModified: now` removed — entries emit `lastmod` only when the route declares a real modification date. |
| `__tests__/seo/indexing-policy.test.mjs` | NEW — 18 contract tests: policy matrix, sitemap contract, robots↔sitemap agreement, lastmod absence, and source-level invariants (no `/api/v1/leaderboard` in sitemap, no `STATIC_LAST_MODIFIED`, both consumers reference the shared policy). |

## Design decisions vs. the brief's sketch

- **`lib/seo/indexing-policy.ts` as written** — `lib/seo.ts` is a file; the
  policy lives in a new `lib/seo/` directory. Both resolve unambiguously
  (`@/lib/seo` → file wins; `@/lib/seo/indexing-policy` → the module).
- **Sitemap source is `getIndexableOperatorRows`, not `getLeaderboard`** —
  the doc allowed implementation latitude here and the difference matters:
  `getLeaderboard` (a) scans the whole `metric_snapshots` table (3+ paginated
  round trips per render) and (b) drops ghost rows (null/zero input/output),
  which diverges from the profile page's `pending` signal ("has any snapshot
  at all"). The dedicated reader is ~2 bounded queries wrapped in
  `unstable_cache` and matches `pending` exactly — the mandatory invariant
  (sitemap iff index,follow) holds structurally, not approximately.
- **Retired operators** — unchanged behavior: `redirect("/leaderboard")` fires
  before metadata, so they never serve a robots directive (they 307, not
  200+noindex). The policy's `status !== "retired"` clause governs sitemap
  exclusion.
- **Static sitemap untouched** — 208 static routes remain listed (Phase 2
  classifies them; not in scope).

## Expected population (measured pre-change)

`operators_public`: 1,691 total / 52 claimed / 1,639 unclaimed.
Indexable under the policy: **22** (claimed ∧ ¬retired ∧ ¬private ∧
≥1 snapshot). Live verification query and results are in
`SEARCH-RECOVERY-01-EVIDENCE.md`.
