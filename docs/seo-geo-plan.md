# SigRank SEO + GEO — Full Implementation Plan

> Scope: `sigrank-app` (Next.js 15 App Router — the SEO/GEO surface) and `sigrank-mcp` (npm + GitHub discoverability).
> Goal: fix the two real bugs, then add the high-leverage structured-data + AI-crawler surfaces so SigRank ranks in classic search **and** gets cited by ChatGPT / Perplexity / Claude / Google AI Overviews.
> Designed to run on your desktop with Claude Code or by hand. No new runtime deps — `next/og` ships with Next 15.

---

## 0. Current state (audited from source)

**Already good — do NOT redo:**
- Centralized `lib/seo.ts`: `metadataBase`, title template `%s · SigRank`, canonical URLs, OG + Twitter `summary_large_image`.
- 22/22 routes export `metadata` / `generateMetadata`. `/user/[codename]` already has dynamic title (codename + yield) and description (class tier + global rank).
- `app/robots.ts` allows all crawlers (incl. AI bots) and references the sitemap.
- `app/sitemap.ts` is dynamic: static routes + board windows + **every ranked operator** from the leaderboard API.
- `/wiki/*` definitional pages exist — prime GEO content.

**Gaps this plan closes:**
| # | Gap | Impact | Phase |
|---|-----|--------|-------|
| 1 | OG image is `/og.svg`; no PNG. Most platforms don't render SVG → broken link previews | 🔴 High | 1 |
| 2 | Zero JSON-LD structured data anywhere | 🔴 High (esp. GEO) | 2 |
| 3 | No `llms.txt` | 🟡 Med (GEO) | 3 |
| 4 | All operators share one static OG image | 🟢 Low (shareability) | 4 |
| 5 | `sigrank-mcp/package.json` has no `keywords`; GitHub topics unverified | 🟡 Med | 5 |

**Branches:** `feat/seo-geo` in each repo (adjust to taste). Both repos assumed cloned side by side.

**Baseline before starting:**
```bash
cd sigrank-app && npm ci && npm run build   # confirm green baseline
```

---

## Phase 1 — Fix the OG image (🔴 the most visible bug)

The cleanest fix on Next 15 is the **file-based `opengraph-image` convention** — it generates a real PNG via `next/og` (no SVG, no committed binary, no Satori-500 because we use a system font and inline styles only). Next auto-injects the correct `og:image` / `twitter:image` meta, so we then **remove the manual SVG wiring** to avoid conflicts.

### 1.1 Root site-wide OG image
Create `app/opengraph-image.tsx`:
```tsx
import { ImageResponse } from 'next/og'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = SITE_NAME

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '80px',
          background: '#0a0a0a', color: '#ededed',
          fontFamily: 'sans-serif', // system font — avoids remote-font fetch (the old 500)
        }}
      >
        <div style={{ fontSize: 140, fontWeight: 800, letterSpacing: '-0.04em' }}>SigRank</div>
        <div style={{ fontSize: 40, opacity: 0.8, marginTop: 24, maxWidth: 900 }}>
          {SITE_TAGLINE}
        </div>
        <div style={{ fontSize: 28, opacity: 0.5, marginTop: 'auto' }}>signalaf.com</div>
      </div>
    ),
    { ...size },
  )
}
```
> Match the brand colors to your `carbon` theme tokens. Keep it to one flex column with inline styles — that's the subset `next/og` (Satori) renders reliably.

### 1.2 Twitter image (optional but explicit)
File-based `opengraph-image` already covers Twitter via the `summary_large_image` card you set in `lib/seo.ts`. No separate `twitter-image.tsx` needed unless you want a different crop.

### 1.3 Remove the broken SVG wiring
In `lib/seo.ts`:
- Delete the `OG_IMAGE` constant (the `/og.svg` object).
- In `withOG()`: remove the `images: [image]` line from `openGraph` and the `images: [image.url]` from `twitter`. Drop the `ogImage` param (file convention handles images now).
- In `siteMetadata`: remove `images: [OG_IMAGE]` from both `openGraph` and `twitter`.
- Delete `public/og.svg`.

> Result: every route inherits the generated PNG; per-route phases (4) override it with route-local `opengraph-image.tsx`.

