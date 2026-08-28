# Installation & Initialization

## Install

```bash
npm install @tiun/sdk
# or
pnpm add @tiun/sdk
# or
yarn add @tiun/sdk
```

For vanilla HTML/JS without a bundler, import the ESM build from a CDN:

```html
<script type="module">
  import { tiun } from 'https://unpkg.com/@tiun/sdk/tiun.js';
  tiun.init({ snippetId: 'YOUR_SNIPPET_ID', language: 'en' });
</script>
```

## Initialize

```javascript
import { tiun } from '@tiun/sdk';

tiun.init({
  snippetId: 'YOUR_SNIPPET_ID', // required, from my.tiun.business
  language: 'en', // 'en' | 'de' | 'fr' (case-insensitive)
  tone: 'formal', // 'formal' | 'informal'
  debug: false, // console logging
  sandbox: false, // target sandbox environment
  onReady: () => {}, // optional, same as tiun.on('ready', ...)
  onError: (err) => {}, // optional, same as tiun.on('error', ...)
});
```

`tiun.init()` is **idempotent**: calling it again on an initialized instance merges config rather than re-initializing. You can safely call it from multiple mount points (e.g. a React `useEffect` and a Nuxt plugin) without a guard. `tiun.destroy()` is what fully clears listeners, runtime config, and cached user state.

The SDK automatically routes to the correct API host based on the `sandbox` flag — do not pass `baseUrl` (it is an internal-only field; see Rule 14 in `SKILL.md`).

### Config options

| Option                                       | Type                     | Default    | Notes                                                                                                                                      |
| -------------------------------------------- | ------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `snippetId`                                  | string                   | —          | **Required.** From dashboard; environment-specific.                                                                                        |
| `language`                                   | `'en' \| 'de' \| 'fr'`   | `'en'`     | UI language for hosted overlays. Case-insensitive. Unsupported values trigger a one-time console warning and fall back to `'en'`.          |
| `tone`                                       | `'formal' \| 'informal'` | `'formal'` | Copy style in overlays.                                                                                                                    |
| `debug`                                      | boolean                  | `false`    | Enable console logging.                                                                                                                    |
| `sandbox`                                    | boolean                  | `false`    | Target sandbox environment (`true`) or live (default). Selects the API host automatically; the snippet ID must match the same environment. |
| `onReady` / `onError` / `onUserChange` / ... | function                 | —          | Optional event callbacks; equivalent to `tiun.on(...)`.                                                                                    |

## NPM mode vs script-tag mode

- **NPM mode** (covered above): you bundle `@tiun/sdk` and call `tiun.init({ snippetId, ... })`. This is the path documented in [docs.tiun.io](https://docs.tiun.io) and the default for modern JS apps.
- **Script-tag mode** (legacy): the snippet is loaded by a `<script>` tag and the configuration is injected by the backend; call `tiun.init()` with no arguments. Useful for legacy server-rendered sites where the snippet is already integrated via a CMS or platform plugin.

> The script-tag path is not currently documented in the public docs. Confirm with tiun (`support@tiun.io`) before relying on it for a new integration; it remains here because legacy hosts still depend on it.

Pick one. Mixing both leads to a double-loaded snippet and conflicting config.

## Environments — live vs sandbox

tiun runs **two fully independent parallel environments**: live (real customers and payments) and sandbox (simulated payments, separate catalog). Each has its own snippet ID, products, product ID prefix (`p-live-...` vs `p-test-...`), API keys, customers, and analytics. Nothing syncs between them.

```javascript
// Sandbox
tiun.init({
  snippetId: 'YOUR_SANDBOX_SNIPPET_ID',
  language: 'en',
  sandbox: true,
});

// Live (default)
tiun.init({ snippetId: 'YOUR_LIVE_SNIPPET_ID', language: 'en' });
```

The dashboard has a sandbox toggle that switches which environment you are viewing/editing. Keep the SDK's `sandbox` flag aligned with the dashboard view while you're working, or snippet IDs and product IDs will not line up with what the dashboard shows.

**`localhost` handling:**

- Live: `localhost` is **blocked**. Use live only from your registered production domains.
- Sandbox: `localhost` is **enabled by default on any port** — no explicit registration needed. Most teams develop locally with `sandbox: true` and a sandbox snippet ID.

## Where to put `snippetId` per host

`snippetId` is non-secret runtime configuration. The rule is the same everywhere: write the value where the runtime can actually read it, not just where it's documented.

| Host                                       | Read from                                                                                                                 | Common mistake                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Vite (Vue, Svelte, Solid, vanilla bundled) | `.env` / `.env.local`, exposed as `import.meta.env.VITE_*`                                                                | Writing to `.env.example` — it is documentation, never loaded            |
| Next.js                                    | `.env.local`, exposed as `process.env.NEXT_PUBLIC_*`                                                                      | Forgetting the `NEXT_PUBLIC_` prefix (value becomes server-only)         |
| Nuxt                                       | `nuxt.config.ts` under `runtimeConfig.public`, read via `useRuntimeConfig().public`                                       | Putting it under `runtimeConfig` (server-only, never reaches the client) |
| Astro                                      | `.env`, exposed as `import.meta.env.PUBLIC_*`                                                                             | Missing `PUBLIC_` prefix                                                 |
| SvelteKit                                  | `.env`, exposed as `import.meta.env.VITE_PUBLIC_*` or from `$env/static/public`                                           | Importing from `$env/static/private` (server-only)                       |
| Plain HTML / no bundler                    | Inline literal in the `tiun.init({ snippetId })` call, or a `<script>` that sets `window.TIUN_SNIPPET_ID` before SDK load | Trying to use `.env` files (no bundler to load them)                     |
| Mobile WebView                             | Native host injects via `window.TIUN_SNIPPET_ID` (or query string) before page load                                       | Hardcoding in JS that ships to all builds and environments               |

The `snippetId` is not a secret — it identifies an environment, not a user — so any "public" runtime config slot is safe.

## Lifecycle

- `tiun.init(config)`: call on app start. Idempotent.
- `tiun.waitForReady()`: returns a Promise that resolves when the hosted snippet is loaded.
- `tiun.destroy()`: tear down the instance. Only needed where the subtree can remount — see the lifecycle matrix in [frameworks.md](frameworks.md).
- `tiun.isInitialized` / `tiun.isReady`: boolean status flags.

## Where to call `init`

Always on the client, never on the server. See [frameworks.md](frameworks.md) for per-framework mount points and the full `destroy()` lifecycle matrix.
