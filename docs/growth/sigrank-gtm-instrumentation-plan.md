# SigRank — GTM Instrumentation & Tooling Plan

> Goal: make the SigRank growth funnel **measurable**, then point the GTM stack (Profound, Common Room, Clay) at a funnel that actually exists.
> Scope: `sigrank-app` (Next 15 · Supabase · Stripe) + the GTM tool layer + dev-workflow MCP for client work.
> Desktop-runnable. Grounded in the real repo routes. **No telemetry is added to the privacy-preserving CLI** — see the guardrail.

---

## Phase 0 — Context, funnel, and the hard guardrail

**Repo reality (audited):** `sigrank-app` = Next 15 + React 19 + **Supabase** (auth + Postgres) + **Stripe** + Tailwind + Zod. No PostHog/analytics wired — despite PostHog being in your stated stack. That's the gap.

**The SigRank growth loop (PLG / viral):**
```
npm install sigrank  →  enroll (device key)  →  submit snapshot  →  get ranked
        ↑                                                              │
        └──────────────  share profile / wrapped  ←───────────────────┘
                                   │
                                   └──→  upgrade (Stripe)   [revenue]
```

**🔒 GUARDRAIL — privacy posture is a feature, do not break it.**
SigRank is token-only / "no message content read or logged" and has a server-only scoring IP boundary. Therefore:
- **Do NOT add phone-home analytics to the `sigrank-mcp` CLI.** Capture activation/core events **server-side** when the signed request hits the API — the data is already arriving there.
- Identify users by **pseudonymous `codename`** (already public) or Supabase user id. Never by email/IP/device fingerprint.
- Never send token *values*, cascade numbers tied to identity beyond what's already public, or any message content as event properties. Booleans + enums + counts only.
- Add a PostHog **reverse proxy** (Phase 1.4) so analytics survives ad-blockers without third-party domains — also keeps the privacy story clean.

---

## Phase 1 — PostHog foundation (web)

### 1.1 Install
```bash
cd sigrank-app
npm i posthog-js posthog-node
```

### 1.2 Env (add to `.env.example` + Vercel)
```bash
# ─── PostHog (product analytics) ─────────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=phc_
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com   # or eu.i.posthog.com
# Server-side capture reuses the same project API key:
POSTHOG_KEY=phc_
```
> Like your Stripe keys, everything no-ops cleanly when unset (guard with `if (!key) return`), so local/mock builds don't break.

### 1.3 Client init + provider
`lib/posthog/client.ts`:
```ts
import posthog from 'posthog-js'

export function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key || typeof window === 'undefined') return
  if (posthog.__loaded) return
  posthog.init(key, {
    api_host: '/ingest',                      // reverse proxy (1.4)
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false,                  // we send SPA pageviews manually
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
  })
}
export { posthog }
```

`components/analytics/PostHogProvider.tsx` (client component):
```tsx
'use client'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, posthog } from '@/lib/posthog/client'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { initPostHog() }, [])
  return <>{children}<PageViews /></>
}

function PageViews() {
  const pathname = usePathname()
  const search = useSearchParams()
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
    const url = pathname + (search?.toString() ? `?${search}` : '')
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, search])
  return null
}
```
Wire it in `app/layout.tsx` (wrap `{children}`; keep it inside `<body>`, after the theme script). Wrap `<PageViews/>` usage in `<Suspense>` if the build complains about `useSearchParams`.

### 1.4 Reverse proxy (recommended)
In `next.config.ts` add a rewrite so the browser talks to `signalaf.com/ingest`:
```ts
async rewrites() {
  return [
    { source: '/ingest/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
    { source: '/ingest/:path*',        destination: 'https://us.i.posthog.com/:path*' },
  ]
}
```
(Use the EU hosts if your project is EU.) Set `skipTrailingSlashRedirect: true` if not already.

**Acceptance:** pageviews land in PostHog Live Events; no requests to `i.posthog.com` directly in the network tab.

---

## Phase 2 — Client funnel events (the browse / share / upgrade legs)

Create one typed helper so event names never drift — `lib/posthog/events.ts`:
```ts
import { posthog } from '@/lib/posthog/client'
const on = () => !!process.env.NEXT_PUBLIC_POSTHOG_KEY

export const track = {
  boardViewed: (window: string) => on() && posthog.capture('board_viewed', { window }),
  profileViewed: (isOwn: boolean) => on() && posthog.capture('profile_viewed', { is_own: isOwn }),
  profileShared: (channel: string) => on() && posthog.capture('profile_shared', { channel }),
  wrappedViewed: () => on() && posthog.capture('wrapped_viewed'),
  upgradeViewed: (tier?: string) => on() && posthog.capture('upgrade_viewed', { tier }),
  checkoutClicked: (tier: string) => on() && posthog.capture('checkout_clicked', { tier }),
}
```

