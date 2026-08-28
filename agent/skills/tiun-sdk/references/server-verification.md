# Server-Side Verification

Trust nothing the client sends about its own entitlements. When access must be trusted (paid API endpoints, protected downloads, premium content payloads), verify on the server.

There are two verification flows, depending on the product type:

- **User verification** — identity + `productAccess` entitlements. JWT-based. Use for **subscription and one-time purchase** gating and authenticated-only endpoints. Both are a `productAccess` check, so the code is identical; a one-time product ID simply never disappears from the array.
- **Session verification** — time-based billing sessions. Session-ID-based. Use to confirm an active time-based session before serving premium content.

Both use the same set of API keys (created in the dashboard under **APIs → Create new key**) and the same per-environment base URLs.

## Base URLs and API keys

| Environment | Base URL                       |
|---|---|
| Live        | `https://api.tiun.live`        |
| Sandbox     | `https://api-sandbox.tiun.live`|

API keys are environment-specific — sandbox keys do not work against live and vice versa. Use the base URL and key matching the SDK's `sandbox` flag (`sandbox: true` → sandbox URL + sandbox key). The `X-TIUN-API-KEY` value is a server secret; never expose it to the browser.

## User verification (auth + `productAccess` entitlements)

JWTs returned by `tiun.getUserVerificationToken()` are valid for **5 minutes**. Do not cache verification results past the token's lifetime; the frontend can fetch a fresh token whenever you need one.

### Flow

1. On the frontend, fetch a verification token:

   ```javascript
   const token = await tiun.getUserVerificationToken();
   ```

2. Send the token to your backend. The transport between your frontend and your backend is up to you — `Authorization: Bearer <token>` is a fine convention.
3. On the backend, exchange the token with the tiun **UserVerification** endpoint:

   ```
   POST {BASE_URL}/live_api/s2s/v1/users/verification
   X-TIUN-API-KEY: <your API key from the dashboard>
   Content-Type: application/json

   { "userVerificationToken": "<token from the frontend>" }
   ```

   Response codes:

   | Status | Meaning |
   |---|---|
   | `200`  | User object returned — read the body. |
   | `401`  | The API key is invalid. |

   `200` response body:

   ```json
   {
     "isAuthenticated": true,
     "userInfo": {
       "userId": "u-...",
       "email": "user@example.com",
       "productAccess": ["p-live-pro"]
     }
   }
   ```

4. Authorize the request based on `isAuthenticated` and `userInfo.productAccess`, not on anything else the client sent. A `200` with `isAuthenticated: false` means the API key was accepted but the underlying user session is no longer active — treat as unauthenticated.

### Multiple plans

If you offer tiers, check from the highest applicable tier down:

```javascript
const hasPro   = user.userInfo?.productAccess?.includes('p-live-pro');
const hasLight = user.userInfo?.productAccess?.includes('p-live-light');

if (hasPro) {
  // serve full Pro content
} else if (hasLight) {
  // serve Light content
} else {
  // no qualifying subscription → reject (prompt upgrade)
}
```

## Session verification (time-based)

When `paywallHide` fires, its payload includes a `sessionId`. Send it to your backend on protected requests, and call the **Session** endpoint to confirm the session is still valid before serving premium content.

```
PATCH {BASE_URL}/live_api/s2s/v1/sessions/{sessionId}/status
X-TIUN-API-KEY: <your API key>
```

Response codes:

| Status | Meaning |
|---|---|
| `200`  | Session is valid — serve the content. |
| `404`  | Session is invalid, expired, or the user is out of funds. Deny. |
| `401`  | API key is invalid. |

Backend sketch:

```javascript
app.get('/api/premium-content', async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) return; // missing → deny

  const upstream = await fetch(
    `${BASE_URL}/live_api/s2s/v1/sessions/${sessionId}/status`,
    {
      method: 'PATCH',
      headers: { 'X-TIUN-API-KEY': API_KEY },
    },
  );

  if (upstream.status === 200) {
    // valid → serve the premium content
  } else {
    // 404 / 401 / upstream error → deny (fail closed)
  }
});
```

## Do / Don't

- **Do** treat the client as untrusted. `user.productAccess` and `paywallHide` on the client are fine for UI, never for authorization.
- **Do** fail closed. Reject when the token or session cannot be validated.
- **Do** keep environments consistent: SDK `sandbox: true` → sandbox base URL + sandbox API key. Mixing produces silent 401s.
- **Don't** cache verification results past the JWT's 5-minute lifetime, or past a session's `Active` window.
- **Don't** expose the snippet ID or the `X-TIUN-API-KEY` as the same secret. The snippet ID is public and identifies an environment; the API key is a server secret.

Full upstream API schema: [api.tiun.live/live_api/swagger/tiun_live_public/swagger.json](https://api.tiun.live/live_api/swagger/tiun_live_public/swagger.json).
