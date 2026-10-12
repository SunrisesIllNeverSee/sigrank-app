# LIVE BOARD — Production Integration Closeout (Phase 2B/2D)

**Branch:** `feat/live-board-2b` · **Date:** 2026-10-06 · **Repo:** `sigrank-app-live-board`
**Reference:** `b2bpilot/_workspace/live-board-prototype/` (tag `reference-v1`, frozen)
**Status:** all second-review punch-list items resolved; verification gates green; **not pushed, not merged.**

---

## 1. Scope

Final production-integration pass for the live board mounted at
`/board/[window]` (`7d | 30d | 90d | all`). Every defect listed by the second
reviewer was verified and fixed. The workspace preserves reference-v1 visual
parity and adds production behaviors the prototype only stubbed: real
pagination over lazily hydrated rows, CSV export, honest loading/empty/error
states, keyboard accessibility, resolved operator identities, nullable
movement semantics, production footer copy/links, and minimal funnel
analytics.

## 2. Files changed, per workstream

| Workstream | Files | Commits |
|---|---|---|
| Movement null semantics + rail identities + row a11y | `lib/board/live-projection.ts`, `components/live/utils.ts`, `MoversRail.tsx`, `HallRail.tsx`, `rows.tsx`, `demo.tsx` | `323f75c` |
| Dock tablist keyboard contract | `components/live/OperatorDock.tsx` | `6810a76` |
| Pagination + CSV + hydration states + footer + analytics | `components/live/LiveBoardWorkspace.tsx`, `app/board/[window]/live-board-mount.tsx`, `components/live/analytics.ts` (new), `components/live/proto-scoped.css` | `9208c1a` |
| This report | `docs/LIVE_BOARD_INTEGRATION.md` | `docs(live):` |

Untouched (verified, no regression): `app/board/[window]/page.tsx`,
`app/api/live-board/route.ts`, `app/globals.css`, `app/layout.tsx`,
`components/live/enrich.ts`, `components/live/session.ts`,
`lib/board/live-types.ts`.

## 3. Punch-list mapping