Wire calls (all are `'use client'` leaf components or `useEffect` in the page):
| Event | File | Trigger |
|---|---|---|
| `board_viewed` | `app/board/[window]/page.tsx` (client child) | on mount, pass the `window` slug |
| `profile_viewed` | `app/user/[codename]/page.tsx` (client child) | on mount; `is_own` from session vs codename |
| `profile_shared` | wherever the share/copy-link button lives (profile + `/wrapped`) | onClick, `channel: 'copy' \| 'x' \| ...` |
| `wrapped_viewed` | `app/user/[codename]/wrapped/page.tsx` | on mount |
| `upgrade_viewed` | `app/upgrade/page.tsx` | on mount |
| `checkout_clicked` | the upgrade CTA button | onClick before the POST to `billing/create-checkout-session` |

> Page components are server components — add a tiny `'use client'` child (e.g. `<TrackBoardView window={window} />`) that just fires the effect, so you don't convert the whole page.

**Acceptance:** clicking through board → profile → upgrade produces the events in order in Live Events.

---

## Phase 3 — Server-side events at the API boundary (activation + core + revenue)

This is the privacy-clean way to capture the funnel's most important events — they're recorded when the authenticated request arrives, not by the CLI.

`lib/posthog/server.ts`:
```ts
import { PostHog } from 'posthog-node'

let client: PostHog | null = null
function ph() {
  const key = process.env.POSTHOG_KEY
  if (!key) return null
  client ??= new PostHog(key, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST, flushAt: 1, flushInterval: 0 })
  return client
}

/** Capture + flush immediately (serverless-safe). distinctId = codename or supabase user id. */
export async function captureServer(distinctId: string, event: string, properties?: Record<string, unknown>) {
  const c = ph()
  if (!c || !distinctId) return
  c.capture({ distinctId, event, properties })
  await c.flush().catch(() => {})
}
```

