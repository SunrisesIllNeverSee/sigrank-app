# Framework Integration

## Generic recipe — works in every supported environment

Three primitives. Adapt the reactive primitive to your stack.

1. **Init once**, on the client, after the document is ready.
2. **Bind events** — `userChange` for checkout-based products (subscriptions and one-time purchases), `paywallShow` / `paywallHide` for time-based — register the listener before/synchronously after `init` so the initial fire isn't missed.
3. **Teardown** — call the returned `off()` and `tiun.destroy()` **only if the subtree can remount**. See the lifecycle matrix below.

```javascript
import { tiun } from '@tiun/sdk';

tiun.init({ snippetId, language: 'en', sandbox });

const off = tiun.on('userChange', ({ isAuthenticated, user }) => {
  // push into useState / ref / signal / store / DOM
});

// on teardown (conditional — see matrix):
// off(); tiun.destroy();
```

`language` is a closed enum: `'en' | 'de' | 'fr'`. Unsupported values trigger a one-time console warning and fall back to `'en'`. See [installation.md](installation.md).

## Per-framework adaptations

### Vanilla JS / plain HTML

Initialize at the end of `<body>` or after `DOMContentLoaded`. Page reload tears everything down, so no `destroy()` needed.

```html
<script type="module">
  import { tiun } from 'https://unpkg.com/@tiun/sdk/tiun.js';

  tiun.init({ snippetId: 'YOUR_SNIPPET_ID', language: 'en' });

  tiun.on('userChange', ({ isAuthenticated, user }) => {
    document.body.dataset.authed = String(isAuthenticated);
  });

  document.getElementById('buy').onclick =
    () => tiun.checkout({ productId: 'p-live-pro' });
</script>
```

### React (CRA, Vite, etc.)

Init in a top-level `useEffect(..., [])`. Return a cleanup that calls `off()` and `tiun.destroy()` — StrictMode double-invokes effects in dev, and you want clean teardown.

```jsx
import { tiun } from '@tiun/sdk';
import { useEffect, useState } from 'react';

export function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    tiun.init({ snippetId: import.meta.env.VITE_TIUN_SNIPPET_ID, language: 'en' });
    const off = tiun.on('userChange', (data) => setUser(data.user));
    return () => {
      off();
      tiun.destroy();
    };
  }, []);

  return <Routes user={user} />;
}
```

### Next.js (App Router)

Wrap the tree in a client-only provider. Never import `@tiun/sdk` from a server component.

```tsx
// app/tiun-provider.tsx
'use client';

import { tiun } from '@tiun/sdk';
import { createContext, useEffect, useState } from 'react';

export const TiunUserContext = createContext<unknown>(null);

export function TiunProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<unknown>(null);

  useEffect(() => {
    tiun.init({ snippetId: process.env.NEXT_PUBLIC_TIUN_SNIPPET_ID!, language: 'en' });
    const off = tiun.on('userChange', (data) => setUser(data.user));
    return () => {
      off();
      tiun.destroy();
    };
  }, []);

  return <TiunUserContext.Provider value={user}>{children}</TiunUserContext.Provider>;
}
```

Wire it into `app/layout.tsx`:

```tsx
import { TiunProvider } from './tiun-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body><TiunProvider>{children}</TiunProvider></body>
    </html>
  );
}
```

### Vue 3 (SPA)

Init in `onMounted()` of the root `App.vue`. Do **not** call `destroy()` at the root — the root only unmounts when the document is gone anyway.

```vue
<script setup>
import { tiun } from '@tiun/sdk';
import { onMounted, ref } from 'vue';

const isAuthenticated = ref(false);
const user = ref(null);

onMounted(() => {
  tiun.init({ snippetId: import.meta.env.VITE_TIUN_SNIPPET_ID, language: 'en' });
  tiun.on('userChange', (data) => {
    isAuthenticated.value = data.isAuthenticated;
    user.value = data.user;
  });
});
</script>
```

For multi-component apps, lift this into a Pinia store or a `useTiun()` composable that other components consume.

### Nuxt 3

Client-only plugin. The `.client.ts` suffix tells Nuxt to never run this on the server.

```ts
// plugins/tiun.client.ts
import { tiun } from '@tiun/sdk';

export default defineNuxtPlugin(() => {
  const { tiunSnippetId } = useRuntimeConfig().public;
  tiun.init({ snippetId: tiunSnippetId as string, language: 'en' });
  return { provide: { tiun } };
});
```

Configure the snippet in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      tiunSnippetId: process.env.NUXT_PUBLIC_TIUN_SNIPPET_ID,
    },
  },
});
```

### Svelte / SvelteKit

Init in root `+layout.svelte`'s `onMount`. Expose a writable store other components subscribe to.

```svelte
<script context="module">
  import { writable } from 'svelte/store';
  export const tiunUser = writable(null);
