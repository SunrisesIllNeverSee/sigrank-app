# Discovery (Step 0)

Before writing any tiun integration code, gather four pieces of information. Ask only for what the user has not already stated. Use a structured question primitive (`AskQuestion` or equivalent) if your client supports one; otherwise ask inline.

## 0a. MCP availability

The tiun MCP server (`https://mcp.tiun.business/`) gives you live access to the user's dashboard: their providers and snippet IDs, the product catalog for either environment, and the ability to create and edit one-time and subscription products. Detect it by checking whether it is connected in your session. See [mcp.md](mcp.md) for what it can do, the rules that govern writing to a real account, and how to read a product's pricing type.

- **Present and authed** → use it to enumerate inventory in 0c.
- **Present but unauthed** → prompt auth once; if declined, proceed in manual mode.
- **Absent** → offer to install. Value proposition: "fetch your snippetId and productIds directly so we avoid copy-paste errors." If declined, proceed in manual mode. See [mcp.md](mcp.md) for install instructions.

## 0b. Integration mode

Subscription, one-time purchase, time-based, or a combination? Map user language to mode:

| User says... | Mode |
|---|---|
| "subscription", "recurring", "members", "paid account", "tiers" | Subscription |
| "buy once", "pay once", "one-time", "lifetime", "lifetime deal", "single payment", "unlock forever", "fixed fee", "perpetual license", "no subscription" | One-time |
| "article paywall", "watch then pay", "session", "no account", "first N seconds free", "donation prompt" | Time-based |
| "videos/articles behind a paywall", "premium content" (ambiguous) | **Ask** — don't guess |
| Nothing about access model | **Ask** — don't guess |

Subscription and one-time share an entry point (`tiun.checkout`) but differ in lifecycle — one-time entitlements are permanent (see [one-time.md](one-time.md)). If the user is clearly checkout-based but hasn't said whether it recurs, **ask**; the answer changes whether you generate renewal/cancellation handling at all.

**Do not infer mode from the account's inventory.** What the MCP reports is what *exists*, not what the integrator wants to *build*. A provider with one product type today may add another tomorrow.

Suggested question (when ambiguous):

> Do you want **subscription** access (accounts + recurring billing + per-product tiers, e.g. "$9.99/month for premium videos"), a **one-time purchase** (pay once, keep access forever, e.g. "€240 for an onboarding package"), or **time-based** access (anonymous per-session metering, e.g. "watch any video, billed per minute up to a monthly cap")? Or a combination?

## 0c. Identifiers

Questions depend on mode and MCP availability.

### Environments: live and sandbox are independent parallel setups

tiun runs two independent environments. Each has:

- Its own snippet ID
- Its own product catalog (sandbox products do not exist in live and vice versa)
- Its own product ID prefix: `p-test-...` for sandbox, `p-live-...` for live
- Its own API keys (for server-side verification)

`localhost` is blocked in live. Local development needs `sandbox: true` plus a sandbox snippet ID. Production deploys use live (no `sandbox` flag, live snippet ID, `p-live-...` product IDs).

Confirm with the user *which* environment you're wiring — if both exist, default to sandbox for new local-dev scaffolding and ask only when ambiguous.

### Subscription, MCP present

1. List providers → ask user to pick (each provider is tagged sandbox or live).
2. List products for chosen provider → ask user to pick one or multiple tiers. Suggest: "for multiple tiers, I'll set up a `TIUN_PRODUCTS` map like `{ basic: 'p-live-basic', pro: 'p-live-pro' }`."
3. Confirm the environment from the provider tag; default to sandbox if both exist and the context is local dev.

### Subscription, no MCP

1. Ask for `snippetId` (from `my.tiun.business`).
2. Ask: one product or multiple tiers?
3. For each tier: ask the `productId` and a label (e.g. `pro = p-live-pro`).
4. Ask which environment (live or sandbox). The product-ID prefix is a strong hint — `p-test-...` ⇒ sandbox, `p-live-...` ⇒ live.

### One-time, MCP present

1. List providers → ask user to pick (each provider is tagged sandbox or live).
2. List products for chosen provider → ask which product(s) to unlock. **Do not ask about tiers** — one-time products are not tiered. If the catalog mixes one-time and subscription products, confirm which the user means.
3. Confirm the environment from the provider tag; default to sandbox if both exist and the context is local dev.

### One-time, no MCP

1. Ask for `snippetId` (from `my.tiun.business`).
2. For each product: ask the `productId` and a label (e.g. `lifetime = p-live-lifetime`).
3. Ask which environment (live or sandbox). The product-ID prefix is a strong hint — `p-test-...` ⇒ sandbox, `p-live-...` ⇒ live.

### Time-based, MCP present

1. List providers → ask user to pick (sandbox vs live tag visible).
2. Confirm environment from provider tag.

### Time-based, no MCP

1. Ask for `snippetId`.
2. Ask which environment (live or sandbox).

When MCP is present, ground questions in inventory:

> You have a time-based product `p-test-xyz` in your sandbox and no live products yet. Should I wire up sandbox time-based for local dev, or set up live products first?

## 0d. Gating scope

- Which routes / components / features should require access? (Free-form, or multi-select if you've explored the routes file.)
- What should non-authenticated users see? (Inline login + checkout buttons / redirect to `/pricing` / full-screen paywall overlay / teaser + subscribe button)
- What should authenticated-but-no-access users see? (Usually the same UX with "upgrade" copy)
- Is there a free preview? (e.g. first 30 seconds of video, first paragraph of article) — if yes, the user may actually want **time-based**; feed back into 0b.
- For multi-tier: which routes/features map to which tier?

## "Ask only what's missing"

Parse the user's prompt for any of the four answers before asking. Examples:

| User prompt | Skip which steps |
|---|---|
| "Add tiun" | None — ask all four |
| "Wire up subscription for my video routes" | Skip 0b + the gating-target part of 0d; ask 0a, 0c, and the rest of 0d |
| "Wire up subscription with product `p-live-pro` to gate `/watch/*`" | Skip Step 0 entirely — fully specified (live inferred from the `p-live-` prefix) |
| "Add a lifetime purchase option to my app" | Skip 0b (one-time); ask 0a, 0c, and 0d |
| "Add a time-based paywall to my articles" | Skip 0b + most of 0d; ask 0a, 0c, and UX details for unauthed users |

Confirmation is faster than open questions when you have a defensible default — e.g. "I see you're running locally; I'll use sandbox. OK?" beats "Sandbox or live?"
