# tiun MCP server

The tiun MCP server (`https://mcp.tiun.business/`) gives agents access to the user's tiun providers and products during integration. It replaces copy-paste of `snippetId` and `productId` strings with direct lookups against the dashboard.

> The trailing slash matches the upstream docs. Both forms (`https://mcp.tiun.business` and `https://mcp.tiun.business/`) resolve to the same endpoint.

## What it can do

**Read the account.** Which providers the user has, each one's snippet ID, and which environment it belongs to. A provider's product catalog for one environment, including every product's ID, pricing type and price. And the tax categories a product can be filed under, with guidance for choosing between them.

**Create and edit products.** One-time and subscription products can be created, and their name and pricing edited, so a missing product doesn't have to interrupt the integration. Time-based products are read-only here — they are created and edited in the dashboard.

The exact call signatures live in the MCP itself; read them there rather than assuming a shape. What the MCP cannot tell you is when *not* to call it, so:

**Writes land in a real account, and the account is the user's, not yours.**

- Confirm the exact change with the user — name, price, interval, tax category, environment — and get an explicit yes before writing. Every time, not once per session.
- Default to sandbox. Writing to live is a deliberate choice the user makes out loud.
- Never invent a price, name or interval. Take them from the user or from explicit values already in the project, and ask when you have neither.
- Pricing type is fixed at creation. Nothing converts a one-time product into a subscription or back — an edit aimed at the wrong type is refused, not converted.
- There is no idempotency key: creating twice creates two products. Check the catalog for an existing match first.
- Nothing can be deleted, archived or deactivated through the MCP. A write cannot be undone from here.

**A tax category is required on creation, has no default, and can never be changed.** Take it from the account's own list rather than guessing — it determines how the product is taxed. That list is closed: if the product genuinely fits none of the categories, do **not** pick the nearest one. Abandon the create and send the user to `https://my.tiun.business` → new product → "Something else" to submit it. Creating a product under an approximate category is worse than not creating it: the only remedy is archiving it in the dashboard and creating a replacement, and archiving is one-way — there is no restore or re-activate.

## Detection

Check whether the tiun MCP server is connected in your session — if it is, tools for reading the user's providers and products are available to you.

States:

- **Present and authed** → use it.
- **Present but unauthed** → prompt the user to authenticate once. If declined, proceed in manual mode.
- **Absent** → offer to install (below). If declined, proceed in manual mode.

## Reading a product's type

Each product the MCP reports carries a **`pricingType`** — the only reliable signal of what kind of product it is, and the thing that decides which SDK entry point you generate:

| `pricingType` | Mode | Entry point |
|---|---|---|
| `'Subscription'` | Subscription | `tiun.checkout({ productId })` |
| `'OneTime'` | One-time purchase | `tiun.checkout({ productId })` |
| `'TimeBased'` | Time-based | `tiun.start()` |

**The `productId` prefix does not tell you the type** — `p-live-...` / `p-test-...` encode the *environment* only. `Subscription` and `OneTime` share an entry point, so `pricingType` is the only thing that distinguishes them, and the difference matters: a subscription grants a renewable entitlement that can lapse, a one-time purchase grants a permanent one that can never be re-bought. See [one-time.md](one-time.md).

A product's price arrives in the block matching its pricing type, and each type has its own shape — the MCP documents them, so read the response rather than assuming a field. What matters when you report a price back to the user is that the three are not interchangeable: a one-time fee is charged once, a subscription price recurs on its interval, and a time-based fee is metered usage against a monthly cap. Never present a time-based fee as a subscription price.

## Inventory is not intent

The MCP returns what *exists* in the user's account. It does **not** report what they want to build. Always confirm integration mode and chosen products with the user — see [discovery.md](discovery.md) Step 0b and 0c.

A single-type catalog is a reasonable **default to confirm**, not a decision: "I see only one-time products — wire that up, or set up subscriptions first?" A mixed catalog means ask open-ended.

## Sandbox and live providers are tagged separately

Each provider the MCP returns is tagged sandbox or live. If the user has both:

- Use **sandbox providers + sandbox snippet ID + `sandbox: true`** for local development (live is hard-blocked on `localhost`).
- Use **live providers + live snippet ID** (no `sandbox` flag) for production deploys.

Ground discovery questions in inventory — e.g. "you have a sandbox provider and a live provider; should I wire up the sandbox one for local dev?" — rather than asking blind.

## Install

### Quickstart (recommended)

Install the skill from this repo — it works with any agent that supports the Agent Skills standard, and needs Node.js 18+:

```bash
npx skills add tiun-app/skills
```

Then add the MCP server in the agent's MCP settings (Cursor: Settings → MCP; Claude Code: `claude mcp add ...`; etc.). Other installers — `gh skill`, the Claude Code plugin marketplace, a Cursor remote rule, or copying the skill in by hand — are listed in the [repo README](https://github.com/tiun-app/skills#installing).

### Universal config (works for any MCP-compatible client)

```json
{
  "mcpServers": {
    "tiun": {
      "type": "http",
      "url": "https://mcp.tiun.business/"
    }
  }
}
```

Paste this into your client's MCP config file. The exact location depends on the client.

### Per client

- **Claude Code:** the [tiun-app/skills plugin](https://github.com/tiun-app/skills) auto-wires this MCP via the repo's `.mcp.json` when you run `/plugin install tiun-sdk@tiun-sdk`. To add manually: `claude mcp add tiun https://mcp.tiun.business/ --transport http` (verify the flag against your Claude Code version's `mcp add --help`).
- **Cursor:** Settings → MCP → "Add new MCP server" → paste the JSON block above. Or merge into `~/.cursor/mcp.json`.
- **OpenAI Codex:** add the universal config block to your Codex MCP config (typically under `~/.codex/`). See the Codex docs for the exact path.
- **Gemini CLI:** add the universal config to the Gemini MCP config. See the Gemini CLI docs.
- **Other MCP-compatible clients:** use the universal config above with your client's MCP config path.

## On first call

The user is prompted to authenticate against `my.tiun.business` if they haven't already. Subsequent calls reuse the session.

## What to do if MCP is absent and the user declines to install

Proceed in **manual mode**: ask the user directly for `snippetId`, `productId`(s), and sandbox/live. See [discovery.md](discovery.md) for the manual-mode question scripts.
