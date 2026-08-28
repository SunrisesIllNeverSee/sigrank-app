# Time-based Paywall

Use time-based when you want per-session, anonymous access metered by time spent on paid content — no account required. Users connect a payment method once and are billed per interval (e.g. EUR 0.22 per minute) up to a monthly cap.

Choose this over subscriptions or one-time purchases when: articles, single videos, podcasts, donation-prompt-style paywalls, "first N seconds free then pay" experiences.

If you arrived here without first doing Step 0 in [../SKILL.md](../SKILL.md), go back — confirm mode (subscription, one-time, or time-based) and gather identifiers before generating code.

## Session lifecycle

A time-based session moves through three states:

| State | Meaning | Paywall event |
|---|---|---|
| Locked         | No active billing session, or the session is not granting access. Show the paywall. | `paywallShow` fires |
| Active         | Billing session is in progress; eligible content is billable and time accrues per your product rules. | `paywallHide` fires (payload includes `sessionId`) |
| Ended / Invalid | Session was closed or payment failed. User returns to Locked. | `paywallShow` fires |

The events are your single source of truth for the UI — do not poll, do not try to derive state from `isAuthenticated`.

## Flow

1. Create a time-based product in the dashboard (configure interval, fee, monthly limit). Copy the `productId` (`p-test-...` for sandbox, `p-live-...` for live).
2. `tiun.init({ snippetId, language: 'en' })` on app start.
3. Start with the paywall visible — in time-based, the default state is locked.
4. Listen for `paywallShow` / `paywallHide` to toggle paywall vs premium UI.
5. Add a button that calls `tiun.start()` to open the connect overlay.
6. Call `tiun.setContent({ type, contentId, mediaType })` on every route/page change to drive metering.

## Listening for paywall events

```javascript
tiun.on('paywallShow', ({ isConnected }) => {
  showPaywall();
  hidePremiumContent();
  // isConnected: true when a payment method exists but the session ended,
  // false when the user has never connected one. Use this to tailor copy
  // (e.g. "Reconnect" vs "Get access").
});

tiun.on('paywallHide', ({ sessionId, isConnected }) => {
  hidePaywall();
  showPremiumContent();
  // sessionId — pass to your backend for server-side session verification
});
```

`paywallShow` fires when the user has no access (no payment method yet, or session ended). `paywallHide` fires once a session is Active.

## Starting a session

```javascript
function onClickGetAccess() {
  tiun.start();
}
```

After the user connects a payment method, `paywallHide` fires with `sessionId` and `isConnected: true`.

## Per-route content metering

Tell tiun what the user is viewing on every route change.

```javascript
function onRouteChange(path) {
  tiun.setContent({
    type: isPaidContent(path) ? 'active' : 'inactive',
    contentId: path,
  });
}
```

| `type` | When to use |
|---|---|
| `'active'`   | Paid content — session is running and billing |
| `'inactive'` | Free content — session pauses, no billing |
| `'paused'`   | Temporarily paused (video paused, ad break, user idle) |

## Media types

For audio or video, set `mediaType` so sessions behave correctly (audio stays active during background / locked screen; video follows play/pause state).

```javascript
tiun.setContent({
  type: 'active',
  contentId: 'episode-42',
  mediaType: 'audio',
});
```

| `mediaType` | Behavior |
|---|---|
| `'text'` (default) | Tracks page visibility and scroll |
| `'audio'`          | Stays active during background and locked-screen playback |
| `'video'`          | Follows video play/pause state |

## Server-side verification

The paywall events and `setContent()` calls cover the client. If your backend serves the premium payload itself (article body, stream URL, API response), verify the session server-side using the `sessionId` from `paywallHide` — clients can lie about whether `paywallHide` fired.

See [server-verification.md](server-verification.md) for the session verification endpoint and example backend code.

## Sandbox vs production

Live is the default — if you never set `sandbox: true` in `init()`, you're targeting live. Live product IDs are prefixed `p-live-`, sandbox `p-test-`. Keep the SDK's `sandbox` flag aligned with the dashboard view, and use the matching snippet ID, or checkout silently fails (Rule 8 in `SKILL.md`).

## Common mistakes

- **Showing premium content by default.** Time-based starts Locked; render the paywall first and reveal premium content from `paywallHide`.
- **Forgetting `setContent` on route changes.** Without it, the session can't meter correctly across routes.
- **Mismatched `mediaType`.** Mark a podcast page `'audio'` only if audio is actually playing — otherwise the session keeps billing while the user is reading show notes with the screen locked.

## Full reference

[docs.tiun.io — Charge for time-based sessions](https://docs.tiun.io)
