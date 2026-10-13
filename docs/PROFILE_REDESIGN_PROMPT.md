# Profile Redesign — Integration into the Board Workspace

> **Scope:** This document is a planning-phase deliverable — the design brief
> and technical inventory for the profile redesign mock phase. It is NOT a
> completed implementation. The execution phases that follow are:
>
> 1. **Mock phase (next):** HTML/PNG mocks of each profile sub-page and module,
>    reviewed and iterated before any production code.
> 2. **Implementation phase:** production components, data wiring, tests, and
>    integration into the live board workspace.
> 3. **Verification phase:** tsc, lint, canonical tests, live preview, and
>    accessibility audit.
>
> Planning prompt: review, brainstorm, integration architecture, graphic creativity,
> data gap analysis, and improvement suggestions.

---

## 1. REVIEW — What exists today

### The current `/user/[codename]` profile
- **Standalone page** outside the four-column workspace shell
- **Tailwind + max-w-6xl centered** layout — no sidebar, no icon rail, no inspector
- **Server-rendered** header (identity + rank + badges) + **Suspense-streamed** body (5 heavy DB queries)
- **6-tab system** (Overview / Stats / Report / Lab / Submissions / Social) inside a `ProfileAuthGate` context
- **1372-line SplitFlapCard** — animated terminal printout, lazy-loaded via IntersectionObserver
- **4 independent client-side session fetches** on mount (`ProfileAuthGate`, `ProfileEditModal`, `CompareAgainstMe`, `TrackProfileView`)
- **OG image route** (`opengraph-image.tsx`) — Satori-rendered 1200x630 PNG, mirrors the SplitFlapCard layout

### The board workspace (`/board/all`)
- **Four-column shell:** icon rail | left sidebar | stage (table) | right inspector
- **Peek rail** — fifth column for quickviewing another operator
- **Inspector profile module:** OperatorProfileTile + dual radar / ColumnRanks slides + CombinedSignal + LineCarousel + records + ProfileActions (SEE PROFILE / COMPARE / WATCH)
- **Data already on the client:** `LiveOperator` has 43 fields — yield, SNR, velocity, leverage, 10xDEV, scaleV, efficiency, cost, raw pillars, trend, records, rank movements, percentile, archetype, class, platform, age, msgs, verification, etc.

### What the profile has that the board doesn't
| Data / Surface | Profile page | Board | Gap |
|---|---|---|---|
| Bio / location / links | Social tab | Not shown | Need new surface |
| Submissions grid (platform x window) | Submissions tab | Not shown | Need fetch + render |
| Snapshot history (paginated) | SnapshotHistory client | Not shown | Need endpoint integration |
| Operator report | Report tab (owner-only) | Not shown | Owner-gated; keep behind auth |
| Lab sandbox (yield calculator) | Lab tab (owner-only) | Not shown | Owner-gated; keep behind auth |
| Claim tab | ClaimTabGate (unclaimed) | Not shown | Only for unclaimed ops |
| OverviewTab charts | TierScatter, ArchetypeBubble, OverviewChart, TrophyRoom | Board has radar + ColumnRanks + CombinedSignal | Partially covered |
| Cascade fingerprint section | 9x KpiTiles, 2x CascadeRadar, OpRatioBar, HeatBar, EvolutionLine | ColumnRanks covers KPIs; DualSignatureRadar covers radar | Overlap; different visual |
| Field averages (vs avg / vs top) | Computed from full leaderboard | Board `ops` is **paginated** (first 200 rows) — NOT the full field. Use server-projected `fieldStats`/`fieldMax` for corpus-level aggregates, or add a dedicated cached endpoint | Requires server aggregates, not client `ops` |
| Tier progress (to next class) | computeTierProgress | Not shown | Small computation, add it |
| Trophy counts (gold/silver/bronze) | computeTrophyCounts (re-fetches hall) | Records in inspector | Partially covered |
| Build archetype detail (blurb, family) | OverviewTab archetype box | Board has `archetype` key only | Need blurb lookup |
| Profile edit modal | Owner-only | Not shown | Keep behind auth |
| Compare Against Me | Signed-in visitors | Board has COMPARE button | Already covered |
| SplitFlapCard (animated) | DeferredSplitFlapCard | Not on board | Link out vs embed |

---

## 2. PLAN — How to integrate

### Principle: the board IS the profile
The profile becomes a **drill state** of the board, not a separate page. When you select an operator on the board, the inspector IS their profile. The four-column layout means:
- **Left sidebar** — keeps its current modules by default (movers, compare, wire, notes, hall). Whether it contextually adapts when the stage shows a profile (e.g., swapping to profile sub-page nav) is an open design decision — see Section 7, Layer 0 for the options.
- **Stage** — table stays; optionally swaps to a **full-stage profile view** for deep-dive
- **Inspector (right rail)** — the profile modules stack here, scrollable
- **Peek rail** — quick comparison against the selected profile