| # | Defect | Fix | Where |
|---|--------|-----|-------|
| 1 | Movers rail rendered raw codename (`signal-f2b5be16b0f`) | `MoverRow` now carries `name` (resolved handle → codename fallback) + `codename` (lookup/dedupe key) | `MoversRail.tsx:25–58` |
| 1b | Dead `ALL MOVERS →` `href="#"` | removed; comment documents no production movers route exists | `MoversRail.tsx:109–111` |
| 2 | `windowSel` stale after `router.push` window swap | `useEffect` re-syncs `windowSel` from `initial.meta.window` (self-heals without relying on the remount key) | `LiveBoardWorkspace.tsx:214–219` |
| 3 | Pagination chrome inert; count from population | `PAGE_SIZE = 10` (`utils.ts:153`); `lastPage` derives from **loaded** `ordered.length`; `pageRows = ordered.slice(...)` renders the current page; `totalPages` is the field horizon so `…`/next can advance past loaded and trigger `fetchMore`; page clicks retry hydration on soft-fail | `LiveBoardWorkspace.tsx:447–483, 936–1045` |
| 4 | `⬇ Export CSV` was a dead span | client-side Blob download of the **loaded + sorted + filtered** field, 14 columns incl. both identities (`codename`, `handle`); `movement_7d` column exports `""` for null | `LiveBoardWorkspace.tsx:486–545, 1041` |
| 5 | Dead footer anchors | `LEADERBOARD → /board/all` (Next `Link`; bare `/board` is not a route — `/leaderboard` 301s to `/board/all`), `WRAPPED` removed, `SHARE` renders only when a real `/s/<codename>` target exists | `LiveBoardWorkspace.tsx:1121–1137` |
| 6 | `live-board prototype · not production` footer copy | production copy: `SIGNALAF × SIGRANK — production live board · RULESET <meta.ruleset> · <fmode> · POWERED BY MO§ES™ · <privacy>` | `LiveBoardWorkspace.tsx:1138–1142` |
| 7 | `Math.round(null)` → fake `0` movement | `mv7`/`mv24` null-preserving in projection; `delta` copy omitted when unknown (falls through to trend-derived delta); `mvLabel(null) → "—"`; `deriveMovers` excludes null rows (an unmoved row is not a mover); demo fixture exercises null paths | `live-projection.ts:161–166, 195–199, 217–219`; `utils.ts:275–289, 411–414`; `demo.tsx:56–58, 75–76` |
| 8 | Row `tr` click-only; dock tabs visual-only | `tr` gains `tabIndex` + Enter/Space + `aria-current`; dock tabs are a real tablist (roving tabindex, `aria-selected`, `aria-controls → #lbw-dockpanel`, `role="tabpanel"` + `aria-labelledby`, Arrow/Home/End nav); Escape docks the card (same action as ⇄ TO RAIL); mover rows + hall hexes get `role="button"` + keys | `rows.tsx:126–144`; `OperatorDock.tsx:437–451, 462–469, 480–520`; `MoversRail.tsx:72–89`; `HallRail.tsx:81–102` |
| 9 | No honest board states | tbody empty row distinguishes scope-empty vs filter-empty vs syncing; `.pgn` shows `⟳ SYNCING FIELD…` (role=status) and `FIELD SYNC FAILED — CLICK A PAGE TO RETRY` (role=alert); movers/hall empty states added | `LiveBoardWorkspace.tsx:951–960, 963–991`; `MoversRail.tsx:106–108`; `HallRail.tsx:110–112` |
| 10 | Analytics missing | new `components/live/analytics.ts` (`liveTrack`, same `on()` env-guard + `baseProps()` shape as `lib/infra/posthog/events.ts`): `live_board_operator_selected` (user picks only — mount selection excluded), `live_board_theme_changed`; reuses shared `track.boardViewed` (mount/window/view swap) + `track.boardShared("download")` on CSV | `analytics.ts`; `LiveBoardWorkspace.tsx:252–274, 539–543, 709` |
| 10b | `:has()` chrome isolation risk | **verified safe — no change needed** (§7) | `app/globals.css:772–777` |
| 10c | Rate-limit contract | confirmed: `MAX_LIMIT = 2000` clamp, `rateLimit`/`rateLimitHeaders`/`rateLimitedResponse`, `Cache-Control` on both success + error paths; client treats `!res.ok` as soft-fail → `fieldStatus="error"` → retry via page clicks | `app/api/live-board/route.ts:50–99`; `live-board-mount.tsx:103–145` |

## 4. Architecture / adapters

```
getLiveBoardInitialState (server, lib/board/live-projection.ts)
  → LiveBoardInitialState
      operators: first page (≤200 rows)        movers/hall/fieldStats/fieldMax: FULL scope
      population.count / totalOperators: same-scope ranked denominator (never hard-coded)
  → app/board/[window]/page.tsx  (SSR: JsonLd + FAQ AEO + <LiveBoardMount> + legacy subtree)
  → live-board-mount.tsx (client)
      loads remaining field via /api/live-board?window&offset&limit≤2000
      rows re-enter through an augmented `initial` prop (codename-deduped)
      fieldStatus: idle|loading|ready|error → workspace
      ?v=legacy post-mount swap keeps page static/ISR-cacheable
  → LiveBoardWorkspace (client, reference-v1 port)
      sort/filter/search over loaded ops → ordered → pageRows (PAGE_SIZE=10)
      detail enrichment: createDetailFetcher(window) — per-codename lazy
      fan-out (profile+history+records+snapshot-history), session-cached,
      merged onto rows via mergeDetail (never bulk-loaded)
```

### `LiveBoardInitialState` contract (unchanged)

- `operators` — first page only; hydration appends through the prop.
- `population.count` / `totalOperators` — full ranking scope (denominator
  for "of N" copy and the pagination horizon — **never** the page-count
  source; page count is `ceil(ordered.length / 10)` over loaded rows).
- `fieldMax`, `fieldStats`, `movers`, `hall` — computed from the full scope
  server-side so normalization never drifts with the loaded page.
- `mv24`/`mv7: number | null` — absent movement is null end-to-end
  (projection → mergeDetail patch — only `typeof === "number"` values
  overwrite — → `mvLabel → "—"`).

## 5. Routes verified

