# SEARCH-RECOVERY-01 — Sentinel Cohort + GSC Baseline

**Captured:** 2026-10-05 ~17:45 UTC via `gsc-seo` MCP (`sc-domain:signalaf.com`, service-account).
**Context:** Phase 1 (`b3bcf67`, PR #202) deployed same day; Phase 6 recovery submission executed once — sitemap resubmitted + Indexing API `URL_UPDATED` for the 22 non-indexed cohort URLs. Per plan: no repeat requests.

## Property snapshot

- Sitemap `https://signalaf.com/sitemap.xml`: last submitted/downloaded **2026-10-02** (pre-recovery); submitted 215 URLs, **0 indexed**, 0 errors/warnings. Resubmitted 2026-10-05 (now serves 234 URLs: 208 static + 22 policy-eligible operators + 4 declared-date routes).
- 28d performance (2026-09-07 → 10-04): **0 clicks, 86 impressions, pos 26.5** — vs prior 28d: 6 clicks, 530 impressions (**-100% clicks, -84% impressions**).
- Brand/non-brand (28d): brand 48 imp / pos 22 · non-brand **15 imp / pos 74**. Top non-brand queries are misspellings (`ranksignal`, `signalrank`) — zero real discovery terms.

## Sentinel cohort — baseline inspection (23/23 succeeded)

Every URL: `robotsTxtState ALLOWED`, `INDEXING_ALLOWED`, `pageFetchState SUCCESSFUL`, googleCanonical == userCanonical. Only `/` is indexed.

| URL | Baseline coverage | Last crawl (UTC) |
|---|---|---|
| `/` | **Submitted and indexed** | 2026-09-30 |
| `/board/all` | Crawled — currently not indexed | 2026-08-20 |
| `/methodology` | Crawled — currently not indexed | 2026-08-04 |
| `/wiki` | Crawled — currently not indexed | 2026-08-15 |
| `/science` | Crawled — currently not indexed | 2026-08-15 |
| `/research` | Crawled — currently not indexed | 2026-08-17 |
| `/token-telemetry` | Crawled — currently not indexed | 2026-07-14 |
| `/score` | Crawled — currently not indexed | 2026-08-18 |
| `/hall` | Crawled — currently not indexed | 2026-08-18 |
| `/compare` | Crawled — currently not indexed | 2026-08-17 |
| `/ai-operator-scoring` | Crawled — currently not indexed | 2026-07-26 |
| `/metrics/yield-cascade` | Crawled — currently not indexed | 2026-07-08 |
| `/metrics/cache-hit-rate` | Crawled — currently not indexed | 2026-08-17 |
| `/metrics/compression-ratio` | Crawled — currently not indexed | 2026-08-17 |
| `/tools/yield-calculator` | Crawled — currently not indexed | 2026-08-18 |
| `/tools/token-waste-calculator` | Crawled — currently not indexed | 2026-08-15 |
| `/guides/how-to-measure-ai-coding-efficiency` | Crawled — currently not indexed | 2026-08-17 |
| `/blog/volume-isnt-yield` | Crawled — currently not indexed | 2026-08-16 |
| `/vs/ccusage` | Crawled — currently not indexed | 2026-08-18 |
| `/vs/cursor` | Crawled — currently not indexed | 2026-08-18 |
| `/vs/lmsys-arena` | Crawled — currently not indexed | 2026-08-15 |
| `/alternatives/ccusage-alternatives` | Crawled — currently not indexed | 2026-08-18 |
| `/alternatives/token-tracking-tools` | Crawled — currently not indexed | 2026-08-18 |

## Phase 6 actions executed (once — do not repeat)

1. `submit_sitemap` → `https://signalaf.com/sitemap.xml` — status `submitted`, 2026-10-05T17:44Z.
2. `indexing_batch_publish` → `URL_UPDATED` ×22 — all acknowledged 2026-10-05T17:45Z.

> **⚠ One-time unsupported experiment.** Google's Indexing API is officially
> limited to `JobPosting` and livestream `BroadcastEvent` pages. The
> 2026-10-05 submission on ordinary SignalAF pages was a single experiment and
> **MUST NOT be repeated** or made standard operating procedure.
>
> **Correct future Google recovery workflow:**
> `deploy → verify live HTML → resubmit sitemap when materially changed →
> Search Console URL Inspection / "Request Indexing" selectively → monitor`
> Do not automate general SignalAF pages through the Indexing API.

## Monitoring + freeze rules (addendum §L)

- **The September 2026 Google spam update is still in rollout** — do not
  interpret short-term ranking fluctuation as recovery success/failure until
  it completes; the clean observation window starts after it ends.
- **Frozen during the window:** new SEO page batches · mass title/H1 edits ·
  schema experiments · canonical migrations · new comparison/listicle
  families · major sitemap expansion.
- **Allowed:** clear defect/security/production-correctness fixes +
  explicitly approved SEARCH-RECOVERY items.
- **Never** re-request indexing for unchanged URLs.

## Monitoring protocol (Phase 8 freeze applies — no structural SEO changes)

Re-run weekly via `mcp-hub → gsc-seo`:

```text
index_coverage_summary(siteUrl, <22 URLs>)   → coverage-state transitions + lastCrawlTime freshness
performance_overview(siteUrl)                → impressions / clicks trend (Gate B)
brand_nonbrand_split(siteUrl, [signalaf, sigrank, signaf, "sig rank"])  → non-brand discovery (Gate C)
list_sitemaps(siteUrl)                       → lastDownloaded advancing past 2026-10-02 only
                                             (the API's "indexed" count is unreliable — NOT a criterion)
```

### Gate checks

- **Gate A** — ≥ several sentinel URLs → `Indexed`. Watch first: `/board/all`, `/methodology`, `/wiki` (fresh crawl dates, strong referrers).
- **Gate B** — distinct pages earning non-brand impressions > baseline 15/28d.
- **Gate C** — non-brand discovery queries appear (token telemetry, AI coding efficiency, ccusage alternatives…).
- **Gate D** — gains persist multiple weeks with zero structural SEO changes.

## Observations worth noting

- `lastCrawlTime` spread (Jul 8 – Sep 30) with uniform "Crawled — currently not indexed" confirms site-level reclassification, not per-page defects — the premise of this recovery.
- Referrers show `/field` feeding most sentinels; `/field` itself is not in the cohort (consider for Phase 2 CORE classification review).
- External referrers already present (`drjack.world`, `pitchhut.com`) — link equity exists; indexing is the bottleneck.
- Competitor "vs sigrank" queries (`tokenmaxxer vs sigrank` pos 44, `tokscale vs sigrank` pos 69) generate impressions on *their* terms — once indexed, `/vs/*` can contest these.
