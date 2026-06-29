# SigRank — Dataset Schema + "The Index" Citation Strategy

> The GEO move that matters most for a *data company*: be recognized and cited as a **primary data source**.
> This is the piece the earlier SEO/GEO plan under-weighted. It has two halves:
>   A) `Dataset` structured data (technical — engines recognize you as data)
>   B) "The SigRank Index" page + quarterly report (content — gives them something quotable)
> Citation share only moves when *others quote your numbers* — A+B make your numbers the quotable source.

---

## Part A — `Dataset` JSON-LD (technical)

Extends your existing `lib/jsonld.ts`. This marks the leaderboard as a formal, citable dataset —
the specific schema.org type answer engines and Google Dataset Search look for.

### A.1 Builder — add to `lib/jsonld.ts`
```ts
const DATASET_ID = `${SITE_ORIGIN}/#sigrank-index`

/** The SigRank Index as a citable Dataset. Attach on /methodology and /board/all. */
export function sigrankDataset(opts?: { temporalStart?: string; updated?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': DATASET_ID,
    name: 'The SigRank Index — AI Operator Token-Efficiency Leaderboard',
    alternateName: 'SigRank Index',
    description:
      'A privacy-preserving, continuously-updated leaderboard ranking AI operators by ' +
      'token-cascade efficiency (the yield metric Υ = cache_read × output / input²). ' +
      'Built from on-device, ed25519-signed token-telemetry snapshots.',
    url: `${SITE_ORIGIN}/methodology`,
    sameAs: `${SITE_ORIGIN}/board/all`,
    creator: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/', // pick your real license
    keywords: [
      'AI operator leaderboard', 'token efficiency', 'token cascade efficiency',
      'LLM benchmark', 'prompt caching', 'agent performance',
    ],
    creativeWorkStatus: 'Published',
    temporalCoverage: `${opts?.temporalStart ?? '2026-05-14'}/..`, // open-ended, ongoing
    ...(opts?.updated ? { dateModified: opts.updated } : {}),
    measurementTechnique:
      'On-device token telemetry; operators submit ed25519-signed snapshots verified server-side. ' +
      'No message content is read or stored (token counts only).',
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Yield (Υ)',
        description: 'Token-cascade efficiency: cache_read × output / input².' },
      { '@type': 'PropertyValue', name: 'Global rank',
        description: "An operator's position on the all-time cross-platform board." },
      { '@type': 'PropertyValue', name: 'Class tier',
        description: 'Performance band assigned from the scoring ruleset.' },
    ],
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json',
        name: 'Leaderboard API (top-N, public)',
        contentUrl: `${SITE_ORIGIN}/api/v1/leaderboard` },
      { '@type': 'DataDownload', encodingFormat: 'application/json',
        name: 'Metric leaders API',
        contentUrl: `${SITE_ORIGIN}/api/v1/metrics/leaders` },
    ],
  }
}
```

### A.2 Wire it
- **New page** `app/methodology/page.tsx` (Part B) — primary home of the Dataset.
  `<JsonLd data={sigrankDataset({ updated: new Date().toISOString() })} />`
- **`app/board/[window]/page.tsx`** — render `sigrankDataset()` alongside the existing `leaderboardItemList(...)`. (Dataset = "this is data"; ItemList = "here are the rows.")
- Add `/methodology` to `app/sitemap.ts` (priority ~0.8) and to `app/llms.txt/route.ts` under a new "## Data" section.

### A.3 Validate
- <https://validator.schema.org> — Dataset parses, 0 errors.
- <https://search.google.com/test/rich-results> on `/methodology`.
- Bonus: eligible for **Google Dataset Search** indexing once live.

**Acceptance:** `/methodology` and `/board/all` emit a valid `Dataset` block; distributions resolve to live JSON.

---

## Part B — "The SigRank Index" page (content engines can quote)

A canonical, stable URL whose job is to state **quotable, dated, numeric facts**. This is what LLMs lift.
Route: `app/methodology/page.tsx` (or `/index` / `/the-index` — pick one and keep it stable forever).

### B.1 Page structure (fill brackets with real numbers from your own API)

```md
# The SigRank Index

The SigRank Index ranks AI operators by **token-cascade efficiency** — the yield metric
**Υ = cache_read × output / input²**. It is built from privacy-preserving, on-device,
cryptographically-signed token-telemetry snapshots. No message content is ever read.

