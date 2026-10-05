# SEARCH-RECOVERY Phase 1 — Evidence Record

**Branch:** `fix/search-recovery-01-index-surface`
**Date:** 2026-10-05 · **Repo:** `SunrisesIllNeverSee/sigrank-app`

## Pre-change verification (independent measurement)

### Code state confirmed

- `app/sitemap.ts` sourced operators via
  `fetch(${SITE_ORIGIN}/api/v1/leaderboard?limit=500)` — a rate-gated,
  30d-windowed public API. Observed prod sitemap: **4** `/user/` URLs, all
  `signal-<hash>`/`the-field` unclaimed codenames — the sitemap advertised the
  wrong population entirely.
- `STATIC_LAST_MODIFIED = 2026-08-14T09:50:00Z` applied to ~200 static routes;
  `lastModified: now` (generation time) on board + operator entries.
- `app/user/[codename]` emitted no `robots` directive — every valid profile
  was index,follow including ~1,639 unclaimed seed profiles.

### Database counts (live, via Supabase)

```sql
select count(*) total,
       count(*) filter (where claimed) claimed,
       count(*) filter (where not claimed) unclaimed,
       count(*) filter (where claimed
                        and status is distinct from 'retired'
                        and profile_visibility is distinct from 'private'
                        and exists (select 1 from metric_snapshots ms
                                    where ms.operator_id = o.operator_id)) indexable,
       count(*) filter (where claimed and verification_status='verified') claimed_verified
from operators_public o;
```

| Metric | Count |
|---|---|
| total operators | 1,691 |
| claimed | 52 |
| unclaimed | 1,639 |
| **indexable under policy** | **22** |
| claimed ∧ verified | **0** ← why `verified` is excluded from the contract |

### Fixtures

| Codename | claimed | status | visibility | snapshots | Expected |
|---|---|---|---|---|---|
| `glnarayanan` | true | active | public | 12 | `index,follow`, in sitemap |
| `grenadeoftacoss` | false | active | public | 2 | `noindex,follow`, absent |

### GSC baseline

`gsc.mjs inspect https://signalaf.com/methodology` →
`verdict=NEUTRAL coverage="Crawled - currently not indexed" lastCrawl=2026-08-04`
(2+ months stale — consistent with the August site-level reclassification).

## Verification suite results

| Command | Result |
|---|---|
| `bunx tsc --noEmit` | 0 errors |
| `bun run test:canonical` | 11/11 pass (MOSES Υ 18436.98 invariant intact) |
| `bun run test` (node --test) | 652 pass / 0 fail / 4 skipped — includes the 18 new contract tests |
| `bun run test:ui` (vitest) | 125/125 pass (12 files) |
| `bun run lint` | 0 errors, 72 warnings (all pre-existing; page.tsx warnings on `Stat`/`telemetry`/`ranked` predate this change) |
| `npm run build` | **passes** (Next 16.3.8/Turbopack; `/sitemap.xml` ○ prerendered 5m ISR, `/user/[codename]` ● on-demand ISR) — Node 25 caveat no longer applies post-Next-16 |

## Preview smoke tests (VERIFIED — Vercel preview deployment)

Deployment: `sigrank-app-git-fix-search-recovery-01-index-surface-burnmydays.vercel.app`
(fetched via Vercel deployment-protection bypass, 2026-10-05).

| Check | Result |
|---|---|
| `GET /user/grenadeoftacoss` (unclaimed seed) | **200** · `robots: noindex, follow` · canonical self ✓ |
| `GET /user/glnarayanan` (claimed/active/public, 12 snapshots) | **200** · `robots: index, follow` · canonical self ✓ |
| `GET /sitemap.xml` | valid XML · **234 URLs** = 208 static + 4 board + 22 operators ✓ |
| `/user/` URLs in sitemap | **22** — exactly the policy-eligible population (claimed ∧ ¬retired ∧ ¬private ∧ ≥1 snapshot) |
| `operator-<hash>` anonymized codenames in sitemap | **0** ✓ |
| `<lastmod>` on operator/board entries | none — only 2 `<lastmod>` in the whole file (the two routes declaring real dates) ✓ |
| Generation-time `lastModified` | absent — no synthetic freshness ✓ |

**Observation (not a defect):** 19 of the 22 indexable operators have
auto-generated `signal-<hash>` codenames — they are *claimed* live accounts
that never customized their codename, distinct from the anonymized
`operator-<hash>` seed population (which is fully excluded). If claimed-ops
with hash codenames shouldn't rank either, that's a policy refinement for
owner review — current behavior matches the approved contract.

Merge gate: metadata and sitemap agree on every fixture — verified on the
preview deployment and enforced structurally by the shared predicate.

## Review round 1 — fixes applied