### 1.4 Verify
```bash
npm run build
npm start &           # or `npm run dev`
curl -sI http://localhost:3000/opengraph-image | grep -i content-type   # → image/png
```
Then paste the deployed URL into <https://www.opengraph.xyz> — you should see a real card, not a blank.

**Acceptance:** `og:image` resolves to a 1200×630 PNG; preview renders on opengraph.xyz / Slack.

---

## Phase 2 — JSON-LD structured data (🔴 biggest SEO + GEO lever)

Add typed Schema.org builders + a tiny server component, then wire the money pages. This is what makes AI engines quote *your* numbers and Google show rich results.

### 2.1 Renderer component
Create `components/seo/JsonLd.tsx`:
```tsx
import 'server-only'

/** Renders a Schema.org JSON-LD block. `<` is escaped to prevent breakout. */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
```

### 2.2 Builders
Create `lib/jsonld.ts`:
```ts
import { SITE_ORIGIN, SITE_NAME, SITE_TAGLINE } from '@/lib/seo'

const ORG_ID = `${SITE_ORIGIN}/#org`
const SITE_ID = `${SITE_ORIGIN}/#website`

export function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description: SITE_TAGLINE,
    logo: `${SITE_ORIGIN}/opengraph-image`, // or a dedicated square logo
  }
}

export function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: SITE_NAME,
    url: SITE_ORIGIN,
    publisher: { '@id': ORG_ID },
    // Optional: site search action if you add /search
  }
}

/** Leaderboard / board window → ItemList of operators. */
export function leaderboardItemList(
  entries: { codename: string; rank: number; classTier?: string }[],
  path: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `SigRank Leaderboard`,
    url: `${SITE_ORIGIN}${path}`,
    numberOfItems: entries.length,
    itemListElement: entries.map((e) => ({
      '@type': 'ListItem',
      position: e.rank,
      url: `${SITE_ORIGIN}/user/${encodeURIComponent(e.codename)}`,
      item: {
        '@type': 'Person',
        name: e.codename,
        ...(e.classTier ? { jobTitle: e.classTier } : {}),
      },
    })),
  }
}

/** Operator profile → ProfilePage about a Person. */
export function operatorProfile(o: {
  codename: string
  path: string
  classTier?: string
  globalRank?: number
  pending?: boolean
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: `${SITE_ORIGIN}${o.path}`,
    mainEntity: {
      '@type': 'Person',
      name: o.codename,
      ...(o.classTier ? { jobTitle: o.classTier } : {}),
      ...(o.globalRank && !o.pending
        ? { description: `Rank #${o.globalRank} on the SigRank leaderboard` }
        : {}),
    },
  }
}