| Route | State |
|---|---|
| `/board/7d·30d·90d·all` | prerendered (SSG, `●`) — workspace SSR + JsonLd (Dataset + ItemList + FAQPage AEO) + dynamic H1; untouched |
| `/api/live-board` | `ƒ` dynamic — window validation, `offset`/`limit≤2000`, rate-limit headers, 1800s cache |
| `/s/[codename]` | untouched — always `robots: noindex,follow` + `canonical → /user/<codename>` (lines 119–122) |
| `?v=legacy` | intact — post-mount client swap, keeps the page static; `body:has(.lbw-root)` rules don't match the legacy surface so site chrome returns |
| `/board` (bare) | **not a route** — footer link therefore targets `/board/all` |

## 6. SEO / share / AEO

- `/board/[window]` still emits `JsonLd` (`sigrankDataset` +
  `leaderboardItemList` + 5-question `faqPage`) at page level — outside the
  client workspace, so the flag/hydration path can't affect it.
- `/s/[codename]` metadata contract unchanged.
- `SHARE` footer link + dock SharePreview still target real `/s/<codename>`
  surfaces; `COMPARE` seeds `/compare?a=<codename>`.

## 7. Shell isolation (`:has()` audit)

`globals.css:772–777` hides `body > nav|div|footer|iframe` when `.lbw-root`
exists. Audited every direct `<body>` child emitted by `app/layout.tsx`:

| Child | Element | Match |
|---|---|---|
| `JsonLd`, `THEME_INIT`, GA4 `Script` ×2 | `<script>` | no |
| `PostHogProvider` | renders a fragment (verified `components/analytics/PostHogProvider.tsx`) | no |
| `Nav`, `Footer` | `<nav>`, `<footer>` | yes — intended |
| `DemoBanner` | `<div>` | yes — **the intended `> div` target** |
| `NavNpxCTA` | `null` off `/` | n/a |
| `SpeedInsights`, `Analytics`, `WebMcpRegistrar` | script / `null` (verified renderless) | no |
| `main:has(.lbw-root)` | released to workspace 100vh | intended |

`body > div` catches exactly one node: the DemoBanner. Any future
direct-child portal div is the documented guard intent, not a leak. **No
narrowing applied — rule left byte-identical.**

## 8. Theme / session wiring (unchanged, verified)

- Workspace theme stays on `.lbw-root[data-theme]` — `?theme=` →
  `localStorage("lbw-theme")` → `"green"`; `documentElement` untouched;
  `LBW_THEME_INIT` prevents flash. `liveTrack.themeChanged` added on swatch
  clicks.
- `Shift+T` now cycles the workspace's own palettes while the board is
  mounted (same guards as `ThemeCycleShortcut`: Shift-only, never inside
  inputs). The site-wide handler still swaps `documentElement` behind the
  workspace — harmless; `.lbw-root` owns its theme.
- `/api/auth/session` surface intact: loading / signed-out / unlinked /
  linked / demo-override account chrome unchanged.

## 9. Verification — exact results

| Gate | Command | Result |
|---|---|---|
| TypeScript | `bunx tsc --noEmit` | **0 errors** |
| Canonical | `bun run test:canonical` | **11/11 pass** |
| Unit suite | `bun run test` (node --test `*.test.mjs`) | **666 pass / 0 fail / 4 skipped** |
| UI suite | `bun run test:ui` (vitest) | **150/150 pass, 15 files** (incl. `live-projection.test.ts` 18) |
| ESLint (scoped) | `eslint components/live app/board app/api/live-board lib/board` | **0 errors**, 2 pre-existing warnings in files not touched (`SignalLiveDemo.tsx` img, `batched-windows.ts` unused var) |
| Build | `fnm exec --using=22 npm run build` | **success** — `✓ Compiled successfully`; `/board/{7d,30d,90d,all}` `●` SSG, `/api/live-board` `ƒ`, `/board/[window]/og` present |

**Node/toolchain note:** repo pins Node 22 (`.nvmrc`, `engines`) — build ran
under `fnm`'s Node 22.23.1. First `next build` attempt failed on an
**environmental** issue unrelated to this change: the worktree's
`node_modules` had been hydrated from a stale, untracked `bun.lock`
(tailwindcss 4.3.3) while `package-lock.json` pins 3.4.x — PostCSS config
uses the v3 plugin shape. Fixed by `npm install --no-save
--package-lock=false tailwindcss@3.4.19` under Node 22 (reconciled 339 add /
543 remove / 182 change) + `rm -rf .next`; no tracked lockfile was modified.
`npm ci` could not run because the tracked `package-lock.json` is itself out
of sync with `package.json` (missing `uuid`/`ws`/`decode-uri-component`
transitives) — **owner should regenerate the lockfile**.