Wire at these exact routes (call after the handler validates, before returning success):
| Event | Route file | distinctId | Safe properties |
|---|---|---|---|
| `operator_enrolled` | `app/api/v1/devices/enroll/route.ts` | codename (or new device's operator id) | `{ first_enroll: boolean }` |
| `snapshot_submitted` | `app/api/v1/snapshots/route.ts` | codename | `{ window_type, platform, has_cascade: boolean }` — **no values** |
| `snapshot_submitted` (paste path) | `app/api/v1/ingest-paste/route.ts` / `ingest-parse/route.ts` | codename | same |
| `checkout_started` | `app/api/v1/billing/create-checkout-session/route.ts` | supabase user id | `{ tier }` |
| `subscription_activated` | `app/api/v1/billing/stripe-webhook/route.ts` (on `checkout.session.completed`) | supabase user id | `{ tier, amount }` — **the clean revenue event** |

> `subscription_activated` from the Stripe **webhook** (not the client) is what makes revenue trustworthy — client-side checkout clicks lie, webhooks don't.

**Acceptance:** a full CLI `enroll` + `submit` against your dev API shows `operator_enrolled` → `snapshot_submitted` in PostHog under that codename.

---

## Phase 4 — Identify, alias, and one person across surfaces

- **Web sign-in** (`components/auth/LoginButtons.tsx` success / a post-login effect): `posthog.identify(supabaseUserId, { codename })`.
- **Link anonymous → known:** call `posthog.alias(codename, supabaseUserId)` once after first sign-in so pre-login board browsing stitches to the operator.
- **Server captures** use the same `codename` / `supabaseUserId` as `distinctId` so web + API events land on one person.

**Acceptance:** a single operator's PostHog person shows both their web pageviews and their server-side `snapshot_submitted` events.

---

## Phase 5 — Build the funnels & dashboards in PostHog (no code)

Create these so the GTM tools have something to point at:

1. **Activation funnel:** `$pageview (landing)` → `operator_enrolled` → `snapshot_submitted`. *Activation = first submit.* Watch the enroll→submit drop — that's your #1 number.
2. **Engagement/retention:** `snapshot_submitted` (recurring) — stickiness of operators submitting again within 7/30d (mirrors your board windows).
3. **Referral loop:** `profile_shared` → new-session `$pageview` with referrer = a `/user/*` URL → `operator_enrolled`. This quantifies virality (does sharing drive enrolls?).
4. **Revenue funnel:** `upgrade_viewed` → `checkout_clicked` → `checkout_started` → `subscription_activated`.
5. **North-star dashboard:** weekly active submitters, enroll→submit %, share→enroll %, free→paid %.

---

## Phase 6 — Point the GTM stack at the funnel

Now the tools you waved at have a target. Map each to a funnel stage:

### 6.1 Profound (AEO / AI-search) — top of funnel
- Run the **30-prompt set** (already drafted: `profound-rerun-prompts.md`) on a **recurring** schedule; track Visibility / Citation / Sentiment over time, not one-off.
- **Attribution:** put UTMs on the links in `llms.txt` and any AI-surfaced URLs (`?utm_source=ai&utm_medium=answer_engine`). Then in PostHog, segment `operator_enrolled` by `utm_source=ai` to prove AI search drives enrolls.

### 6.2 Common Room — community-led growth (your operator pipeline)
- Connect sources: **GitHub** (`sigrank-mcp`, `sigrank-app` — stars, issues, PRs, forks), **npm** (`sigrank` installs/downloads), and any **Discord/Reddit/X** presence.
- Use it to spot champions: who stars, who opens issues, who installs → those are your warm operators. Tag them as a segment.
- **Loop to PostHog:** when a community member enrolls, you can match GitHub handle ↔ codename (if they opt to link) to see community-signal → activation.

### 6.3 Clay — enrichment & outbound (seed the board)
- Enrich **GitHub stargazers / issue authors** into a list of potential design-partner operators.
- Build a small outbound motion: "you starred SigRank — want a seeded spot on the board?" Keep it consent-first (you're privacy-positioned; don't undercut it).
- Feed enriched accounts into Common Room segments.

### 6.4 Channel attribution summary
| Channel | Tool | Proves it worked via |
|---|---|---|
| AI search | Profound | `utm_source=ai` on `operator_enrolled` |
| Community | Common Room | GitHub/npm signal → enroll segment |
| Outbound | Clay | tagged list → enroll |
| Viral | (built-in) | `profile_shared` → `operator_enrolled` |

---

## Phase 7 — Dev-workflow MCP for your client work (separate from the above)

For shipping client apps fast in Claude Code, drop a `.mcp.json` in each project. The high-ROI four:
```json
{
  "mcpServers": {
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp"] },
    "github":   { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"],
                  "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" } },
    "supabase": { "command": "npx", "args": ["-y", "@supabase/mcp-server-supabase@latest"],
                  "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}" } },
    "vercel":   { "url": "https://mcp.vercel.com" }
  }
}
```
> Verify each package/endpoint name against its current docs (Context7 itself is good for this). Context7 = version-correct docs for your stack; Supabase = migrations/advisors/logs; Vercel = deploy + build/runtime logs; GitHub = PR/CI. These accelerate *how you build*, and apply to every client project, not just SigRank.

---

## Phase 8 — Verification & rollout

```bash
cd sigrank-app
npm run build                 # must pass; PostHog no-ops when keys unset
npx tsc --noEmit              # 0 errors
```
Live checks after deploy (keys set in Vercel):
- [ ] Pageviews appear via `/ingest` (reverse proxy), not `i.posthog.com`
- [ ] Browse board → profile → upgrade fires `board_viewed`/`profile_viewed`/`upgrade_viewed`
- [ ] CLI enroll+submit fires `operator_enrolled` → `snapshot_submitted` server-side
- [ ] Test Stripe checkout fires `checkout_started` then `subscription_activated` (webhook)
- [ ] One person shows web + server events stitched (identify/alias works)
- [ ] Activation + Revenue funnels populate in PostHog

### Suggested PR breakdown (sigrank-app, branch `feat/posthog-gtm`)
1. `feat(analytics): add PostHog provider + reverse proxy + pageviews` (Phase 1)
2. `feat(analytics): client funnel events (board/profile/share/upgrade)` (Phase 2)
3. `feat(analytics): server events at API boundary (enroll/submit/checkout/webhook)` (Phase 3)
4. `feat(analytics): identify + alias on sign-in` (Phase 4)

PostHog dashboards (Phase 5) and GTM tool wiring (Phase 6) are config, not code — do them in the respective UIs after #1–4 ship.

---

## Priority order (do this, in this order)
1. **Phase 1–4** — PostHog instrumentation. *Without this everything else is blind.*
2. **Phase 5** — build the funnels (30 min in the UI).
3. **Phase 6.1 Profound recurring** — you already have the prompts; lowest effort.
4. **Phase 6.2 Common Room** — connect GitHub/npm; your warmest pipeline.
5. **Phase 6.3 Clay** — outbound, once you have segments to enrich.
6. **Phase 7** — dev MCP, anytime; compounds across all client work.

**The one-liner:** instrument the funnel (PostHog) → then Profound feeds the top, Common Room/Clay feed the middle, and the share loop feeds itself — all measured against the same events.