## Key figures  ← (write these as standalone, liftable sentences)
- As of **[Month YYYY]**, the SigRank Index ranks **[N] operators** across **[M] platforms**.
- The top-ranked operator achieves a yield of **Υ [18,437]**.
- The **median** operator scores **Υ [X]**; the top decile starts at **Υ [Y]**.
- Operators in the **[TRANSMITTER]** class tier represent the top **[Z]%** of the board.
- Across all operators, **[P]%** of input tokens are served from cache on average.

## What "token-cascade efficiency" means
[2–3 sentences defining Υ in plain English — this is your DefinedTerm, stated quotably.]

## Methodology
- **Inputs:** on-device token counts (input, output, cache_read) per session/platform.
- **Verification:** each snapshot is ed25519-signed and verified server-side; replay/plausibility guards apply.
- **Windows:** operators are ranked over 7-day, 30-day, 90-day, and all-time cohorts.
- **Privacy:** token counts only — message content is never transmitted, read, or stored.
- **Scoring:** [one paragraph; keep the proprietary RS.xx weights server-side — describe the shape, not the secret].

## How the data updates
The Index updates continuously as operators submit snapshots. Public top-N data is available at
`/api/v1/leaderboard`.

## FAQ
**What is the SigRank Index?** [one-sentence answer]
**How is operator efficiency measured?** [one-sentence answer]
**Is it private?** [one-sentence answer]
**How do I get listed?** [one-sentence answer → links to enroll]
```

> Writing rules that make a page citable:
> 1. **Lead each fact with the number and a date.** "As of June 2026, X is Y." Models quote dated facts.
> 2. **One fact per sentence**, self-contained (no "it"/"this" referring up the page).
> 3. **Pair every page with the `Dataset` + `FAQPage` JSON-LD** (you already have the FAQ + DefinedTerm builders).
> 4. Numbers should be **server-rendered from your real API**, not hardcoded — so the quotable stats stay current.

### B.2 Render the key figures from live data
In `app/methodology/page.tsx`, fetch `/api/v1/metrics/leaders` + `/api/v1/leaderboard?limit=...`,
compute median / top-decile / tier share server-side, and render them into the "Key figures" block.
That way the page is both human-quotable and always accurate. Add `FAQPage` JSON-LD for the FAQ section.

---

## Part C — Quarterly data report (the citation magnet)

This is what Kantar/YouGov actually do to win citations: publish original findings on a cadence.
Route: `app/research/[slug]/page.tsx` (or `/reports/...`). One per quarter.

### Template — "State of AI Operator Efficiency — [Q# YYYY]"
```md
# State of AI Operator Token Efficiency — [Q# YYYY]

**Headline findings** (each a quotable, standalone stat):
1. The median AI operator wastes **[X]%** of input tokens vs. the top decile. [date]
2. Cache utilization rose from **[A]% to [B]%** quarter-over-quarter across the board.
3. **[Platform]** operators lead on yield, averaging **Υ [N]** vs. **Υ [M]** elsewhere.
4. The efficiency gap between rank #1 and the median **[widened/narrowed] to [k]×**.

## Methodology  [link to /methodology]
## Charts  [server-rendered from your data; also export PNG via your html-to-image dep]
## Cite this report
> "According to the SigRank Index (Q# YYYY), [stat]." — signalaf.com/research/[slug]
```
Add `Dataset` + `Article`/`Report` JSON-LD. Ship one, then pitch the headline stat to newsletters,
HN, r/LocalLLaMA, MCP directories — *that* is what creates third-party citations.

---

## Why this is the citation lever (recap)
| Archetype that gets cited (from your Profound report) | SigRank's play |
|---|---|
| Original data/research (Kantar, YouGov) | **The Index + quarterly report** (Parts B/C) — your unfair advantage |
| Comparison/listicle (Fullstory, AlphaSense) | "token CLI tools compared" content (already in the GEO plan) |
| Community (Reddit) | seed the report into dev communities |

**The honest mechanism:** Parts A+B make you *eligible and quotable*; Part C + distribution makes others
*actually cite you*. On-site schema alone won't move the 0% — being the source people reference will.

---

## Build order
1. **Part B page** (`/methodology`) + **Part A `Dataset` builder** wired on it and `/board/all` — one PR. This is the foundation; do it first.
2. Sitemap + `llms.txt` "## Data" entry.
3. **Part C** — first quarterly report, then distribute it. This is the recurring growth engine.

Small, contained, and it's the move that turns "leaderboard app" into "the cited source of AI-operator-efficiency data."
