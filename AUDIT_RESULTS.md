# SignalAF Rebuild — Staging Audit Results

**Audit target:** `integration/site-a315435` @ `1a505a0`, previewed at `http://localhost:3230`.
**Fix branch:** `audit/site-a315435` (this worktree `_audit_fixes_20261013`), PR target `integration/site-a315435`.
**Status label:** Production flipped mid-audit — `signalaf.com` now serves the rebuild (verified: `/sigrank`, `/articles`, `/s/xoxo`, `/hall/badges`, `/share/four-degrees` all 200 + `pv2-`/`prl-` markers in `/user/xoxo` HTML; `/editor/review` correctly 404s as dev-only). Visual-pass findings below were taken against **live** signalaf.com where noted.
**Method:** deterministic 235-route sweep + 3 parallel lanes (wiring trace, Playwright Chromium+WebKit interaction audit, static link-graph audit) + targeted verification. Lane artifacts: `/tmp/pw-audit/*.mjs`, `/tmp/audit-*.png`.

## Deployment-gap note

| | commit | delta vs deployed |
|---|---|---|
| Live `signalaf.com` | `54484c7` (PR #243 = Oct-10 baseline + markdown-404 fix) | — |
| Staged `integration/site-a315435` | `1a505a0` | **+69 commits / 364 files / +44,356−3,565** |

Missing from prod: 7 new routes (`/articles`, `/sigrank`, `/hall/badges`, `/s/[codename]`, `/share/four-degrees`, `/editor/review`, `/wiki/metrics/scale-v`) + all redesigned surfaces (live board, profile-v2 rail, compare, badges, share, watchlist, review editor). All 225 prod routes still resolve in staging.

## Route sweep (:3230, 235-route manifest)

**234/235 → 200.** Sole non-200: `/search` → 404, confirmed INTENTIONAL — `app/search/page.tsx` returns `notFound()` while `NEXT_PUBLIC_FEATURE_EXCHANGE_SEARCH` is off; Nav hides the entry under the same flag (`components/ui/Nav.tsx`). Rollout shell, not a defect.

## Owner review-editor checklist (`~/Downloads/signalaf-review.md`, 1 open item)

| Item | Result |
|---|---|
| `/login` "Continue with GitHub" — thin solid outline @ 750×662 | **VERIFIED OK** — computed `1px solid rgb(38,54,28)`; visible on card. Note: a separate site-wide regression (F-1) stripped its background fill — the outline itself always survived. |

## Findings — FIXED on `audit/site-a315435`

| ID | URL | Issue | Severity | Reproduction | Implemented fix | File/line | Commit | Verification | Remaining |
|---|---|---|---|---|---|---|---|---|---|
| F-1 | `/login` + every page | `proto-scoped.css` `.lbw-root button/a` element resets (spec. 0,1,1) beat Tailwind `bg-*`/`text-*` utilities — gold magic-link CTA rendered as plain text, OAuth button lost fill | MED | playwright: `bg-gold` button → `background:rgba(0,0,0,0)` | Lowered resets to `:where()` (zero-specificity) — matches existing pattern `globals.css:163` | `components/live/proto-scoped.css:80-81` | `26f7d6f` | playwright: CTA restored `rgb(224,178,64)`+dark text; GitHub outline kept; board proto buttons unaffected | none |
| F-2 | `/` + nav pages | `NavNpxCTA` nested `<CopyButton>` (a `<button>`) inside `<button>` → invalid HTML → hydration mismatch, client re-render | MED | console: `<button> cannot be a descendant` + hydration error on `/` | Outer element → `<div>` (pill styling kept; Copy button stays the copy target) | `components/ui/NavNpxCTA.tsx:17-40` | `0707aba` | playwright: hydration error gone on `/` | none |
| F-3 | `/`, `/board/all` | React duplicate-key `0` ×4-8/page — `visible.flatMap(m => chart(m))` made each metric's `key={i}` children siblings | MED | console `same key '0'`; fiber walk → 5 `<path>` + `<rect>` siblings keyed `0` under `CombinedSignal` | Metric-qualified keys: `` `${m.id}-${i}` `` on paths + bars | `components/live/CombinedSignal.tsx:398` | `0707aba` | playwright: 0 dup-key errors, chart renders | none |
| F-4 | `/pricing` | Same class of bug — `freeFeatures` keyed by `href`, `/developers` appears twice → dup-key warning | LOW | console `same key '/developers'` on `/pricing` | `key={title}` (titles unique) | `app/pricing/page.tsx:56` | this commit | playwright: 0 dup-key errors on `/pricing` | none |
| F-5 | `/s/[codename]` | "Compare / VS" capture card hardcoded `b=the-field`; `the-field` is excluded from live compare (`compare-live.ts:10`) → URL claims a matchup the resolver silently substitutes | LOW-MED | link href `?a=xoxo&b=the-field` renders a different opponent | Dropped `&b=the-field` — resolver picks deterministic B; URL no longer lies | `app/s/[codename]/page.tsx:265` | this commit | playwright: href now `/compare?a=xoxo` | optional: substitution notice in compare (R-5) |
| F-6 | `/about`, `/vercel` | Dead anchors: `/support` links `/about#install` and `/vercel#diagnostic` — neither `id` existed (200 + no scroll) | LOW | static trace; `id` absent in served HTML | Added `id="install"` (FAQ `<details>` w/ `npx sigrank`) and `id="diagnostic"` (diagnostic `<section>`) | `app/about/page.tsx:223`, `app/vercel/page.tsx:60` | this commit | playwright: inner `.stage` scroller → el top:24 (hash) vs top:3708 (no-hash) | none |
| F-7 | `/compare` | `ChallengeBar` "Enter arena →" links `/arena?challenge=` — **no `/arena` route exists** (Phase-4 external app). Gate `GATE_CHALLENGES` alone → latent 404 whenever challenges enabled | MED (latent) | static: `app/arena` absent; flag default `false` both envs | Gated the CTA on `GATE_ARENA` (documented dependency; `challengesEnabled()` exists but was dead code) | `components/compare/ChallengeBar.tsx:19,86` | this commit | tsc; flag-off render unchanged | owner-input: `/arena` route/app URL when GATE_ARENA ships (R-9) |
| F-8 | `/` dock + `/api/v1/operators/*` | Claimed op absent from `claimedRankMap` (unresolved-mode snapshots) → `global_rank:0` surfaces as literal `#0` in dock chip; session.rank=0 | MED | code trace `queries.ts:625-633` → `session.ts:88` → `LiveBoardWorkspace.tsx:1326` | Display layer: `sess.rank` only set when `g>0`; dock chip `rank>0` guard → renders `—` (matches hero UNRANKED convention) | `components/live/session.ts:89`, `LiveBoardWorkspace.tsx:1326` | this commit | tsc; unranked → `—` | API `current_rank:0` contract — owner-input (R-1) |
| F-9 | `/api/v1/claim` | Comment claims "Rate-limited via the standard gate" — **no `rateLimit` call exists**; exact-token claim check brute-forceable per IP | MED | code trace: no `rateLimit(req)` in POST | Added `rateLimit(req)` + `rateLimitedResponse` (sibling-route pattern) | `app/api/v1/claim/route.ts:6,36-37` | this commit | tsc; pattern identical to `operators/route.ts:30` | optional: per-user attempt lockout (R-6) |
| F-10 | `/api/v1/operators/{c}/history` | Missing per-IP `rateLimit` its siblings apply (`records`, `operators/{c}`) | LOW | code trace | Added same two-line gate | `app/api/v1/operators/[codename]/history/route.ts:13-16,24-25` | this commit | tsc | none |
| F-11 | `/api/v1/account/removal-request` | Raw user `handle` interpolated into email `subject:` — header-injection primitive | LOW | code trace `route.ts:95` | Strip control chars before trim/slice | `app/api/v1/account/removal-request/route.ts:71-74` | this commit | tsc | none |
| F-12 | `/user/X` (case-variant) | Owner gates compare codename case-sensitively — `/user/XOXO` loads profile (ilike resolves) but hides owner edit/kernel/watchlist | LOW | `ProfileAuthGate.tsx:66`, `SubmissionsView.tsx:385`, `MyWatchlist.tsx:13` all `===` | `.toLowerCase()` both sides at all three gates | same files | this commit | tsc | none |
| F-13 | `/user/%25`, `/api/v1/operators/%` | `.ilike("codename", codename)` unescaped — `%`/`_` URL segments wildcard-match the first operator (identity confusion + enumeration primitive); public data only | LOW | static: 6 `.ilike` sites in `queries.ts` | `escapeLike()` helper (`[%_\\]` → `\…`) applied at all 6 sites; case-fold preserved | `lib/board/queries.ts:261-263` + 6 call sites | this commit | tsc 0 err | none |
| F-14 | `/hall`, homepage stats strip | `getHallOfSignal` + `getHomepageStats` FK-embed base `operators` — bypass `operators_public` visibility contract → private-profile op holding a badge/top spot leaks codename/display_name | LOW | code trace `queries.ts` both joins | Hall: batched `operators_public` visibility lookup, private → `unknown` (fail-closed). Stats: `top_operator_id` resolved via `publicOperatorCodename()` (public-only, `""` fallback) | `lib/board/queries.ts:992-1011,1026-1052,1120-1137` | this commit | tsc 0 err; full suite 682/0 fail | none |

## Findings — RECOMMENDATION / OWNER-INPUT (no code change)

| ID | Item | Severity | Detail | Recommended action / owner decision needed |
|---|---|---|---|---|
| R-1 | `/api/v1/operators/{c}` `current_rank` emits `0` for claimed-unranked | MED | Display leak fixed (F-8) but API still returns `global_rank:0, percentile:0` — `#0` is not a representable rank | Owner decision: emit `null`/unranked sentinel (contract change) vs rank_history fallback (reintroduces the basis mismatch the 2026-09-27 fix removed). Recommend `null` + doc note |
| R-2 | `/api/v1/premium/insights` + `/cascade-report` serve canned data behind `withX402` payment gate | **HIGH (integrity)** | Hardcoded `archetype_distribution` incl. the Υ-18436.98 seed; identical "analysis" for any `?codename=` (`insights/route.ts:17-46`, `cascade-report/route.ts:25-60`) | Owner decision: wire real computation, ship explicit `mock:true`/demo flag, or 501 until implemented. Not silently patched — product/pricing call |
| R-3 | `?mode=hitl` cohort semantics diverge API↔UI | MED | `includesBoardMode("hitl",null)===true` (`workflow-mode.ts:35`) but workspace filter excludes null-mode rows from HITL — API `?mode=hitl` returns rows the site rail hides | Owner decision on canonical semantics; then align `includesBoardMode` or document the divergence in `api_spec` |
| R-4 | Default `/api/v1/leaderboard` mixes unclaimed rows; rank basis ≠ `/board/all` | LOW | `claimedOnly: mode!==null` (`route.ts:79`) renumbers over the mixed corpus | Document the full-corpus contract, emit both ranks, or default `claimedOnly:true` |
| R-5 | `/compare` silent operand substitution, no notice | LOW | `?a=bogus&b=zzz` → 200 with day-seeded pair, URL still claims invalid codenames (`resolveLiveComparePair` `?? fallbackA`) | Optional UX notice "requested operator unavailable — showing X vs Y". Partially mitigated by F-5 |
| R-6 | Back-nav resets scroll + board filter state | LOW | mode/platform/class/sort are client-state only (window is the sole deep-link unit) | Product call: lift filter state into query params (shareable filtered views) vs accept reset |
| R-7 | `?v=legacy` window selector still offers `"off"` | LOW | `/board/off` → 308 `/board/all` — option leads somewhere other than labeled | Remove `"off"` from `WINDOW_OPTS` (`LeaderboardTable.tsx:323`) — legacy surface, cosmetic |
| R-8 | Footer `/marketplace` label mismatch | LOW | Route is a `noindex` internal asset index (PNG/SVG grid), not a product marketplace | Relabel or relink — copy/SEO decision |
| R-9 | `/arena` route/app missing | MED (latent) | F-7 gates the link on `GATE_ARENA`, but enabling that flag still 404s — no same-origin route exists | Owner-input: arena app URL/route before shipping `NEXT_PUBLIC_GATE_ARENA=true` |
| R-10 | Session-cache staleness on SPA login transition | LOW | `session.ts:49` module cache invalidated only on sign-out/save — login then client-nav leaves dock/watchlist signed-out until reload | Dispatch `workspace-session-changed` post-login, or subscribe `onAuthStateChange` |
| R-11 | Watchlist owner-gate lacks its regression test on this branch | LOW | `__tests__/ui/owner-board-watchlist.test.tsx` exists in sibling staging snapshots, never merged here | Port the test file |
| R-12 | OAuth cancel lands silently | INFO | `/auth/callback?error=access_denied` → `/login?next=…` with no message; only `code`-exchange failures surface `?error=auth` | Optional: surface "sign-in cancelled" notice |
| R-13 | `?window=`/`?mode=` params silently ignored | INFO | `/board/all?window=7d` keeps the param, no effect (window is path-based) | Cosmetic — leave or strip |
| R-14 | `/compare` ~3px document overflow @375px & WebKit desktop | LOW | `scrollWidth` 378/375, 1443/1440 — edge leak on an intentionally-scrollable stage | Optional: audit `.stagecol`/`.board` edge padding at narrow widths |
| R-15 | Console noise | INFO | meta `;` parse warning (client-injected), JsonLd dev warning, `/api/auth/session` fetched twice | Optional cleanup; none user-visible |
| R-16 | Unencoded codename interpolation (hall/wrapped) | INFO | `HallWorkspace`, `HallClient`, `MetricTopTen`, `wrapped` build `/user/${codename}` raw vs `encodeURIComponent` elsewhere | Currently safe — `CODENAME_RE` `[a-z0-9-]`; tighten only if charset loosens |
| R-17 | Authenticated surface untested | — | No credentials in audit env — `/me` owner view, edit form, real watchlist, magic-link send verified from signed-out side only | Owner-input: run authenticated pass post-deploy |
| R-18 | `/s/[codename]` vs `/user/[codename]` | — | Both exist by design (`/s/` = share surface). Confirmed distinct content | none |

## Verified OK (key invariants — no defect)

- **Auth flows:** GitHub+X OAuth carry correct `redirect_to=http://localhost:3230/auth/callback`; `?next=` threading incl. double-encoding works; `?next=https://evil.example.com` + `//evil.example.com` both stripped; `?error=auth` displays; callback failure paths land sanely. No Google button exists (provider set = GitHub/X/email by design, `LoginButtons.tsx:97-143`).
- **Signed-out gates:** `/me`→`/login?next=/me`, `/me/edit`→`/login?next=/me/edit`, `/settings` renders designed signed-out state (appearance local-only, private sections gated), `/api/v1/profile` anon→`{operator:null}` clean.
- **Privacy:** kernel endpoint owner-only double-gated (401 anon); private report never serialized to RSC, 404s for non-owner; `mapOperator` redacts private fields; `/api/v1/me/watches` caller-scoped+RLS; badge prefs validated against earned marks; removal-request intentionally public+rate-limited; localStorage holds only theme/pin/posthog/review-notes — no operator identity.
- **Board/filters:** window deep-links distinct; mode/platform/class filters + column sort work; empty states designed; peek→profile 2-step is intentional; rank recompute over visible set verified in code.
- **Compare:** `?a=&b=` deep-link resolves; candidate set claimed/qualified/deduped/positive-telemetry; `the-field` excluded by contract; deterministic fallback.
- **Dialogs:** heatmap EXPAND + honors EXPAND → centered `<dialog>` (154-cell grid, Esc close) — verified Chromium + WebKit.
- **Navigation:** 80+ unique internal hrefs → 200; zero `javascript:void`/empty `#`; rail/coming-soon entries correctly `disabled` buttons not links; all redirects resolve (board/everything, board/off, /leaderboard→/board/all, /user→/user/the-field).
- **Scoring:** canonical 11/11; Υ formula + MOSES seeds untouched; RS.xx server-only.
- **Gates after fixes:** `npx tsc --noEmit` 0 errors · `npm run test:canonical` 11/11 · `npm test` 682 pass / 0 fail / 4 skip · playwright verification per row above.

## Post-publish follow-up (when rebuild deploys)

1. Verify `signalaf.com` serves the intended release commit (check for `pv2-`/`prl-`/workflow-mark markers in prerendered HTML + Vercel deployment ID).
2. Firecrawl-equivalent public inventory on the live domain (title/headings/outgoing-links/failures per page).
3. Re-run the auth + OAuth + `?next=` matrix against production env vars.
4. Authenticated pass (R-17).

---

## Visual/usability pass — live signalaf.com + staging :3230 (Chromium + WebKit + real Safari.app)

Owner checklist items incorporated: leaderboard filter spacing, Raw/Metrics radar overlap, Compare fixed stage/sidebars, Hall records, profile Settings alignment, holographic card/footer, badges, sharing controls.

| ID | Page | Owner instruction or finding | Proposed solution | Fixed in code? | File/line | Commit | Before/after evidence | Verified in Safari? | Outstanding decision |
|---|---|---|---|---|---|---|---|---|---|
| V-1 | every WorkspaceShell page @ ≤1050px | **Stage collapsed to 0–99px at 375px — content unreachable** (`/login` card, board, profiles, `/s/`, editorial). Owner directive (proto:128-131) intends pinned panels + horizontal access; only `/compare` implemented it (`compare-workspace.css:347`) | Generalized compare's `@media(max-width:1050px)` rule to all `.mid` variants incl. `.peek`/`no-rail`/`no-left` combos: `minmax(600px,1fr)` stage + `overflow-x:auto` | **YES** | `proto-scoped.css:302-313` | this commit | before: stage 36–99px, `.mid` no scroll; after: stage=600px, `.mid` scrollW 1068–1180 pannable | **YES** — WebKit: stageW=600, pan renders full board incl. sparklines/selects | none — collapse toggles stay opt-in per directive |
| V-2 | `/board/all` `.fbar` selects | Leaderboard filter spacing — Safari's native arrow chrome clipped labels to `All-ti⌄`/`Platfo⌄` at 72px | `appearance:none` + drawn SVG chevron reclaims ~14px; `title` now carries current value | **YES** | `board-cols.css:212-218`; `LiveBoardWorkspace.tsx:2009,2021,2033` | this commit | shot `vis-fix-fbar.png`: "All-time▾ Platform▾ Class▾" fully legible @72px (was clipped) | **YES** — `appearance:none` computed in WebKit | long selected values ("Claude Code") still clip ~2ch — tooltip shows full value |
| V-3 | `/s/xoxo` Card 02 (`/api/outreach-card`) | Public PNG rendered `GLOBAL RANK #0 / TOP 100.0%` for claimed-unranked operator — `#0` is not a rank | `hasRank` guard → `—`/`—` (same DASH convention as the card's other unranked fields) | **YES** | `outreach-card/[codename]/route.tsx:297-298,509,534` | this commit | Safari prod PNG showed `#0`/`TOP 100.0%`; fixed PNG shows `—`/`—` | **YES** (evidence captured from real Safari render) | API `current_rank:0` contract unchanged — R-1 owner decision |
| V-4 | every `.ftr` footer (all workspace pages) | `.flinks{overflow:hidden}` hid ~104px of nav links — API/PRIVACY/`npx sigrank` unreachable **even at 1440px** | `overflow-x:auto` + `scrollbar-width:none` + webkit scrollbar hidden — scrollable, visually unchanged | **YES** | `proto-scoped.css:634-635` | this commit | before sw528>cw424 dead links; after `ox:auto` measured | **YES** | none |
| V-5 | all `.railhead` panel headers | Bare text node clipped mid-glyph (sw310/cw247 — "…10XER_") — no ellipsis possible on anonymous flex item | Wrapped titles in `.rh-t` span with `overflow:hidden;text-overflow:ellipsis;min-width:0` (4 sites) | **YES** | `proto-scoped.css:274`; `WorkspaceShell.tsx:392,435`; `LiveBoardWorkspace.tsx:1869,2323` | this commit | `.rh-t` computes ellipsis, sw216/cw216 | **YES** | none |
| V-6 | `/compare` | ~3px document-level overflow (378/375, 1443/1440) | Edge leak on intentionally-scrollable stage | deferred | — | — | measured; no element flags outside scroll containers | n/a | optional `.stagecol` edge-padding audit |
| V-7 | all workspace pages (touch) | `.edge` collapse sashes `opacity:0` until hover — invisible on touch; `.rail-x` 30px / `.mvbtn` 16px sub-44px | V-1 makes content reachable via pan regardless; sashes still tappable | partially (V-1) | `proto-scoped.css:288-295` | — | — | n/a | owner decision: visible collapse affordance on touch vs current minimal-chrome intent |
| V-8 | all `.lbw-root` pages | `height:100vh` — iOS dynamic chrome can cover `.ftr` strip | `100dvh`/`100svh` progressive enhancement | deferred | `proto-scoped.css:79` | — | emulation can't reproduce; needs real-device check | n/a | recommended CSS tweak |
| V-9 | `/` | `NavNpxCTA` renders but `body:has(.lbw-root)>div{display:none}` suppresses it — dead UI on its only eligible page | Remove the render or scope it to non-workspace pages | documented | `globals.css:772-777` vs `NavNpxCTA.tsx:13` | — | computed `display:none` on `/` | n/a | owner decision: intentional suppression vs dead code |
| V-10 | `/user/*` | `.pv2-card-inner`/`.pv2-center-block` ~22px internal overflow | Card-art bleed by design — `.pv2-card` clips intentionally; Safari render is clean | n/a (intentional) | `profile-workspace.css` | — | Safari shot: holo card clean | **YES** | none |
| V-11 | `/compare` radars (owner item) | "overlapping Raw/Metrics radar shapes and legends" | Audited live: the Raw/Metrics pair is **numeric rows** on profiles; the dual radar pair exists only in compare — solid vs ghost variants distinguishable, legends legible | n/a (verified OK) | `CompareRadars.tsx`, `CascadeRadar.tsx` | — | Safari shot `safari-compare.png`: both radars clean, matchup bars aligned | **YES** | none |
| V-12 | `/s/xoxo` holo card + footer (owner item) | "holographic card/footer" | `.pv2-shine` runs `pv2-shine-sweep` animation (verified computed `animationName` in WebKit + Chromium); card/footer render clean | n/a (verified OK) | `profile-workspace.css` | — | real Safari.app capture `/tmp/safari-user-xoxo.png` + WebKit probe | **YES** | none |
| V-13 | `/hall` records (owner item) | Hall records legibility | `.ws-grid3` metric cards + `RecordTicker` render clean at desktop; mobile covered by V-1 pan | n/a (verified OK) | `hall-workspace.css` | — | 24-page sweep + shots | **YES** | none |
| V-14 | `/settings` (owner item) | "profile Settings alignment" | Normal document page — sections aligned both viewports; designed signed-out state gates private sections | n/a (verified OK) | `app/settings/page.tsx` | — | sweep: no overflow, no clip | **YES** | none |
| V-15 | `/hall/badges`, `/user/*?tab=badges`, share controls (owner item) | badges + sharing controls | `BadgeExplorer` medallions + criteria `clamp(2)` intentional; `UnifiedShare` portal clamps to viewport at 375; `ArtworkShareControls` wraps | n/a (verified OK) | `badge-explorer.css`, `UnifiedShare.tsx:229-243` | — | shots + portal-clamp math verified | **YES** | preview-modal scale ≈0.29 at 375 — legible but small; optional improvement |

### Visual-pass verification record

- **Engines:** Playwright Chromium + WebKit at 1440×900 and 375×812 against live `signalaf.com`; real Safari 27.0.1 window captures (`screencapture -l`) for `/user/xoxo`, `/s/xoxo`, `/board/all`, `/compare`.
- **Mobile reachability:** all workspace stages now 600px + pannable at 375px (was 36–99px dead slivers). `/login` sign-in reachable.
- **Shots:** `/tmp/vis-fix-fbar.png` (fixed toolbar), `/tmp/vis-wk-mob-stage.png` (WebKit panned board), `/tmp/safari-*.png` (real Safari), `/tmp/vis-*-*.png` (lane sweeps), `/tmp/outreach-fixed.png` (rank `—`).
- **Gates:** `tsc --noEmit` 0 · canonical 11/11 · `npm test` 682/0/4-skip · zero pageerrors during sweeps.