### Inspector profile stack (the default drill)
When an operator is selected, the right rail shows:
1. **Identity module** — avatar, name, class badge, archetype chip, rank, percentile, HITL/agentic, platform
2. **Dual radar / Column Ranks** (existing slide pair)
3. **CombinedSignal + LineCarousel** (existing)
4. **Social card** — bio, location, links (NEW — small, collapsible)
5. **Trophy Room** — medal counts + records (existing, enhanced)
6. **Action row** — SEE FULL PROFILE / COMPARE / WATCH (existing)

### Full-stage profile (expand from inspector)
"SEE FULL PROFILE" doesn't navigate away — it **replaces the stage** with a deep profile view while keeping the sidebars. This view can hold:
- **Cascade fingerprint** — KPI grid + dual radar + op-ratio bar + heat bar (the Stats tab content, adapted to stage width)
- **Evolution chart** — score trajectory at full width
- **Submissions grid** — platform x window table
- **Snapshot history** — paginated list
- **Overview charts** — tier scatter, archetype bubble (if they earn the space)

Press Escape or click "BACK TO BOARD" to restore the table.

### Owner-only surfaces (gated)
Report, Lab, Claim, ProfileEditModal stay behind `useBoardSession` auth:
- These render as **additional modules** in the inspector or stage-profile when the owner views their own operator
- No fake states for non-owners — these modules simply don't mount

### Auth consolidation (three distinct concerns)
The standalone profile makes 4 independent auth-adjacent fetches. These are NOT all replaceable by a single hook — they serve three different purposes:

1. **Session/ownership lookup** — "is the viewer signed in, and do they own this operator?" `useBoardSession` already handles this (returns `user`, `codename`, `displayName`, `rank`). The 4 redundant fetches to `/api/auth/session` in the profile components should collapse into one `useBoardSession` call. ✅ Straightforward.

2. **Editable private profile data** — `ProfileEditModal` fetches `/api/v1/profile` to get mutable fields (bio, links, location, avatar_url, operator_domains, profile_visibility). This is owner-only data not on `useBoardSession` and CANNOT be replaced by the session hook. It stays as a dedicated authenticated fetch, gated by `useBoardSession().codename === selectedOperator.codename`.

3. **Analytics ownership attribution** — the profile page resolves `/api/v1/profile` to associate the viewer's identity with analytics events. This fetch can be eliminated by deriving attribution from `useBoardSession().user` + `useBoardSession().codename` instead.

**Net result:** 4 fetches → 1 `useBoardSession` call + 1 dedicated `/api/v1/profile` fetch (owner-only, on demand). Not "one hook replaces all."

---

## 3. BRAINSTORM — Graphic creativity

### A. The "Operator Dossier" concept
Instead of tabs, the profile reads like an **intelligence dossier** — a continuous vertical document in the inspector rail. Each section has a subtle header bar with the section glyph:
- `§ IDENTITY` — the tile
- `◎ SIGNAL` — radar + ranks
- `◇ OVERTIME` — combined signal
- `▸ SOCIAL` — bio/links card
- `🏆 RECORDS` — trophy room
- `⚡ ACTIONS` — SEE PROFILE / COMPARE / WATCH

### B. The "Terminal Passport" concept
Lean into the SplitFlapCard language already established. The inspector renders as a **terminal readout** — monospace, phosphor-green accents on dark, scanline texture. Each module is a "page" in the passport, flipping with the same split-flap animation micro-interaction. The radar becomes a terminal-rendered ASCII-adjacent SVG. Metrics print out like telemetry rows.

### C. The "Signal Card" concept
A single, dense, beautiful card that IS the profile — like a trading card or a baseball card. The inspector becomes a giant card face: identity at top, radar in the center, stats wrapped around it, records at bottom. Flip animation to show the back (social, history, submissions). This is the most graphically ambitious and the most visually distinctive.

