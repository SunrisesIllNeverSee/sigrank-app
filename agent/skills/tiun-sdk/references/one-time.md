# One-time purchases

Use one-time purchases when the customer **buys once and keeps access for life** — a perpetual licence, lifetime access, permanently unlocking a feature, or owning a course or piece of content outright. Configured with a single **fixed fee**; no interval, no trial.

This is a **perpetual licence, not a consumable**. The same customer buys it once and can never buy it again — see [Bought once per customer](#bought-once-per-customer--and-never-again) before generating any purchase UI.

If you arrived here without first doing Step 0 in [../SKILL.md](../SKILL.md), go back — confirm the mode (subscription, one-time, or time-based) and gather identifiers before generating code.

## Same as subscriptions

One-time products use the **identical integration**: `tiun.init` → `tiun.checkout({ productId })` → `userChange` with `event: 'checkout'` → gate on `user.productAccess`. The hosted overlay is the same one; it just shows a fixed fee instead of a recurring price and interval.

```javascript
const TIUN_PRODUCTS = { lifetime: 'p-live-lifetime' };

tiun.on('userChange', ({ isAuthenticated, user }) => {
  if (!isAuthenticated) return showSalesPage();
  user.productAccess.includes(TIUN_PRODUCTS.lifetime)
    ? showPurchasedUI()
    : showSalesPage();
});

document.querySelector('#buy').onclick =
  () => tiun.checkout({ productId: TIUN_PRODUCTS.lifetime });
```

Everything in [subscriptions.md](subscriptions.md) about `userChange`, the user object shape, and UI-vs-trusted gating applies unchanged. Do not restate it — read it there.

## What's different

| Subscription | One-time |
|---|---|
| Recurring fee + interval | Single **fixed fee** |
| Optional trial | No trial |
| Renews automatically | Never renews |
| Can be cancelled; access ends | Cannot be cancelled |
| `productAccess` entry can disappear | `productAccess` entry is **permanent** |
| Tiers ladder (basic → pro) | Not tiered — one unlock |
| Can be re-bought after it ends | **Can never be bought again** |

## Bought once per customer — and never again

Once checkout completes, the product ID enters `productAccess` and **never leaves it** — across sessions, logouts, and new devices.

The same customer also **cannot buy it a second time**. tiun blocks the repeat purchase before any money moves:

- **Signed in and already entitled** → checkout links the existing entitlement instead of charging, and the customer is shown an "already purchased — no new charge was made" screen.
- **Signed out, signing up again with the same email** → the sign-up is rejected ("customer already exists"); they have to log in.

So a one-time product is a **perpetual licence, not a consumable**. It is not a shop item that can be re-ordered: there are no quantities, carts, credit packs, tickets, or "buy another" flows. If the user wants customers to buy the *same* thing more than once, tiun does not model that — say so rather than wiring it up.

**Do not generate expiry, renewal, cancellation, trial, or revocation handling for a one-time product.** `userChange` with `event: 'update'` never removes a one-time entry. Code that branches on a one-time entitlement disappearing is dead code for state that cannot occur.

**Once the customer owns it, hide or disable the buy button.** Never render "buy again", a quantity selector, or a repeat-purchase flow, and never write "cancel", "manage plan", "renews on" or "expires on" copy — none of those states exist.

The practical consequence for UX: login is the only thing between a returning customer and the content they already paid for. Make sure the sales page offers **log in**, not just a buy button — otherwise a returning customer is stuck rather than overcharged: sign-up rejects their email, and there is no other way back in.

## Mixed catalogs

An app can sell both. The tier ladder from [subscriptions.md](subscriptions.md) does **not** compose with a one-time unlock — a permanent purchase is not a rung on the subscription ladder. Check it independently:

```javascript
const TIUN_PRODUCTS = {
  pro:      'p-live-pro',       // subscription
  lifetime: 'p-live-lifetime',  // one-time
};

tiun.on('userChange', ({ isAuthenticated, user }) => {
  if (!isAuthenticated) return showSignedOutUI();

  const owned      = user.productAccess.includes(TIUN_PRODUCTS.lifetime);
  const subscribed = user.productAccess.includes(TIUN_PRODUCTS.pro);

  // Independent checks, not rungs on one ladder: owning the lifetime unlock
  // is not "a tier above" the subscription, and neither implies the other.
  renderContent({ hasAccess: owned || subscribed });

  // The lifetime offer disappears permanently once bought; the subscription
  // offer comes back whenever the subscription lapses.
  renderLifetimeOffer({ hidden: owned });
  renderSubscriptionOffer({ hidden: subscribed });
});
```

## Common mistakes

- **Treating it as a repeatable purchase.** Quantity selectors, carts, "buy another", credit packs, tickets — none of these exist. The product is bought once per customer and then permanently owned; a second purchase is refused before it charges.
- **Leaving the buy button live after purchase.** Gate it on `productAccess.includes(productId)` and hide or disable it once owned, or you send paying customers into a checkout that cannot charge them.
- **Generating revocation branches.** Copying subscription gating wholesale brings renewal/cancellation handling that can never fire for a one-time product.
- **Subscription copy on one-time UI.** "Subscribe", "Subscribed to …", "Manage your plan" are wrong. Use "Buy", "Purchased", "You own this".
- **Assuming the product ID prefix tells you the type.** It does not — `p-live-…` / `p-test-…` encode the *environment* only. The `pricingType` the MCP reports for each product (`'Subscription' | 'TimeBased' | 'OneTime'`) is the only signal, and even then, inventory is not intent — confirm with the user. See [mcp.md](mcp.md).
- **Offering a one-time product a trial.** Trials are a subscription-only concept; the dashboard does not expose one here.
