# API Reference

All methods are on the `tiun` singleton imported from `@tiun/sdk`.

## Lifecycle

| Method | Purpose |
|---|---|
| `tiun.init(config)` | Initialize the SDK. **Idempotent** — calling again on an initialized instance merges config rather than re-initializing. See [installation.md](installation.md) for config. |
| `tiun.destroy()` | Tear down the instance, clearing listeners, runtime config, and cached user state. **Only call where the subtree can remount** — see the lifecycle matrix in [frameworks.md](frameworks.md). Not needed at an SPA root. |
| `tiun.waitForReady()` | Returns a Promise resolving when the snippet is loaded. |
| `tiun.on(event, cb)` | Subscribe to an event. Returns an unsubscribe function. |
| `tiun.once(event, cb)` | Subscribe to an event and auto-unsubscribe after first fire. |

`tiun.init` also accepts event callbacks directly in the config (`onReady`, `onError`, `onUserChange`, etc.) — see [installation.md](installation.md).

## Auth & checkout

| Method | Purpose |
|---|---|
| `tiun.login()` | Opens the hosted login overlay. |
| `tiun.logout()` | Clears the session and fires `logout` / `userChange`. |
| `tiun.checkout({ productId })` | Opens the hosted checkout overlay for a subscription or one-time product. |
| `tiun.start()` | Opens the time-based connect overlay (no product required). See [time-based.md](time-based.md). |
| `tiun.setContent({ type, contentId, mediaType })` | Updates the current content context. Used by time-based billing to meter sessions per route. See [time-based.md](time-based.md). |
| `tiun.getUser()` | Returns `{ isAuthenticated, user }`. `user` is `null` when nobody is signed in. |
| `tiun.getUserVerificationToken()` | Returns a signed JWT (5-minute lifetime) for server-side verification, or `null` if the user is not authenticated. |

`tiun.setContent` accepts:

| Field | Type | Notes |
|---|---|---|
| `type` | `'active' \| 'inactive' \| 'paused'` | `'active'` meters; `'inactive'` pauses; `'paused'` temporary pause (ad break, user paused video). |
| `contentId` | `string` | Stable identifier (article slug, episode ID). Surfaces in dashboard analytics. |
| `mediaType` | `'text' \| 'audio' \| 'video'` | Defaults to `'text'`. Controls how engagement is interpreted (visibility/scroll vs. play state). |

## Properties

| Property | Type | Notes |
|---|---|---|
| `tiun.version` | string | SDK version. |
| `tiun.isInitialized` | boolean | `true` after `init()`. |
| `tiun.isReady` | boolean | `true` once the hosted snippet is loaded. |
| `tiun.isAuthenticated` | boolean | `true` when a valid session exists. |
| `tiun.user` | `TiunUser \| null` | Current user. |

Use properties for one-off reads. For UI that needs to stay in sync, listen to `userChange` instead — see [events.md](events.md).

## User object shape

```typescript
interface TiunUser {
  userId: string;          // stable identifier for the user in tiun
  email: string;           // email on the account
  productAccess: string[]; // product IDs the user currently has access to
  // plus any custom fields configured in the dashboard
}
```

Use `user.productAccess.includes(productId)` to gate features per product — a subscription tier or a one-time purchase. The prefix tells you the **environment**, not the product type: `p-live-...` for live, `p-test-...` for sandbox.