### D. The "Hybrid" (recommended)
Keep the board's existing dark/acid-lime visual language. The inspector profile stack is:
- **Identity block** — same tile but with archetype subtitle and tier progress bar UNDER the class badge (thin, the tier's color, percentage to next class)
- **Radar/Ranks slide** — existing, but add a "vs field" ghost overlay (the UV line) that fades in on hover
- **Signal module** — existing COMBO/SINGLE, but in the full-stage view it expands to show the cascade fingerprint (KPIs + radars + bars) below
- **Social strip** — compact single-line: avatar + handle + location + link icons (github/x/site) — NOT a full card, just a contextual strip
- **Records** — existing trophy room but with a gold/silver/bronze LED-style counter
- NEW: **Tier badge** — a small animated progress ring next to the class badge showing % to next tier

---

## 4. DATA GAP ANALYSIS — What's missing

### Data currently NOT on the board's LiveOperator
| Field | Source on profile page | How to get it on the board |
|---|---|---|
| `bio` | `operator.bio` | Add to LiveOperator projection from operators_public |
| `links` (github, x, site) | `operator.links` | Add to LiveOperator projection |
| `profile_visibility` | `operator.profile_visibility` | **Deliberate design decision required.** The current contract: `mapOperator()` returns `profile_visibility` as `"public"` or `"private"` on the full `Operator` type, and the standalone `/user/[codename]` page reads it to render a private-profile indication. However, `toLiveOperator()` does NOT include it on `LiveOperator` — the board client never sees visibility state. The mapper nulls personal fields (display_name/handle/avatar/bio/links/location) for private operators, but a public claimed operator can also have null display_name (simply hasn't set one). **Options:** (A) Add `profile_visibility` to `LiveOperator` — the board can show a "PRIVATE PROFILE" indicator, matching the standalone page. This is already public on the `Operator` type so it's not a new leak. (B) Keep it off `LiveOperator` and accept that the board cannot distinguish "private" from "hasn't set a name." The implementation phase must pick one and document the rationale. Do NOT infer privacy from null identity fields — that inference is ambiguous and unreliable. |
| `operator_id` (UUID) | `operator.operator_id` | Already in the DB; add to projection for drill-down API calls (watch toggle, snapshot-history). **Security requirement:** server endpoints MUST derive/verify ownership from the authenticated session JWT (`auth.uid()` → `operator_accounts.user_id`), never from a client-supplied `operator_id`. The UUID on the client is a lookup key, not an authorization token. |
| `account_age_days` | `operator.account_age_days` | Board has `age` (days) — ALREADY PRESENT |
| `total_messages_lifetime` | `operator.total_messages_lifetime` | Board has `msgs` — ALREADY PRESENT |
| `primary_domain` | `operator.primary_domain` | Board has `platform` — ALREADY PRESENT |
| Submissions | `getOperatorSubmissions(cn)` | New fetch on drill (like records enrichment) |
| Operator report | `getOperatorReport(op_id)` | New fetch on drill, owner-only |
| Snapshot history | `/api/v1/operators/{cn}/snapshot-history` | Already exists, client-paginated |
| Field averages | `computeFieldAverages(boardRows)` | **NOT computable from client `ops`** — `ops` is paginated (first 200). Use `fieldStats`/`fieldMax` (full-scope server projections already in `LiveBoardInitialState`), or add a dedicated cached endpoint for per-metric medians/averages |
| Tier progress | `computeTierProgress(class, totalTokens)` | Computable from `num.total` + `klass` |
| Trophy counts | `computeTrophyCounts(cn, dn, rows)` | Computable from `ops` + existing records |
| Build archetype detail | `buildArchetypeOf(...)` or catalog lookup | Board has `archetype` key; need the blurb/description lookup |

### Summary: 3 fields to add to LiveOperator, 3 new fetches on drill, 1 requiring design decision
- **Add to projection:** `bio`, `links`, `operator_id`
- **Design decision required:** `profile_visibility` — currently on `Operator` but not on `LiveOperator`. The implementation phase must choose: (A) add it so the board can show a "PRIVATE PROFILE" indicator, or (B) keep it off and accept that the board cannot distinguish private from unset identity. See the table row above for the full analysis. Do NOT infer privacy from null fields.
- **New drill fetches:** submissions, report (owner-only), snapshot history (already has endpoint)
- **Client-computable from existing data:** tier progress (from `num.total` + `klass`), trophy counts (from loaded records). **NOT client-computable:** field averages/medians — `ops` is paginated (first 200 rows); use `fieldStats`/`fieldMax` (already full-scope) or add a cached endpoint. Archetype detail needs a blurb lookup (only the key is on `LiveOperator`).
- **Security requirement for all drill fetches:** server endpoints that return owner-only data (report, settings, lab) MUST authorize via the authenticated session JWT (`auth.uid()` → `operator_accounts.user_id`), never by trusting a client-supplied operator UUID. UI gating (hiding tabs for non-owners) is a UX convenience, not a security boundary.

---

## 5. IMPROVEMENT SUGGESTIONS

### Consolidations
1. **Kill the 4 client-side auth fetches** — `useBoardSession` already knows signed-in state; expose `ownsOperator(codename)` from it
2. **Deduplicate record computation** — `OperatorRecords` and `computeTrophyCounts` both fetch `getHallOfSignal()` and compute dynamic records independently. Consolidate into one utility
3. **One archetype API** — `describeBuildArchetype` (pillar-based) and `buildArchetypeOf` (axes-based) return different shapes. Pick one; the board already has the `archetype` key, so a simple catalog lookup for the description suffices

### Performance
4. **Don't re-fetch the full leaderboard** — the profile page fetches `getLeaderboard()` (~2.5MB) to compute field averages and tier scatter. The board already has full-scope `fieldStats`/`fieldMax` — use those server-projected aggregates for corpus-level statistics. Do NOT compute field averages from client `ops`, which is paginated to the first 200 rows and does not represent the full field
5. **Lazy-load the SplitFlapCard** — already deferred via IntersectionObserver; in the board context, link to `/user/[codename]` instead of embedding 1372 lines in the inspector
6. **Progressive enrichment** — the board already does this for records (`enrich.ts`). Extend the same pattern: select an operator → fan out for submissions + snapshot-history + report (owner). Cache per session

### New features to consider
7. **Watch count on the profile** — the migration is live; show "N watching" on the identity tile when count > 0
8. **Inline compare** — clicking COMPARE in the inspector could split the inspector into two columns (selected vs compared) instead of navigating away
9. **Activity heatmap** — a GitHub-style contribution grid showing days with accepted submissions. Data: `snapshot-history` already has dates. Renders in ~50 lines of SVG
10. **Efficiency trend line** — the evolution chart shows `signa_rate` (score). Add an efficiency trace too — the board's CombinedSignal already supports multi-trace
11. **Field position context** — ColumnRanks shows the operator's rank. Enhance with "median: X, top: Y" reference lines on each bar so the operator sees where they sit vs the pack

### SEO / navigation
12. **Keep `/user/[codename]` as a standalone page** — the standalone URL remains a full server-rendered page (not a redirect) for SEO, social unfurls (OG images route at `/user/[codename]/opengraph-image`), and external links. Redirecting to `/board/all?op=codename` would break OG rendering, require JavaScript for content, and lose the ISR caching advantage. The standalone page renders the same OVERVIEW content as the board's stage profile but in its own layout without the workspace shell. Content parity is maintained through shared modules, not duplication
13. **Deep links** — `/board/all?op=codename` could auto-select and scroll to the operator, opening the full-stage profile. This makes every profile linkable within the workspace

---

## 6. GRAPHIC INSPIRATION — Research findings

### A. Tokscale profiles (`tokscale.ai/u/<handle>`)
The closest competitor surface. Their profile has:
- **GitHub-style contribution heatmap** (2D and 3D views) with 12-month density grid, switchable color themes (Green/Halloween/Teal/Blue/Pink/Purple/Orange/Monochrome/YlGnBu)
- **Usage over time** stacked area chart — model activity grouped by provider, togglable between tokens/cost, 30d-average or daily
- **Token mix** — distribution pie across input/output/cache/reasoning
- **Devices table** — per-device token/cost/active-days breakdown
- **Provider chips** — codex/claude/gemini/openclaw badges
- What they DON'T have: efficiency metrics, radar charts, class tiers, archetype classification, yield computation, or any derived scoring — they track raw volume only. SigRank's differentiator is measuring *how well* you use tokens, not just how many.

### B. Kernal / "Bloomberg Terminal for GitHub" (`github.com/Abudora-0/Kernal`)
Financial market terminal aesthetic applied to developer data:
- Deep navy-black panels with signal-green ticks
- IBM Plex Mono readouts with tabular numerals
- Dotted leader lines between label and value
- Function-key tabs (F1/F2/F3)
- Segmented DEV INDEX gauge
- Developer Score: letter grade (S/A/B/C/D) from real metrics
- Hourly heatmap (activity by hour-of-day)
- **Relevant pattern:** the terminal-readout language + letter grades map directly to SigRank's class tiers

### C. DevQuest GitHub cards (`github.com/PurpleSwtr/devquest`)
33 card templates, 15 art-style frames, 19 color themes:
- **Dev Receipt** — receipt-style vertical printout of stats (like a store receipt)
- **Dev ID Card** — photo + stats in a passport/ID format
- **Contribution Gauge** — semicircular gauge for activity level
- **Streak Flame** — animated streak counter
- **Stat Spark** — sparkline-embedded stat cells
- **Art-style frames:** terminal, neobrutalism, glass, pixel, minimal, outrun, blueprint, sketch, sticker, tape, hologram, newspaper, arcade, polaroid, circuit
- **Relevant patterns:** the receipt format, the ID card, the hologram frame, the outrun aesthetic

### D. CommitPulse 3D city (`commitpulse.vercel.app`)
- GitHub contribution grid as a 3D isometric city — each day = a building, height = commit volume
- Log-scaled heights so one monster day doesn't flatten the rest
- Neon/dark/custom themes
- **Relevant pattern:** the "skyline" concept for token volume over time — each day is a tower in an AI usage cityscape

### E. WakaTime heatmap ecosystem
Multiple implementations of GitHub-style activity heatmaps for coding time:
- Hour-of-day x day-of-week matrix (when do you code?)
- Year view with intensity buckets
- Radar chart for weekly averages
- Speedometer gauge for productivity
- **Relevant pattern:** the hour-of-day matrix could map to "when does this operator submit/use AI?" if we track submission timestamps

### F. FIFA Ultimate Team cards
The original "player stats on a card" format:
- Gold/silver/bronze card backgrounds for tier
- 6 stats around the edge (PAC/SHO/PAS/DRI/DEF/PHY)
- Photo cutout centered
- Rating number (large) top-left
- Position badge
- **Relevant pattern:** SigRank already has class tiers (POWER I/II/III, SIGNAL, etc.) that map 1:1 to card rarity. A FUT-style card face with 6 cascade metrics around the radar is a natural fit. The ColumnRanks data is literally the stats block.

### G. Gaming stats dashboards (Shadcn blocks, esports UIs)
Common patterns across gaming profile UIs:
- Rank badge with tier indicator (SigRank has class badges)
- KDA-style ratio displays (SigRank has SNR/leverage/velocity)
- Win rate progress bars (SigRank has percentile)
- Match history with outcome indicators (SigRank has snapshot history)
- Weapon loadout display (SigRank has platform/model breakdown)
- Achievement badges grid (SigRank has trophy room)
- **Relevant pattern:** the esports "rank card" format — rank badge, win rate, K/D/A — maps perfectly to class badge, percentile, yield/snr/leverage

### H. Bloomberg Terminal aesthetic
Key visual patterns from Bloomberg-inspired UIs:
- Dense data panels with monospace numerics
- Amber/green-on-black color scheme
- Function-key navigation (F1-F12)
- Keyboard-driven (already matches the board's hotkey system)
- Watchlist tables with real-time tickers
- **Relevant pattern:** the board already uses this grammar. The profile integration should feel like "drilling into a ticker" on a Bloomberg terminal — not navigating to a separate website.

### Summary: patterns worth stealing for mocks
1. **Tokscale's contribution heatmap** — but for token efficiency, not raw volume. Color = yield, not count.
2. **Kernal's terminal readout + letter grade** — directly maps to class tier display.
3. **DevQuest's receipt format** — a "cascade receipt" that prints out the operator's session.
4. **FUT card face** — class tier determines card color/rarity; 6 stats around the radar.
5. **Bloomberg drill-in** — clicking a ticker opens an inline panel, never navigates away.
6. **Hour-of-day matrix** — if submission timestamps exist, a "when does this operator work" grid.
7. **3D contribution city** — ambitious but visually distinctive for the share card.
8. **Esports rank card** — compact identity + rank + key ratios, perfect for the inspector.

---

## 7. LAYER ARCHITECTURE — Macro nav vs micro pages vs interactions

The console interface can convert into anything. The profile isn't one page — it's a **layer system**. Here's the hierarchy, built on the existing shell that's already wired and working.

### Layer 0: The existing workspace shell (FIXED — already built)

The icon rail and the four-column layout are settled. The profile redesign works WITHIN this structure, not by adding new macro nav:

```
┌─────┬──────────┬─────────────────────────────┬──────────┬─────────┐
│ICON │ LEFT     │        STAGE                │  RIGHT   │  AUX    │
│RAIL │ SIDEBAR  │   (converts per context)    │INSPECTOR │ (opt-in)│
│     │          │                             │          │         │
│fixed│ MOVERS   │  ┌─────────────────────┐    │ PROFILE  │ PEEK /  │
│     │ COMPARE  │  │  TABLE / OVERVIEW /  │    │ MODULE   │ COMPARE │
│     │ WIRE     │  │  STATS / ANALYSIS /  │    │ STACK    │ CONTEXT │
│     │ NOTES    │  │  SUBMISSIONS / ANY   │    │          │         │
│     │ HALL     │  └─────────────────────┘    │          │         │
└─────┴──────────┴─────────────────────────────┴──────────┴─────────┘
```

**What's fixed and wired:**
- **Icon rail** — already has its slots, not changing for the profile
- **Left sidebar** — already carries movers, compare, wire, notes, hall
- **Right inspector** — already shows the selected operator's profile module stack
- **Aux peek rail** — already slides in between stage and inspector (Alt+click)

**Available surfaces for the profile redesign:**
- **Stage** — the main content area. Currently the leaderboard table. Can transform to show the full profile dashboard when drilling in.
- **Left sidebar** — could swap its modules contextually (e.g., show profile sub-page nav when in profile view, or keep board modules and add a header/footer nav for profile sub-pages)
- **Right inspector** — already contextual. Adapts based on stage content.
- **Aux sidebar** — can pop out for comparison context, peek, or pinned modules
- **Header or footer nav within the stage** — tab bar / breadcrumb for profile sub-pages. This is micro nav, not macro — it lives inside the stage, not the shell.

The designer has freedom to decide WHERE the profile sub-page navigation goes:
- Option A: **Stage header tabs** — a tab bar at the top of the stage when in profile view
- Option B: **Left sidebar swap** — the left sidebar modules change to profile nav when drilling in
- Option C: **Footer nav** — a persistent footer bar in the stage area
- Option D: **Scrollable single page** — no sub-page nav at all; OVERVIEW/STATS/ANALYSIS as sections in one vertical scroll

### Layer 1: Micro Pages (profile content within the stage)

When the stage transforms to show a profile, it has sub-pages. How they're navigated is a design decision (tabs, sidebar, scroll, etc.), but the content breakdown is:

| Sub-page | Content | Stage layout |
|---|---|---|
| **OVERVIEW** | Identity hero + class badge + archetype + tier progress + key KPIs + recent activity heatmap + combined signal chart | Single column, visual-heavy, the "baseball card" view |
| **STATS** | Full cascade fingerprint: 9 KPI tiles, dual radar, op-ratio bar, heat bar, evolution line, field position bars, column ranks | Dense grid, the "Bloomberg terminal" view |
| **ANALYSIS** | Tier scatter plot, archetype bubble chart, field comparison, vs-average/vs-top deltas, trophy room expanded | Charts + data tables, the "analyst" view |
| **SUBMISSIONS** | Platform x window grid + paginated snapshot history + submission timeline | Table + timeline, the "activity log" view |
| **SOCIAL** | Bio, location, links, handle, avatar, claimed status, watch count | Card layout, compact |
| **SETTINGS** | Owner-only: profile edit, report visibility, lab sandbox, claim | Forms, gated by auth |

### Layer 2: Modules (what's on each micro page)
Each sub-page is composed of **modules** — self-contained blocks that can be:
- Rearranged within a page
- Collapsed/expanded
- Popped out into the inspector or aux sidebar
- Shared as standalone cards

Module examples:
- `IdentityHero` — avatar + name + class + rank + archetype + tier progress ring
- `CascadeFingerprint` — KPI grid + dual radar + bars
- `CombinedSignal` — COMBO/SINGLE multi-trace chart
- `ActivityHeatmap` — GitHub-style grid, color = yield not volume
- `TrophyRoom` — medal counts + records
- `FieldPosition` — column rank bars with field context
- `TokenMix` — input/output/cache pie (like Tokscale but with efficiency overlay)
- `SubmissionGrid` — platform x window table
- `SocialCard` — bio/links/handle
- `WatchModule` — **aggregate watch count only** (e.g., "7 watching"). Watcher identities are NEVER exposed — the `operator_watches` RLS policy restricts select to own rows, and the `/api/v1/operators/{codename}/watch` GET endpoint returns only `{watching: boolean, count: number}`. No list of watchers is surfaced. If a "who's watching" feature is ever desired, it requires explicit opt-in consent from each watcher and a new authorized endpoint.

### Layer 3: Interactions (what happens when you touch things)

| Interaction | Behavior |
|---|---|
| **Select operator on board** | Inspector shows profile module stack (identity + radar + signal + records + actions) — existing behavior |
| **Click "SEE FULL PROFILE"** | Stage transforms from table to profile dashboard. Left sidebar and inspector adapt. Board state preserved for return |
| **Navigate sub-pages** | Designer decides: tabs in stage header, left sidebar nav, footer, or single scroll. Content swaps in the stage |
| **Hover module** | Subtle highlight. Module header shows expand/popout glyphs |
| **Click module expand** | Module fills the stage area, everything else dims |
| **Click module popout** | Module appears in the aux sidebar (like a pinned widget alongside the inspector) |
| **Alt+click row (on board)** | Peek rail opens (existing behavior, unchanged) |
| **Escape** | Back one layer: expanded module → page, profile stage → board, peek → close |
| **Deep link `/board/all?op=codename`** | Auto-selects operator, opens OVERVIEW in stage |
| **Deep link `/board/all?op=codename&view=stats`** | Auto-selects, opens STATS sub-page |
| **Keyboard `P`** | Toggle between board and profile stage for selected operator |

### Layer 4: Sidebars and inspector adapt per context

Both sidebars adapt based on what's in the stage — but the shell structure doesn't change:

| Stage context | Left sidebar | Right inspector | Aux sidebar |
|---|---|---|---|
| BOARD (table) | Movers / Compare / Wire / Notes / Hall (current) | Selected operator's profile module stack (current) | Peek rail on Alt+click (current) |
| PROFILE > OVERVIEW | Designer's choice: profile sub-nav, or keep board modules | Quick stats + actions + watch + social strip | Available for pinned modules |
| PROFILE > STATS | Same | Field context: median, top, field size per metric | Available for comparison overlay |
| PROFILE > ANALYSIS | Same | Comparison panel: select another operator | Available for side-by-side |
| PROFILE > SUBMISSIONS | Same | Submission filters + snapshot detail | Available |
| COMPARE | Same | Both operators' stats side by side | N/A (compare IS the stage) |

### The key insight

Everything the current `/user/[codename]` page does as tabs becomes **stage content** in the workspace. Everything the inspector does now (profile module stack) stays — it's the **preview layer** that leads into the full stage. The transition is:

```
Board table → select operator → inspector shows preview
                                         ↓
                              "SEE FULL PROFILE"
                                         ↓
                              Stage transforms to profile
                              (Overview → Stats → Analysis → Submissions → Social)
                              Left sidebar + inspector adapt
                                         ↓
                              Escape returns to board
                              (board state preserved)
```

The standalone `/user/[codename]` URL stays alive as a full server-rendered page (not a redirect) for SEO, social unfurls (OG image route), and external links. It renders the same OVERVIEW content as the board's stage profile but in its own layout without the workspace shell. This is a settled decision — see Section 5, item 12 for the rationale.

### What the designer decides in mocks
- Where does profile sub-page navigation live? (stage header tabs / left sidebar / footer / single scroll)
- Does the left sidebar swap its modules when in profile view, or keep the board modules?
- Does the aux sidebar play a role in profile view beyond peek?
- Is there a header or footer element within the stage for breadcrumbs / context?

---

## 8. WHAT'S UPGRADEABLE BEYOND CURRENT

The console interface is a canvas. With the layer system, everything becomes possible:

### New modules to mock (not in current profile)
1. **Activity Heatmap** — 365-cell grid, color = yield per submission day. Empty days = dark. Hot days = gold. Like GitHub contributions but measuring *quality*, not just activity.
2. **Token Mix Sunburst** — nested donut: outer ring = input/output/cache/reasoning, inner ring = by model/provider. Click to drill.
3. **Efficiency Trend** — a second trace on the evolution line showing efficiency over time, not just score.
4. **Session Replay Timeline** — if submission timestamps exist: a horizontal timeline showing when the operator submits, with intensity markers.
5. **Field Comparison Overlay** — on any chart, toggle "show field average" ghost line / "show top operator" reference line.
6. **Cascade Receipt** — a DevQuest-style receipt format that prints the operator's cascade as a literal receipt (shareable, downloadable).
7. **Operator Passport** — a FUT-style card face: class tier = card rarity (gold/silver/bronze background), avatar centered, 6 cascade stats around the radar, rank number top-left. Exportable as PNG for social.
8. **3D Token Skyline** — CommitPulse-style isometric city where each day is a tower, height = total tokens, color = yield. Ambitious but visually distinctive.
9. **Hourly Activity Matrix** — WakaTime-style 7x24 grid: when does this operator submit? Intensity = tokens per hour-of-day x day-of-week.
10. **Rank Trajectory Sparkline** — a mini position chart in the identity hero showing rank movement over the last 30/90 days (like a stock ticker).
11. **Class Tier Progress Ring** — animated ring around the class badge showing % to next tier. Small, always visible, motivational.
12. **Watch Leaderboard** — "most watched operators" as a secondary sort option on the board.

### What makes SigRank different from Tokscale in the mocks
Tokscale measures **volume** (how much you burn). SigRank measures **skill** (how well you convert). Every graphic should reinforce this:
- Tokscale's heatmap = raw tokens per day. SigRank's heatmap = **yield per submission**.
- Tokscale's charts = cost over time. SigRank's charts = **efficiency over time**.
- Tokscale has no radar, no class system, no archetypes, no field positioning. SigRank has all of these — they're the product's core differentiator and should be the visual centerpiece.

---

## 9. OPEN QUESTIONS FOR MOCK PHASE

1. **Which sub-pages should the first mock round cover?** (Recommend: OVERVIEW + STATS — they're the highest-value surfaces)
2. **Activity heatmap — yield-colored or token-volume-colored?** (Yield reinforces the product thesis)
3. **Operator Passport card — mock it as a share artifact or as an inline module?** (Could be both)
4. **3D skyline — worth a concept mock or defer?** (High effort, high wow-factor)
5. **How many mock variants per sub-page?** (Recommend: 2-3 directions for OVERVIEW, 1 for STATS since it's data-dense and has less stylistic latitude)
6. **Should the inspector adaptation be part of the mocks or handled separately?** (It's structural, not purely visual — could be a wireframe pass)
7. **SETTLED: The standalone `/user/[codename]` stays as a standalone server-rendered page** (not a redirect) with the same visual language as the workspace profile but in its own layout. Same shared modules, no workspace shell. See Section 5, item 12.
8. **Owner surfaces (Settings sub-page) — mock now or defer?** (Defer — it's auth-gated and lower priority)

---

## 10. FIRST-PASS MOCK DELIVERABLES

HTML mocks produced during the planning phase (gitignored, in `_workspace/profile-mocks/`):

| Mock | File | Lines | Coverage |
|---|---|---|---|
| **Overview page** | `overview.html` | 847 | Identity hero + tier progress ring, 6 KPI cards with sparklines, combined signal chart (5 traces), activity heatmap, records/trophies, action bar |
| **Stats page** | `stats.html` | 88 | Identity strip, 3x3 KPI tiles with medal-colored ranks, dual cascade radar (op vs field), operating ratio bar, 12-row column ranks, heat bar, evolution line |
| **Operator Passport** | `passport.html` | 536 | FUT-style 320x480 card, POWER-class violet gradient, clip-path notch, radar overlay, 2x3 stat block, shimmer animation, medals |
| **Activity Heatmap** | `heatmap.html` | 643 | 52x7 grid (364 cells), yield-colored intensity, deterministic PRNG (Mulberry32), streak tracking, hover effects, stats strip |
| **Gallery index** | `index.html` | 162 | Navigation hub linking all mocks |

All mocks use exact SigRank design tokens (`#080c07` bg, `#a6ff00` accent, Space Grotesk / JetBrains Mono / Silkscreen), real MOSES operator data, and are self-contained (inline CSS/SVG, Google Fonts, no external JS).

**To preview:** `cd _workspace/profile-mocks && python3 -m http.server 8790` → open `http://localhost:8790`

---

## 11. EXECUTION CHECKLIST

Acceptance criteria for each phase. Items are ordered by dependency.

### Phase 1: Planning (this document) — COMPLETE
- [x] Inventory existing `/user/[codename]` page (PROFILE_PAGE_MAP.md)
- [x] Design brief with 9 sections (PROFILE_REDESIGN_PROMPT.md)
- [x] Data gap analysis with pagination-aware field-average guidance
- [x] Privacy contract for `profile_visibility` (design decision documented, two options)
- [x] Privacy contract for watch data (aggregate count only, no watcher identities)
- [x] Auth consolidation plan distinguishing session/editable/analytics concerns
- [x] Settled: `/user/[codename]` stays standalone (not redirect) for SEO/OG
- [x] 4 HTML mocks (Overview, Stats, Passport, Heatmap) in `_workspace/profile-mocks/`

### Phase 2: Mock review and iteration
- [ ] Review mocks with stakeholder, collect feedback
- [ ] Iterate on selected direction(s)
- [ ] Mock responsive states (375px, 768px, 1024px, 1440px)
- [ ] Mock owner vs non-owner vs private-profile states
- [ ] Mock inspector adaptation per stage context
- [ ] Resolve remaining open questions (Section 9, items 1-6, 8)

### Phase 3: Implementation
- [ ] Add `bio`, `links`, `operator_id` to `LiveOperator` projection
- [ ] Decide and implement `profile_visibility` on `LiveOperator` (option A or B)
- [ ] Build shared profile modules (IdentityHero, CascadeFingerprint, etc.)
- [ ] Wire stage profile view with sub-page navigation
- [ ] Wire inspector adaptation per context (Layer 4 table)
- [ ] Build drill fetches: submissions, report (owner-only), snapshot history
- [ ] Each drill endpoint: server-side auth via `auth.uid()` → `operator_accounts.user_id`
- [ ] Auth consolidation: collapse 4 session fetches → `useBoardSession` + 1 profile fetch
- [ ] Shared modules render in both workspace stage and standalone `/user/[codename]`

### Phase 4: Verification
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run lint` — 0 new errors
- [ ] Canonical test suite passes
- [ ] Live preview at `localhost:3210/board/all` — select operator, drill, escape
- [ ] Standalone `/user/[codename]` renders correctly
- [ ] OG image route still works
- [ ] Keyboard navigation: select → drill → escape → peek
- [ ] Accessibility: 4.5:1 contrast, focus visible, reduced-motion, chart fallbacks
- [ ] Responsive: 375px / 768px / 1024px / 1440px
- [ ] Owner view: settings/report/lab modules mount, non-owner: they don't
- [ ] Private profile: personal fields null, no leak of visibility state

---

## 12. VERIFICATION OF THIS DOCUMENT

### Factual inventory validation
- Route `/user/[codename]`: confirmed exists (`app/user/[codename]/page.tsx`)
- 6 tabs: confirmed (ProfileTabs.tsx: overview, stats, report, lab, submissions, social)
- 13 profile components: confirmed exists (CascadePanel, SubmissionsGrid, SnapshotHistory, ProfileTabs, OperatorRecords, OverviewTab, ProfileAuthGate, ProfileEditModal, CascadeRadar, OperatingRatioBar, EvolutionLine, KpiTile, HeatBar)
- `isOperatorRetired`: confirmed UNCACHED (direct Supabase query, no `unstable_cache`)
- ProfileBody queries: confirmed cached via `lib/board/cached.ts` (`unstable_cache` wrappers)
- `ops` pagination: confirmed (first 200 rows, `LIVE_PAGE_SIZE = 200` in `live-projection.ts`)
- `fieldStats`/`fieldMax`: confirmed full-scope (computed from ALL ranked rows before pagination)
- `mapOperator()` returns `profile_visibility`: confirmed (`mappers.ts` line 347)
- `toLiveOperator()` does NOT include `profile_visibility`: confirmed (`live-projection.ts`)
- `useBoardSession` returns: `user`, `codename`, `displayName`, `rank` — confirmed (`session.ts`)
- `operator_watches` RLS: confirmed own-rows-only select/insert/delete
- Watch API returns `{watching, count}` only: confirmed (`/api/v1/operators/[codename]/watch`)
- 5 shell surfaces: confirmed (`.srail`, `.lside`, `.stagecol`, `.railcol`, `.peek` in workspace CSS)

### Gate checks
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors (73 pre-existing warnings, none from this change)