</script>

<script>
  import { tiun } from '@tiun/sdk';
  import { onMount } from 'svelte';
  import { PUBLIC_TIUN_SNIPPET_ID } from '$env/static/public';

  onMount(() => {
    tiun.init({ snippetId: PUBLIC_TIUN_SNIPPET_ID, language: 'en' });
    tiun.on('userChange', (data) => tiunUser.set(data.user));
  });
</script>

<slot />
```

### Solid / SolidStart

Init in root component's `onMount`; bind to a signal.

```jsx
import { tiun } from '@tiun/sdk';
import { createSignal, onMount } from 'solid-js';

export function App() {
  const [user, setUser] = createSignal(null);

  onMount(() => {
    tiun.init({ snippetId: import.meta.env.VITE_TIUN_SNIPPET_ID, language: 'en' });
    tiun.on('userChange', (data) => setUser(data.user));
  });

  return <Routes user={user()} />;
}
```

### Astro islands

Each island is a remount-capable subtree, so call `destroy()` on cleanup. Use `client:load` directives on framework islands; for framework-less islands, inline `<script>` works.

```astro
---
const snippetId = import.meta.env.PUBLIC_TIUN_SNIPPET_ID;
---
<button id="buy">Subscribe</button>
<script define:vars={{ snippetId }}>
  import { tiun } from '@tiun/sdk';

  tiun.init({ snippetId, language: 'en' });
  const off = tiun.on('userChange', () => {
    // update DOM
  });

  document.getElementById('buy').onclick =
    () => tiun.checkout({ productId: 'p-live-pro' });

  window.addEventListener('beforeunload', () => {
    off();
    tiun.destroy();
  });
</script>
```

### Angular

Init in a root-provided service's constructor. Bind state to a signal or `BehaviorSubject` other components consume.

```ts
import { Injectable, signal } from '@angular/core';
import { tiun } from '@tiun/sdk';

@Injectable({ providedIn: 'root' })
export class TiunService {
  readonly user = signal<unknown>(null);

  constructor() {
    tiun.init({ snippetId: 'YOUR_SNIPPET_ID', language: 'en' });
    tiun.on('userChange', (data) => this.user.set(data.user));
  }
}
```

A root-provided service lives for the app's lifetime, so no `ngOnDestroy` cleanup is needed. For services scoped mid-tree (e.g. per route), call `off()` and `tiun.destroy()` from `ngOnDestroy`.

### Mobile WebView

The SDK runs **inside** the WebView. The native shell does not call the SDK directly. To bridge entitlement checks to native code, expose a function that returns a JWT from `getUserVerificationToken()`:

```javascript
import { tiun } from '@tiun/sdk';

tiun.init({ snippetId: window.TIUN_SNIPPET_ID, language: 'en' });

window.getTiunVerification = async () => {
  const token = await tiun.getUserVerificationToken();
  return JSON.stringify({ token });
};
```

The native host calls `getTiunVerification()` via its JS bridge (e.g. `evaluateJavascript` on Android, `WKWebView.evaluateJavaScript` on iOS) and forwards the token to its own backend. The backend verifies it server-side — see [server-verification.md](server-verification.md).

If the native host swaps the WebView URL (full reload), no `destroy()` is needed. If it swaps DOM content without reload, call `destroy()` first.

## Lifecycle / `destroy()` matrix

The question is: *can the SDK subtree remount in this host?*

| Situation | Call `destroy()`? | Why |
|---|---|---|
| SPA root (Vue `App.vue`, single React root, Svelte/Solid root) | No | Root only unmounts when the document is gone |
| React under StrictMode | Yes (in `useEffect` cleanup) | StrictMode double-invokes effects in dev |
| Component mid-tree that mounts/unmounts repeatedly | Yes | Stale listeners accumulate otherwise |
| Micro-frontend inside a long-lived host | Yes | Host remounts the subtree without reloading the page |
| Astro island, Qwik resumability | Yes | Each island is a remount-capable subtree |
| Server-rendered page (vanilla HTML, classic PHP) | No | Page reload tears down everything |
| Mobile WebView swapping page URL | No | Whole document is replaced |
| Mobile WebView swapping DOM content without reload | Yes | Same instance survives, accumulates state |
| Tests | Yes (per test) | Each test wants a clean instance |

## SPA vs MPA gating model

- **SPA** (React Router, Vue Router, SvelteKit, etc.): subscribe to `userChange` once at the root; gate components reactively. Entitlements can change mid-session.
- **MPA** (classic server-rendered apps): `init` runs per page load; gating happens primarily on the server via [server-verification.md](server-verification.md). Client-side gating in an MPA is cosmetic only — the server is the gatekeeper.