export function breadcrumb(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${SITE_ORIGIN}${t.path}`,
    })),
  }
}

/** Wiki/glossary term → DefinedTerm (great for AI citation). */
export function definedTerm(term: string, definition: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term,
    description: definition,
    url: `${SITE_ORIGIN}${path}`,
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'SigRank Wiki', url: `${SITE_ORIGIN}/wiki` },
  }
}
```
> Adjust the entry field names to whatever the leaderboard API actually returns (you map `e.operator?.codename`, `e.global_rank`, `e.snapshot.class_tier` elsewhere — reuse those exact paths).

### 2.3 Wire it — site-wide (Organization + WebSite)
In `app/layout.tsx`, inside `<body>` (top is fine):
```tsx
import { JsonLd } from '@/components/seo/JsonLd'
import { organization, website } from '@/lib/jsonld'
// ...
<body className="...">
  <JsonLd data={[organization(), website()]} />
  {/* existing THEME_INIT script, Nav, etc. */}
```

### 2.4 Wire it — `/board/[window]` and `/leaderboard` (ItemList) — the money pages
In `app/board/[window]/page.tsx`, after you fetch the board entries, render:
```tsx
import { JsonLd } from '@/components/seo/JsonLd'
import { leaderboardItemList } from '@/lib/jsonld'
// inside the component, reusing the entries you already load:
<JsonLd
  data={leaderboardItemList(
    entries.map((e) => ({
      codename: e.operator.codename,
      rank: e.global_rank,
      classTier: e.snapshot?.class_tier,
    })),
    `/board/${window}`,
  )}
/>
```
`/leaderboard` redirects to `/board/all`, so wiring the board route covers both.

### 2.5 Wire it — `/user/[codename]` (ProfilePage)
In `app/user/[codename]/page.tsx`, in the page component (you already have `row`):
```tsx
import { JsonLd } from '@/components/seo/JsonLd'
import { operatorProfile } from '@/lib/jsonld'
// ...
<JsonLd
  data={operatorProfile({
    codename: resolveName(operator),
    path: `/user/${rawCodename}`,
    classTier: snapshot.class_tier,
    globalRank: row.global_rank,
    pending,
  })}
/>
```

### 2.6 Wire it — `/wiki/*` (BreadcrumbList + DefinedTerm)
For each wiki page (`signal-drift`, `three-degrees`, `verification`, `local-agent`, `measured-alongside`), add:
```tsx
<JsonLd data={[
  breadcrumb([
    { name: 'Wiki', path: '/wiki' },
    { name: 'Signal Drift', path: '/wiki/signal-drift' },
  ]),
  definedTerm('Signal Drift', 'One-sentence canonical definition pulled from the page intro.', '/wiki/signal-drift'),
]} />
```

### 2.7 Verify
```bash
npm run build && npm start
# confirm the blocks are present and valid JSON:
curl -s http://localhost:3000/board/all | grep -o 'application/ld+json'
```
Validate each page type at <https://validator.schema.org> and <https://search.google.com/test/rich-results> (paste deployed URLs after deploy).

**Acceptance:** Organization+WebSite on every page; ItemList on boards; ProfilePage on profiles; Breadcrumb+DefinedTerm on wiki — all pass the Schema validator with 0 errors.

---

## Phase 3 — `llms.txt` (🟡 GEO convention)

A curated plain-text map at `/llms.txt` telling AI crawlers what SigRank is and where the canonical content lives.

Create `app/llms.txt/route.ts` (folder literally named `llms.txt`):
```ts
import { SITE_ORIGIN, SITE_NAME, SITE_TAGLINE } from '@/lib/seo'

export const revalidate = 3600 // 1h

export async function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_TAGLINE}

SigRank is a privacy-preserving leaderboard that scores AI operators on
canonical token-telemetry metrics (the "yield cascade"). Operators run an
on-device scanner (npm: sigrank) and submit signed, server-verifiable snapshots.

## Core pages
- [Leaderboard](${SITE_ORIGIN}/board/all): live operator rankings (all-time total)
- [Board windows](${SITE_ORIGIN}/board/7d): 7d / 30d / 90d / all-time cohorts
- [Hall of Signal](${SITE_ORIGIN}/hall): top operators
- [Compare](${SITE_ORIGIN}/compare): head-to-head operator comparison

## Concepts (definitions)
- [Verification](${SITE_ORIGIN}/wiki/verification)
- [Signal Drift](${SITE_ORIGIN}/wiki/signal-drift)
- [Three Degrees](${SITE_ORIGIN}/wiki/three-degrees)
- [Local Agent](${SITE_ORIGIN}/wiki/local-agent)
- [Measured Alongside](${SITE_ORIGIN}/wiki/measured-alongside)

## Tooling
- npm package: https://www.npmjs.com/package/sigrank
- MCP server + CLI source: https://github.com/SunrisesIllNeverSee/sigrank-mcp
`
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
```
Add `/llms.txt` to `app/sitemap.ts`'s `STATIC_ROUTES` (priority ~0.5) so it's discoverable.

> Optional `llms-full.txt`: same idea but inline the full wiki definitions + top-50 operators so an LLM can answer without crawling. Add `app/llms-full.txt/route.ts` later if you want maximum citation coverage.

**Acceptance:** `curl -s https://signalaf.com/llms.txt` returns text/plain with live links.

---

## Phase 4 — Per-page dynamic OG images (🟢 shareability upside)

Now that Phase 1 proved `next/og` works, give the high-share routes their own cards. This replaces the reverted Satori attempt — the fix is **no remote font fetch** (use system font) and **inline styles only**.

### 4.1 Operator card
`app/user/[codename]/opengraph-image.tsx` — fetch the same `getOperator(codename)` row and render rank + codename + yield + class tier into the 1200×630 layout (same skeleton as Phase 1.1, `runtime` can be `nodejs` if `getOperator` needs DB access; `edge` if it's a fetch).

### 4.2 Board card
`app/board/[window]/opengraph-image.tsx` — render the window label + top 3 operators.

> File-convention route images automatically override the root one for those segments. No `lib/seo.ts` change needed.

**Acceptance:** sharing `/user/<codename>` shows a card with that operator's rank/score; `/board/30d` shows the window's top 3.

---

## Phase 5 — npm + GitHub discoverability (`sigrank-mcp`)

### 5.1 `package.json` keywords
Add a `keywords` array (npm search ranking + registry AI surfaces):
```json
"keywords": [
  "mcp", "model-context-protocol", "ai-agents", "claude", "anthropic",
  "llm", "token-telemetry", "leaderboard", "cli", "tui",
  "yield-cascade", "sigrank", "agent-tools", "on-device"
],
```
Run `npm pkg fix` and `npm publish --dry-run` to confirm the manifest is clean. (Don't forget to bump version + publish on your normal release flow — this is metadata-only.)

### 5.2 GitHub topics
On both repos, add topics (Settings → Topics, or `gh`):
```
mcp, model-context-protocol, ai-agents, claude, llm, leaderboard, cli, tui, nextjs
```
Set the repo "Website" field to `https://signalaf.com` if not already.

### 5.3 README GEO polish (optional)
The README is already strong. One GEO-friendly add: a short **"What is SigRank?"** plain-English paragraph near the top (one self-contained sentence AI engines can lift verbatim), and an FAQ-style `## FAQ` section ("What does SigRank measure?", "Is my data private?"). Definitional, quotable phrasing = citation bait.

**Acceptance:** `npm view sigrank keywords` lists them post-publish; both repos show topics + website on GitHub.

---

## Phase 6 — Final verification & submission

Per repo:
```bash
npm run build          # sigrank-app: must pass
npx next lint          # sigrank-app
node test.mjs && node sign.test.mjs   # sigrank-mcp (unchanged, sanity)
```

Live checks after deploy:
- [ ] `https://signalaf.com/robots.txt` — references sitemap, allows crawlers
- [ ] `https://signalaf.com/sitemap.xml` — includes boards + operators + `/llms.txt`
- [ ] `https://signalaf.com/llms.txt` — text/plain, live links
- [ ] `https://signalaf.com/opengraph-image` — 1200×630 PNG
- [ ] Rich Results Test passes for: home, `/board/all`, a `/user/<codename>`, a `/wiki/*`
- [ ] opengraph.xyz preview renders for home + an operator profile
- [ ] **Google Search Console**: submit `sitemap.xml`, request indexing on `/board/all` + a couple wiki pages
- [ ] **Bing Webmaster Tools**: submit sitemap (Bing also feeds ChatGPT search)

---

## Suggested commit / PR breakdown

`sigrank-app` (branch `feat/seo-geo`), as separate commits for clean review:
1. `fix(seo): generate raster OG image via next/og, drop broken og.svg` (Phase 1)
2. `feat(seo): add JSON-LD structured data (Org, WebSite, ItemList, ProfilePage, Wiki)` (Phase 2)
3. `feat(geo): add /llms.txt route + sitemap entry` (Phase 3)
4. `feat(seo): per-page dynamic OG cards for operators + boards` (Phase 4)

`sigrank-mcp` (branch `feat/seo-geo`):
5. `chore(npm): add package keywords for discoverability` (Phase 5.1) + repo topics via GitHub UI

---

## Effort estimate
| Phase | Effort | Priority |
|-------|--------|----------|
| 1 — OG raster fix | ~30 min | 🔴 do first |
| 2 — JSON-LD | ~2–3 h | 🔴 highest ROI |
| 3 — llms.txt | ~30 min | 🟡 |
| 4 — dynamic OG cards | ~2 h | 🟢 nice-to-have |
| 5 — npm/GitHub | ~15 min | 🟡 quick win |

Recommended order: **1 → 5 → 2 → 3 → 4** (ship the bug fix + the trivial npm win immediately, then the big structured-data payload, then the polish).