1. **Stale robots/sitemap divergence on flag changes (blocking).**
   `POST /api/v1/claim` flips `claimed` and `POST /api/v1/profile` can flip
   `profile_visibility`, but neither invalidated caches — the ISR profile page
   (`revalidate = 21600`) could serve `noindex` for up to 6h while the sitemap
   (300s data cache) already advertised the URL: "Submitted URL marked
   'noindex'" on a sitemap we are rebuilding trust in. Fix: new
   `revalidateOperatorIndexState(codename)` in `lib/ingest/materialize.ts`
   busts `operator`/`board` tags, the `board:` memo prefix, the ISR profile
   path (both casings), `/sitemap.xml`, and `/board/all` + `/board/off`
   (claim changes claimed-only membership). Both routes call it after the
   successful write. The profile route now also fixes pre-existing staleness
   on display-name/handle edits.

2. **PostgREST IN-clause URL limit (warning).**
   `getIndexableOperatorRows` queried `metric_snapshots` with an unbounded
   `.in("operator_id", ids)`; the file documents that ~1600+ UUIDs exceed the
   URL-length limit and the catch would return `[]` — silently dropping every
   operator URL. The snapshot-existence query is now chunked at 500 ids.

3. **Sitemap URL encoding (suggestion).**
   `operatorSitemapEntry` now emits `encodeURIComponent(codename)` so `<loc>`
   is a valid encoded URL. (Profile canonical emits the route param as
   decoded by Next.js; encoding the canonical is intentionally out of Phase-1
   scope — no canonical changes.)

4. **Noted, not changed:** no-credentials environments diverge (mock
   `claimed: true` profile emits `index,follow` while the sitemap omits all
   operator URLs). Degraded-env only; production is unaffected.

Regression coverage: 5 new tests assert both routes call the invalidation
helper, the helper busts profile path + sitemap + tags, the IN clause is
chunked, and sitemap URLs are encoded.

## Review round 2 — fixes applied

1. **Incomplete invalidation wiring (blocking).** Two more write paths that
   mutate policy inputs now call `revalidateOperatorIndexState`:
   - `POST /api/v1/account/delete` — `delete_account` RPC retires the
     operator; the helper drops the URL from the sitemap and busts the ISR
     profile immediately (previously the public 200 page could serve up to
     6h after deletion).
   - `POST /api/v1/profile/codename` — codename IS the indexed URL; the
     helper runs for both the old codename (stale sitemap entry + stale
     page) and the new one.

2. **Sibling indexable surface (warning → resolved).**
   `app/user/[codename]/wrapped/page.tsx` emitted implicit `index,follow`
   for every profile including unclaimed seeds. `generateMetadata` now
   applies the same shared policy:
   `robots: operatorProfileRobots(row.operator, !row.pending)`. The
   invalidation helper also busts `/user/<c>/wrapped` (both casings) so a
   claim/retire flips the wrapped page's robots at the same time.

3. **IN-clause chunk bound tightened (suggestion).** 500 → **200 ids**
   (~7.4KB serialized, under any plausible proxy URL limit — the codebase
   documents failure at 1600+). Moot at ~52 claimed today; now safe if the
   claimed population ever grows past the threshold.

4. **Snapshot-scan payload (suggestion → noted).** The existence query
   fetches `operator_id` rows only, paginated per chunk. A per-id
   `limit(1)`/count design would bound payload further but adds N queries;
   the chunked paginated form is bounded and correct at current scale.

Regression coverage: 3 more tests — account/delete and profile/codename
routes call the helper (both codenames on rename), wrapped page applies the
shared policy; the helper-body test now also requires the wrapped path bust.

## Rollback

`git revert` the branch range, or revert to the parent of
`8932455 test(seo): define operator search-index eligibility contract`.
Rollback triggers (from the brief): a legit claimed/ranked profile becomes
noindex; profiles redirect/404 unexpectedly; board behavior changes; sitemap
invalid; canonicals change; sitemap/policy count unreconcilable; test regressions.

## Known limitations / Phase 2+ notes

- `/hall` 7d/30d/90d tabs call `getLeaderboard` **without** `claimedOnly` and
  emit `/user/<hash>` links today — Phase 1 covers this via `noindex,follow`;
  link-side cleanup belongs to Phase 4 (interior navigation).
- Static sitemap (208 routes) intentionally untouched — Phase 2 classification.
- `sigarena.signalaf.com` legacy host cleanup — Phase 3.
- e2e `SEED_CODENAME = "furic"` profile stays green (200 + noindex). A
  robots-meta assertion can be added to `e2e/profile.spec.ts` in a follow-up.

---

## Closeout round — completeness addendum (2026-10-05)

Post-merge review produced a completeness addendum (§A–L). Executed on branch `fix/search-recovery-01-closeout`:

| § | Item | Result |
|---|---|---|
| A | `/board/all` duplicate in sitemap (in `STATIC_ROUTES` **and** `BOARD_WINDOWS`) | **Fixed** — single emitter via BOARD_WINDOWS; live fetch confirmed duplicate pre-fix. Regression tests: URL-set uniqueness + each window exactly once + `/board/all` not re-declared |
| A | Sitemap noindex/utility leaks found by new validator | **Fixed** — `/marketplace` + `/vercel/config` (both `noindex,nofollow`) removed from STATIC_ROUTES |
| B | Indexing API misuse correction | **Docs amended** — `SENTINEL.md` marks the 2026-10-05 ×22 submission as a one-time unsupported experiment; correct workflow recorded (deploy → verify → resubmit sitemap → GSC Request Indexing selectively → monitor) |
| B | `sitemap indexed count > 0` criterion removed | **Done** — marked unreliable; gates now read coverage state + crawl freshness + breadth |
| C | Manual Actions / Security Issues baseline | **Pending owner** — not exposed via any GSC API; browser attempt hit sign-in wall. `SAFETY-BASELINE.md` records the pending slot + 2-min owner checklist. API evidence already rules out robots/fetch/canonical causes |
| D | `/user/*` emitter audit | **`LINK-GRAPH.md`** — every emitter mapped. Board/ItemList populations are `claimedOnly`-clean; flagged: Hall 7d/30d/90d lack a claimed filter + `MetricTopTen` emits `href` on placeholder rows (Phase-2 fix list). `/user/the-field` footer link documented as intentional (compare-page persona, correctly `noindex,follow`) |
| E | Sitemap validator | **`scripts/validate-sitemap.mjs`** — structural + `--live` modes; caught all 3 live violations pre-fix; `npm run sitemap:validate[:live]` |
| F | Route classification manifest | **`config/search-index-policy.ts`** — 214 routes: CORE 19 · SUPPORTED 105 · HOLD 77 · UTILITY 8 · REDIRECT 5. **Manifest now gates sitemap membership** → emitted sitemap 234→~146 URLs. HOLD pages stay live + index,follow (omission ≠ noindex) |
| G | Structured-data audit | **`SCHEMA-AUDIT.md`** — Organization `logo` present + resolving (flagged defect absent live); no dead operator URLs; no sigarena refs; no dupes |
| H | Legacy hosts | **`LEGACY-HOSTS.md`** — all 3 hosts DNS-dead (nothing resolves → no live redirects needed today); route-mapping manifest + 410 policy recorded for any future re-point |
| I | Interior navigation | **`NAV-DESIGN.md`** — full hub topology + operator link-graph rules drafted as design manifest; implementation deferred to evidence gate (§L freeze) |
| J | `/api/indexnow` hardening | **Rewritten** — bearer auth (`INDEXNOW_SUBMIT_SECRET`/`CRON_SECRET`), SITE_ORIGIN allowlist, key override removed, dedupe+cap(100), per-instance rate limit, submission logging. Contract tests added |
| K | AI-search crawler access | **`CRAWLER-ACCESS.md`** — verified live: OAI-SearchBot/PerplexityBot/ClaudeBot/Googlebot all HTTP 200, no WAF/JS challenge; robots.txt policies intentional (Bytespider + meta-externalagent blocked; Google-Extended allowed) |
| L | Spam-rollout monitoring/freeze | **Amended in SENTINEL.md** — Sept 2026 spam update still rolling out → no interpretation of fluctuations until completion; freeze list + allowed-exceptions recorded |

### Tests

38 → **43 contract tests** in `__tests__/seo/indexing-policy.test.mjs` (dedupe, window-once, manifest coverage/promotion/sentinel-preservation, indexnow hardening). Suite + build results in the PR body.

### Behavioral consequence of merging

Sitemap membership drops from 234 → ~146 URLs (HOLD/UTILITY/REDIRECT excluded). This IS the addendum's Phase-2 manifest-as-source-of-truth — merging activates it. Merge timing controls activation timing.

## Review round 2 (2026-10-05)

- **Validator fixed**: `--file` is now a real offline mode (validated `.next/server/app/sitemap.xml.body` → 146 URLs, 0 violations); host invariant asserts `signalaf.com` on the declared `<loc>` rather than the fetch base, so `--live --base <preview>` works on preview deploys; live checks fetch `base+path` while canonical is still compared to the declared URL.
- **CI gate is real**: sitemap emission extracted to `lib/seo/sitemap-entries.ts` (pure, dependency-free); `__tests__/seo/indexing-policy.test.mjs` now invokes `staticSitemapEntries`/`operatorSitemapEntries` on the real `STATIC_ROUTES` + `BOARD_WINDOWS` — uniqueness, host/scheme/utility/query invariants, manifest gating, and operator policy all assert on the actual emitted set under `npm test`. The script remains the post-deploy complement for live invariants (200/redirect/robots/canonical).
- **Dead-link fix**: `MetricTopTen` no longer emits `href` on `isPlaceholder` rows — placeholder names render unlinked (LINK-GRAPH finding #2 closed; Hall window claimed-filter remains documented Phase-2 scope).
- **IndexNow nits**: bearer comparison is now `crypto.timingSafeEqual`; dead post-dedupe empty check removed.
- **Manifest completeness**: `/marketplace` + `/vercel/config` classified UTILITY (removed from STATIC_ROUTES in §A, recorded in the manifest).
- **tsconfig**: `allowImportingTsExtensions` enabled so test-importable modules can carry explicit `.ts` specifiers (required by `node --experimental-strip-types`).
- 43 → **46 contract tests**; full suite 685/681-pass/0-fail/4-skip; UI 132/132; canonical 11/11; tsc 0; build clean.