## 10. Deviations from reference-v1 (with justification)

| Reference | Production | Why |
|---|---|---|
| Decorative page buttons `1 2 3 … 166` from `ceil(pop/10)` | Buttons derive from loaded rows; `…` = next page that can hydrate deeper; middle-page chip renders the current page | population is the full scope, hydrated lazily — a 166-label button would promise pages that don't exist yet |
| `Export CSV` decorative span | Real Blob download | required functional control |
| Dead `ALL MOVERS →`, `WRAPPED`, `LEADERBOARD #`, `SHARE #` | Removed or pointed at real routes | no fabricated production surfaces |
| `live-board prototype · not production` | Production provenance copy (ruleset + live sync time + privacy) | production surface |
| Click-only rows/rails, visual tablist | Keyboard contract (Enter/Space, roving tabs, Escape) | a11y requirement — additive, reference has no keyboard model to preserve |
| `mv7 ?? 0` mover derivation | Null rows excluded from movers | a mover must have moved; avoids ranking unmoved rows |
| Rows render all operators | Rows render current page (10) | pagination is now real; the full set remains one page-size away |
| "What is this?" prose under the board | Moved inside the `?v=legacy` subtree | owner: the workspace is board-only — prose stays on the legacy surface |

## 10a. Owner-feedback pass (post-closeout)

- **Display-name identity end-to-end** — `LiveOperator.name =
  operatorDisplayName(...)` headlines rows, hall tiles, dock header, search,
  and CSV; `codename` remains the secondary identity line + URL/lookup key.
  (The fixture's codenames *were* names, which masked the bug.)
- **Workflow filter replaces the mode concept** — `Both` (default, the
  combined field) / `HITL` / `Agentic` / `Hybrid`. `wfSel === "both"` skips
  filtering entirely so unresolved `wf: null` rows still render; single-mode
  options filter on the resolved mode. `?mode=hitl|agentic|hybrid` is read
  post-mount and carried through window navigation. Row badges show
  HITL/AGENTIC/HYBRID on the platform cell.
- **`"hybrid"` added to the stored-mode vocabulary** — `WorkflowMode`,
  `BoardSnapshot.workflow_mode`, `LeaderboardRow.workflow_mode`, and
  `LeaderboardEntry.workflowMode` widened to `hitl | agentic | hybrid`.
  `resolveWorkflowMode` passes an assessed `hybrid` through under the same
  https-evidence gate as `agentic`; the heuristic itself still only derives
  `hitl`. The legacy board's `includesBoardMode` unchanged in behavior
  (`all` matches hybrid; `hitl`/`agentic` pills don't).
- **Throughput tooltip** — `∑ TOTAL` cell title shows exact
  processed/output tokens-per-day when rates exist.

## 11. Known limitations / owner-action items

- **`signa_rate` → resolved** — the history route now emits `yield_` per
  point (the data layer already computed it; the API was dropping it). The
  sparkline binds the Υ series and is labeled `YIELD HISTORY · Υ`;
  `signa_rate` remains only as a labeled fallback when an operator has no
  compounding snapshots (`trendKind: "score"`).
- **Tools tab partial** — dock `tools` tab remains reference-parity partial;
  deeper per-tool breakdown is not wired to a dedicated API.
- **Compare is seeded, not embedded** — `?a=<codename>` seeds `/compare`;
  the in-board slot grid remains reference chrome.
- **Lockfile hygiene (owner)** — `package-lock.json` vs `package.json` drift
  blocks `npm ci`; stale `bun.lock` in this worktree caused the tailwind v4
  build failure. Regenerate + pick one package manager.
- **Node version (owner)** — `.nvmrc`/engines pin 22.x; machine default is
  v26 — run builds via `fnm exec --using=22`.
- **Visual verification** — not run (no browser session in this pass);
  parity rests on the frozen `proto-scoped.css` + unchanged markup classes.
- **Analytics reach** — events no-op when PostHog env keys are absent
  (same guard as `lib/infra/posthog/events.ts`).
- `?v=legacy` subtree remains for soak — removal is a separate cutover task.
