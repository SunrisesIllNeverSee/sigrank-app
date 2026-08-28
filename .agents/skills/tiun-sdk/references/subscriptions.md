# Subscriptions

Use subscriptions when you need persistent user accounts and **recurring** revenue (SaaS, memberships). For a product bought once with permanent access, see [one-time.md](one-time.md) instead — it shares this entry point but has no renewal, trial, or expiry.

If you arrived here without first doing Step 0 in [../SKILL.md](../SKILL.md), go back — confirm the mode (subscription, one-time, or time-based) and gather identifiers before generating code.

## Flow

1. Create subscription products in the dashboard. Each has a `productId` (`p-live-...` for live, `p-test-...` for sandbox).
2. `tiun.init({ snippetId, language: 'en' })` on app start.
3. On the pricing page, bind checkout:

   ```javascript
   tiun.checkout({ productId: 'p-live-pro' });
   ```

   This opens the hosted checkout overlay. After success, tiun fires `userChange` with `event: 'checkout'` (and `login` if the user was new).

4. Subscribe to `userChange` to drive the UI:

   ```javascript
   tiun.on('userChange', ({ event, isAuthenticated, user }) => {
     if (!isAuthenticated) return showSignedOutUI();
     const hasPro = user.productAccess.includes('p-live-pro');
     hasPro ? showProUI() : showFreeUI();
   });
   ```

5. For returning users: call `tiun.login()` to open the login overlay. OTP is sent to their registered email (and SMS if configured).

## Branching on `userChange.event`

The `event` field tells you what triggered the fire (`'init' | 'login' | 'checkout' | 'logout' | 'update'`). Most gating logic does not need it — `isAuthenticated` + `productAccess` are enough. Branch when you want one-off side effects:

```javascript
tiun.on('userChange', ({ event, isAuthenticated, user }) => {
  if (!isAuthenticated) return showSignedOutUI();

  if (event === 'checkout') {
    showWelcomeToast(`Subscribed to ${user.productAccess.join(', ')}`);
  }
  // event === 'init' on returning visitors — no toast
  // event === 'update' when entitlements change (renewal, cancellation, tier change).
  // Subscriptions only — a one-time entitlement never changes. See one-time.md.

  renderGatedUI(user);
});
```

## User object shape

```typescript
{
  userId: 'u-abc123',
  email: 'user@example.com',
  productAccess: ['p-live-pro'],
}
```

Use `userId` if your backend needs a stable identifier across sessions, and `productAccess` for client-side gating.

## Multi-tier products

Real apps usually have more than one product. Use a const map so productIds are typed and discoverable:

```javascript
const TIUN_PRODUCTS = {
  basic: 'p-live-basic',
  pro:   'p-live-pro',
};

tiun.on('userChange', ({ isAuthenticated, user }) => {
  if (!isAuthenticated) return showSignedOutUI();

  if (user.productAccess.includes(TIUN_PRODUCTS.pro))   return showProUI();
  if (user.productAccess.includes(TIUN_PRODUCTS.basic)) return showBasicUI();
  return showUpgradePrompt();
});

document.querySelector('#buy-pro').onclick =
  () => tiun.checkout({ productId: TIUN_PRODUCTS.pro });
```

## Gating rules

- **UI-level gating**: `user.productAccess.includes(productId)` is sufficient for showing/hiding UI.
- **Trusted access (paid API, protected downloads, etc.)**: do server-side verification (see [server-verification.md](server-verification.md)). Never trust `productAccess` alone for anything a user could bypass by editing their own client.

## Common mistakes

- **Wrapping `tiun.checkout` / `tiun.login` in helper functions that re-check `isInitialized` and `await waitForReady`.** These methods already do both internally. Call them directly from your event handler.
- **Reading `tiun.user` once at mount.** Subscription entitlements can change mid-session (upgrade, downgrade, renewal). Use `userChange` as the source of truth, not a one-shot read.
- **Applying this file's renewal/cancellation handling to a one-time product.** One-time entitlements are permanent — see [one-time.md](one-time.md).
- **Building custom payment forms.** The checkout overlay is hosted by tiun; do not reimplement card collection.
