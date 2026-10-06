# SEARCH-RECOVERY-01 — Structured Data Audit (Addendum §G)

**Audited 2026-10-05** — bounded review of emitted JSON-LD on core templates. No schema expansion performed (descriptive metadata, not a ranking hack).

## Emitted blocks verified live

| Page | Blocks | Result |
|---|---|---|
| `/board/all` | Organization · WebSite · Dataset · ItemList · FAQPage | ✅ all well-formed; **Organization `logo` present** (`/og-v2.png`, HTTP 200) — the flagged defect is already absent in live output |
| `/` | Organization · WebSite · SoftwareApplication · Dataset · FAQPage | ✅ single coherent site identity (`@id` consistent) |
| `/user/<seed>` (noindex) | Organization · WebSite · ProfilePage (self URL) | ✅ self-referencing; on a `noindex` page it's inert for search |

## Checks

- **Dead operator URLs in JSON-LD:** none — `leaderboardItemList` draws from the `claimedOnly` feed (same population as the rendered table), `operatorProfile` emits only the profile's own URL.
- **Stale SigArena/signaaf references:** none — grep of `lib/jsonld.ts` + all `app/`/`components/` emits zero legacy-host URLs.
- **Duplicate schema blocks:** none observed; each page emits one block per entity type.
- **`Organization.logo`:** present sitewide via `app/layout.tsx` → `organization()` → `${SITE_ORIGIN}/og-v2.png` (200, public).
- **FAQ markup:** `faqPage` exists on board pages — content answers real on-page questions; no new FAQ-for-SEO added (and none should be).

## Residual notes (non-blocking)

- `ItemList` entries on `/board/*` link claimed-but-private operators too (population is `claimedOnly`, not `profile_visibility`-filtered) — acceptable: `follow` semantics keep links crawlable; the private profile's own `noindex` governs indexing.
- `Dataset.dateModified` on board pages uses request time (`new Date().toISOString()` at render) — the same synthetic-freshness pattern Phase 1 removed from the sitemap. Worth a real "dataset regenerated at" timestamp if a trustworthy source exists; not a search-graph blocker since Dataset isn't a ranking surface.

**Verdict:** core structured data is coherent — one entity identity, valid required fields, no dead/stale URLs. The addendum's flagged `logo` defect does not reproduce on live output (may have been repaired in a prior commit or observed on a stale render).
