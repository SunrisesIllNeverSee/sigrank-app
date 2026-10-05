# SEARCH-RECOVERY-01 — Operator Link-Graph Audit (Addendum §D)

**Audit date:** 2026-10-05 · **Scope:** every code path that emits a `/user/<codename>` URL (HTML links, machine-readable JSON-LD, share surfaces, data APIs).

**Rule established (per addendum):** *Search-authority surfaces and machine-readable lists preferentially describe the live/indexable operator population.* Seed/unclaimed profiles may remain linked for legitimate product UX **only** as `noindex,follow` targets, and the reason must be documented. No JSON-LD may represent dead/nonexistent profile URLs.

## Emitter inventory

| Surface | Emitter | Population source | Unclaimed/seed rows possible? | Target indexable? | Machine-readable? |
|---|---|---|---|---|---|
| `/board/[window]` table | `LeaderboardTable` `/user/${codename}` (3 row variants) | `getLeaderboard({claimedOnly:true})` — board pages server-filter | **No** | Yes — board rows are claimed; see edge case ↓ | — |
| `/board/[window]` JSON-LD | `leaderboardItemList()` in `lib/jsonld.ts` | same `claimedOnly` feed (`jsonLdEntries`) | **No** | Yes | **Yes — ItemList of `/user/` URLs** |
| `/hall` — all-time scope | `HallClient` / `HallContentClient` href | `getLeaderboard` → server filter `claimed && !retired` | **No** | Yes | No (breadcrumb + FAQ only) |
| `/hall` — 7d/30d/90d scopes | same emitters | `getLeaderboard({window, windowFilter:true, limit:50})` — **no claimed filter** | **YES ⚠** | Possibly `noindex` targets | No |
| `MetricTopTen` (Hall boards) | `HallSubmissionRow` href | rows from `windowsData` incl. `isPlaceholder` | **No** ✓ — placeholder rows emit no `href` (fixed in closeout) | Real rows only → indexable targets possible | No |
| Footer (sitewide) | static link `/user/the-field` | hardcoded | Yes — special pseudo-operator | `noindex,follow` ✓ (verified live) | No |
| `/user/[codename]` self | `operatorProfile` JSON-LD `path` | the profile itself | n/a | Self-canonical | Yes — ProfilePage on its own page |
| Share surfaces | `SplitFlapCard`, `ProfileShareCard`, `/api/outreach-card` | the carded operator | n/a | Self | No (images/text) |
| `/user` index | `redirect → /user/the-field` | hardcoded | — | noindex target | No |
| `/compare` | `getOperator("the-field")` selection | single special op | Yes | noindex target | No |
| MCP plugin data | `lib/mcp/plugin/service.ts` `profile_url` | leaderboard data layer | Only claimed rows | n/a (data API, not crawlable HTML) | n/a |
| `MiniBoard` | — | **archived** (not rendered; `Draft2BoardsGrid` superseded by `Draft2LiveActivity`) | — | — | — |

## Edge case — board rows vs `index,follow`

Board surfaces filter `claimed`, but the index contract is `claimed ∧ ¬retired ∧ ¬private ∧ ≥1 snapshot`. A **claimed + private** operator can appear on a board while its profile serves `noindex`. This is per-spec (robots governs indexing, links remain `follow`), but worth noting: sitemap membership and link-graph membership legitimately differ here.

## Findings — status

1. **Hall non-all-time windows** (`windowsData`/`windowsDataAll` for 7d/30d/90d) carry `liveRows` with no `claimed` filter — the exact gap the addendum flagged. Rows are recency-filtered (`windowFilter: true`), which incidentally excludes static seeds, but nothing enforces `claimed` — a live unclaimed submission appears and its `/user/` href points at a `noindex` target. **Deferred to Phase 2** (nav/link-graph work is frozen under §L; documented here and in NAV-DESIGN.md). Fix: apply the same `claimed && !retired` filter (or the shared indexing policy) before client serialization.
2. **`MetricTopTen` placeholder rows — FIXED in this closeout.** `isPlaceholder` rows render the display name without `href`, so no synthetic codename can mint a dead `/user/<codename>` link. Real rows keep the profile link.
3. **`/user/the-field` sitewide footer link** — retained deliberately: The Field is the canonical aggregate persona used by `/compare`; page is `noindex,follow`. Documented reason; keep.
4. **JSON-LD hygiene ✓** — `leaderboardItemList` draws from the claimed-only feed; `operatorProfile` emits only the profile's own URL; no dead operator URLs found in machine-readable output. Organization `logo` present (`/og-v2.png`, HTTP 200 verified).

## Non-emitters checked

`/field` (aggregate analytics — no per-operator links), homepage (`Draft2LiveActivity` — no operator links; MiniBoards archived), `lib/mcp/plugin/service.ts` (data API — `profile_url` field, not crawlable HTML), `outreach-card` (image text only).
