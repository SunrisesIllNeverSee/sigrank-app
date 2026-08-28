---
description: "Use when integrating or debugging the tiun SDK (@tiun/sdk), tiun's JavaScript library for authentication, subscription billing, one-time purchases, and time-based paywalls. Triggers on imports of `@tiun/sdk`, calls like `tiun.init`, `tiun.checkout`, `tiun.login`, `tiun.start`, or questions about tiun products, entitlements, one-time purchases, lifetime access, fixed fees, time-based sessions, or server-side verification."
---
# tiun SDK skill

Use this skill whenever the user is integrating, extending, or debugging code that uses `@tiun/sdk`. Authoritative upstream docs: https://docs.tiun.io/llms-full.txt.

## What tiun is

A commercial backend platform providing authentication, payments, and entitlements through a single JS SDK. The `tiun` singleton supports three flows; you pick based on the integrator's intent (see "Step 0 — Discovery before code"):

- **Subscriptions** — persistent user accounts (OTP login), recurring billing, per-product entitlements in `user.productAccess[]`. Entry point: `tiun.checkout({ productId })`. See [references/subscriptions.md](references/subscriptions.md).
- **One-time purchases** — same accounts and same entry point as subscriptions, but a single **fixed fee** and **permanent** entitlement: no interval, no trial, no renewal, no expiry. Entry point: `tiun.checkout({ productId })`. See [references/one-time.md](references/one-time.md).
- **Time-based** — per-session anonymous access (no account required), metered by time spent on paid content. Entry point: `tiun.start()` + `paywallShow` / `paywallHide` events. See [references/time-based.md](references/time-based.md).

Install: `npm install @tiun/sdk`. Init: `tiun.init({ snippetId, language: 'en' })` on app start (idempotent).

tiun runs **live and sandbox as two independent parallel environments**. The SDK's `sandbox` flag selects which one — see [references/installation.md](references/installation.md).

## Step 0 — Discovery before code

Before writing any integration code, establish four things. Ask only for items the user has not already stated. If their prompt is fully specified ("wire up subscription with product `p-test-pro` in sandbox to gate `/watch/*`"), skip discovery.

Use a structured question primitive (e.g. `AskQuestion`) if your client supports one; otherwise ask inline in chat.

**0a. Detect the MCP and offer to install if missing.** See [references/mcp.md](references/mcp.md) for per-client install instructions and detection. Three states:

- MCP present and authed → use it to enumerate providers/products in 0c.
- MCP present, not authed → prompt auth once; if declined, proceed in manual mode.
- MCP absent → offer to install (single-sentence value proposition: "fetch your snippetId and productIds directly so we avoid copy-paste errors"). If declined, proceed in manual mode.

**0b. Establish integration mode.** Subscription, one-time purchase, time-based, or a combination? See [references/discovery.md](references/discovery.md) for cues that map user language to each mode. **Do not infer mode from the account's inventory.** A provider with only one product type today may be planning another tomorrow.

**0c. Gather identifiers.** Questions depend on mode and MCP availability:

- Subscription, MCP present → list providers, ask user to pick; list products, ask user to pick one or multiple tiers; confirm environment from the provider's sandbox/live tag.
- Subscription, no MCP → ask for `snippetId`; ask one product or multiple tiers; for each, ask `productId` and label; confirm sandbox or live (the `p-test-...` / `p-live-...` prefix is a strong hint).
- One-time, MCP present → list providers, ask user to pick; list products, ask user to pick the product(s) to unlock; confirm environment from the provider's sandbox/live tag. Do not ask about tiers — one-time products are not tiered.
- One-time, no MCP → ask for `snippetId`; for each product, ask `productId` and label; confirm sandbox or live (prefix is a strong hint).
- Time-based, MCP present → list providers, ask user to pick; confirm environment from provider tag.
- Time-based, no MCP → ask for `snippetId`; confirm sandbox or live.

When the MCP is present, ground questions in inventory ("you have a sandbox time-based product `p-test-xxx` — wire that up, or set up subscription products first?") rather than asking blind.

**0d. Identify what to gate.** Without this step the agent is generating boilerplate with no target. Ask:

- Which routes/components/features require access?
- What should non-authenticated users see? (inline login + checkout buttons / redirect to pricing page / full-screen paywall / teaser + subscribe)
- What should authenticated-but-no-access users see? (typically the same UX with "upgrade" copy)
- Is there a free preview? (If yes, this is often a cue the user actually wants **time-based**, not subscription — feed back into 0b.)
- For multi-tier: which routes/features map to which tier?

## When to do what

| Task | Route to |
|---|---|
| Discovery, scoping, MCP detection, mode selection | [references/discovery.md](references/discovery.md) |
| MCP installation per client, detection, auth | [references/mcp.md](references/mcp.md) |
| What tiun is, supported platforms, product model | [references/overview.md](references/overview.md) |
| Install / init / config / per-host env injection | [references/installation.md](references/installation.md) |
| Method or property lookup | [references/api-reference.md](references/api-reference.md) |
| Event names and payloads | [references/events.md](references/events.md) |
| Subscription gating (accounts + recurring billing) | [references/subscriptions.md](references/subscriptions.md) |
| One-time purchase gating (fixed fee, permanent access) | [references/one-time.md](references/one-time.md) |
| Time-based paywall (per-session, anonymous, metered) | [references/time-based.md](references/time-based.md) |
| Trusted backend authorization | [references/server-verification.md](references/server-verification.md) |
| Framework wiring (any stack) + lifecycle matrix | [references/frameworks.md](references/frameworks.md) |
| "Overlay not appearing", SSR errors, sandbox mismatch | [references/troubleshooting.md](references/troubleshooting.md) |

## Load-bearing rules

1. **`tiun.init({ snippetId, language })` runs on the client**, early in startup. In Next.js/Nuxt, wrap in a client-only component/plugin. Never call it on the server. `init` is **idempotent** — calling it again merges config rather than re-initializing, so no `isInitialized` guard is needed.
2. **`snippetId` is not a secret.** It identifies the environment. Use `NEXT_PUBLIC_*` / `public` runtime config.
3. **`userChange` is the source of truth for checkout-based gating** (subscriptions and one-time purchases), not a one-shot `tiun.user` read. Entitlements change mid-session. The payload includes `event: 'init' | 'login' | 'checkout' | 'logout' | 'update'` for cases where you need to know what triggered the change.
4. **Never trust the client for authorization.** For protected server resources: `tiun.getUserVerificationToken()` returns a JWT (5-minute lifetime), send it to your backend, the backend validates it via `POST /live_api/s2s/v1/users/verification` with `X-TIUN-API-KEY`. For time-based, use the `sessionId` from `paywallHide` against `PATCH /live_api/s2s/v1/sessions/{sessionId}/status`. See `references/server-verification.md`.
5. **Do not reimplement checkout/login UIs.** tiun hosts them. Call `tiun.checkout({ productId })`, `tiun.login()`, or `tiun.start()` to open them.
6. **Methods before `ready` may queue or no-op.** Methods like `checkout`/`login`/`start`/`setContent`/`logout` already call `ensureInitialized()` and `await this.waitForReady()` internally — no need to wrap them.
7. **Unsubscribe handlers** returned from `tiun.on(...)` on component unmount to avoid stale listeners. Or call `tiun.destroy()` if the whole subtree is going away.
8. **Live and sandbox are independent parallel environments.** Each has its own snippet ID, products, product-ID prefix (`p-live-...` vs `p-test-...`), API keys, and API base URL (`https://api.tiun.live` vs `https://api-sandbox.tiun.live`). The SDK's `sandbox` flag must match the dashboard view and the product-ID prefix, or checkout silently fails. `localhost` is blocked in live and enabled by default in sandbox.
9. **No runtime product-list API.** Products are configured in the tiun dashboard (`my.tiun.business`) and referenced by hardcoded `productId` strings. Do not invent methods like `tiun.getProducts()` or REST endpoints; direct users to the dashboard.
10. **No webhooks.** tiun does not emit webhooks. For backend integration, drive state from the JWT returned by `getUserVerificationToken()` or the `sessionId` from `paywallHide`. Do not invent webhook endpoints or event payloads.
11. **Stay upstream-faithful.** All code examples must match https://docs.tiun.io. If a pattern isn't documented upstream (custom SSR wiring, multi-env setups, backend SDKs in other languages, etc.), point the user at the upstream docs rather than inventing a snippet.
12. **Do not infer integration mode from the account's product inventory.** Always confirm with the user (see "Step 0"). What the MCP reports is what *exists*; it does not report what the integrator *wants to build*.
13. **A one-time product ID in `productAccess` is permanent.** It enters at checkout and never leaves — `event: 'update'` never removes it. Do **not** generate expiry, renewal, cancellation, trial, or revocation handling for a one-time product; that is dead code for state that cannot occur. Renewal and cancellation belong to subscriptions only. See `references/one-time.md`.
14. **Do not wrap SDK methods to add `isInitialized` / `waitForReady` guards.** `tiun.checkout`, `tiun.login`, `tiun.start`, `tiun.setContent`, and `tiun.logout` already do both internally. Wrapper helpers around these methods are noise.
15. **Do not pass `baseUrl` to `init()`.** It is an internal-only field reserved for tiun's own infrastructure. Use `sandbox: true` for non-production environments; that is the only public environment switch. The SDK routes to the matching API host automatically.
16. **`language` is a closed enum**: `'en' | 'de' | 'fr'`, case-insensitive. Unsupported values trigger a one-time console warning and fall back to `'en'`. Do not generate other values.
17. **Do not branch app logic on `error.code`.** It's a string but there's no published enum; codes can change between SDK versions. Display `err.message` to users and log `err.code` for support.
18. **Write runtime config to files the bundler actually loads.** `.env.example` is documentation and is never evaluated. Vite loads `.env` / `.env.local`; Next.js loads `.env.local` and requires the `NEXT_PUBLIC_*` prefix for client-exposed values; Nuxt loads via `runtimeConfig.public` in `nuxt.config.ts`. See `references/installation.md` for the per-host table.

## Minimal working example

Three primitives — works in every supported environment. Adapt the reactive primitive (state hook, ref, signal, store, DOM update) to your stack.

```javascript
import { tiun } from '@tiun/sdk';

tiun.init({ snippetId: 'YOUR_SNIPPET_ID', language: 'en' });

const off = tiun.on('userChange', ({ event, isAuthenticated, user }) => {
  // push into your framework's reactive primitive
});

document.querySelector('#buy').onclick =
  () => tiun.checkout({ productId: 'p-live-pro' });

// off(); tiun.destroy();
```

Full per-mode walkthroughs in [references/subscriptions.md](references/subscriptions.md), [references/one-time.md](references/one-time.md), and [references/time-based.md](references/time-based.md). Per-framework adaptations in [references/frameworks.md](references/frameworks.md).

## Decision cues

- User says "subscription", "recurring", "members", "paid account", "products and tiers" → **subscription flow**. Route to subscriptions.md.
- User says "buy once", "pay once", "one-time", "lifetime", "lifetime deal", "single payment", "unlock forever", "fixed fee", "perpetual license", "no subscription" → **one-time flow**. Route to one-time.md.
- User says "article paywall", "watch a video then pay", "session", "no account needed", "donation prompt", "first N seconds free" → **time-based flow**. Route to time-based.md.
- User says "videos behind a paywall", "premium content" (ambiguous) → **ask** which mode. Don't guess.
- User says "how do I get my agent to integrate tiun?" / "set this up with an AI coding agent" → point at the upstream Agent integration guide on [docs.tiun.io](https://docs.tiun.io) and the `npx skills add tiun-app/skills` quickstart in `references/mcp.md`.
- User asks "how do I list products?" / "get all products?" → products are configured in the dashboard at `my.tiun.business`; there is no runtime product-list API. (The MCP exposes inventory to the agent for setup; this is not a runtime SDK feature.)
- User mentions "verify on the backend", "protect API", "trust the client" → server verification (`X-TIUN-API-KEY` header; per-environment base URLs).
- User mentions sandbox / `localhost` / "why won't it work locally" → confirm `sandbox: true` + sandbox snippet ID + `p-test-...` product IDs (live is hard-blocked on `localhost`).
- Errors like "overlay doesn't appear", "methods called before ready" → troubleshooting.
