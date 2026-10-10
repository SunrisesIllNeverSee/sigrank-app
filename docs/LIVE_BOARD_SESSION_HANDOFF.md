# Live Board — Session Handoff (2026-10-07)

Branch `feat/live-board-2b` on `sigrank-app` remote. PR #239 open.
Latest head at write time: `e9f34a2` → `043574c` → `c23336f` → `8645b9e`.

## TL;DR for the next session

- The board is a **four-column pinned layout**: icon rail · left sidebar ·
  stage (leaderboard) · right inspector. No scrolling chrome. Owner wants
  surgical changes driven by **pointed annotations** — do not restructure.
- Dev server: `http://localhost:3210/board/all` (branch worktree
  `sigrank-app-live-board`, port 3210).
- Owner review deck: `public/live/review/index.html` (editable HTML pages,
  score 1–3 + comment box + COPY ANSWER per page).
- Legacy prototype: `/board/all?v=legacy`.
- **Verify with the repo gates**: `bunx tsc --noEmit`, `bunx eslint`,
  `npm run test:ui` (155 tests), `npm run test:canonical` (11/11 — NEVER break
  MOSES Υ 18436.98 invariants).

## Current layout contract (owner-approved, keep it this way)

- Fixed one-line header: `SIGNALAF` | `GLOBAL AI OPERATOR LEADERBOARD` | `SIGRANK`.
- Left sidebar subheader: `BURNERS, BUILDERS & 10XERS` — modules: TOP MOVERS,
  COMPARE OPERATORS, HALL OF SIGNAL.
- Right sidebar subheader: `OPERATOR` — modules: SHARE YOUR SIGNAL,
  OPERATOR PROFILE (tile → radar box → Υ YIELD·OVERTIME → STATS·SPARKLINES
  → records), AWARDS & BADGES (rotating deck), RECENTS + COMING SOON.
- Nav rail: leaderboard/compare/hall/field/wiki/blog/enterprise popover +
  TEAMS/HACKS/VERSUS (coming-soon vote popovers) + icon-set cycler +
  outline bell + account tile (highest badge when signed in).
- Theme swatches live in the account/settings popover — NOT the rail.

## Component map

| File | Owns |
|---|---|
| `components/live/LiveBoardWorkspace.tsx` | 4-col grid, rail, headers, module bodies, MedalDeck, TrendSpark, MiniSpark, sponsor, wire |
| `components/live/OperatorDock.tsx` | `OperatorProfileTile`, `RadarChart` (board-local; profile uses CascadeRadar), `SharePreview` (copy+CTA left, verified mini-card right) |
| `components/live/MoversRail.tsx` | `RotatingMovers` (skips empty scopes) + `MoversRail` fixed-height `.mbox` |
| `components/live/HallRail.tsx` | `hallRows`, `HallSpot` |
| `components/live/PixelBadge.tsx` | 3×3 mosaic block badges (VERIFIED/TOP1%/5%/10%/100D/10M) |
| `components/live/PixelIcon.tsx` | 5 icon sets (pixel/glyph/emoji/minimal/hex) — `ICON_NAMES` incl. teams/hacks/versus |
| `components/live/proto-scoped.css` | ALL styles; themes via `data-theme` on `.lbw-root` |
| `components/charts/CascadeRadar.tsx` | SITE radar — shared axis maxima, ghost layer, legend. Profile uses it at `size={170}` with 1.25× headroom |

## Data / wiring facts

- `selOp` = selected `LiveOperator`; `selDetail` (via `details` map) adds
  `history` (dated `score`/`yieldv`/`rank`) + `snapshots` (`yield_`,
  `leverage`, `velocity`) — the sparkline rows read real series only.
- Radar baseline = **field median** (`fieldMedianRadarVals` in `utils.ts`),
  rendered as CascadeRadar `ghost` series in `var(--blue)`; operator =
  `var(--ac)` solid. Site tokens are bridged per board theme in
  `proto-scoped.css` (`--gold`/`--bg-border`/`--text-primary` triplets).
- Hall medals = percentile brackets (gold ≥99, silver 95–99, bronze 90–95),
  3 pages × 3 compare-style cards, page dots. **Not** real medal records —
  feed lacks runner-ups; documented.
- `/s/<codename>` = card gallery: flagship `card.png` (hero), `Card 02`
  outreach PNG (`/api/outreach-card/<codename>`), `Card 03` interactive
  `ProfileShareCard` (Share/Preview/Download PNG — real component, wired),
  `Card 04` platform-badge gate, platform target row (LI/X/FB/email/GitHub
  embed snippet).

## Owner style notes (hard-won)

- Pixel font (Silkscreen) for headings; Orbitron stays on purple theme.
- Badges/icons from the brand asset pack — block badges are 3×3 pixel
  mosaics, awards are hex medallions.
- Prefers real-site components over bespoke ones (CascadeRadar lesson).
- Boxes end cleanly; each concept gets its own bordered box.
- Wants previews OPENED (Safari) + the element-picker preview at
  `127.0.0.1:49742` for click-and-point feedback.
- Hates reflow: fixed heights, fixed select widths, pinned columns.

## MCP tooling (as of this session)

- `mcp-hub` (`@ni-c/mcp-hub`, config `~/.config/mcp-hub/mcp.json`) fronts 46→51
  servers — `chart`/`framesmith`/`slidev`/`image-gen`/`uno` added 2026-10-07.
- Direct session servers: posthog, supabase, github, vercel, linear, attio,
  buffer, calendly, cloudflare-*, exa, openseo, worldmonitor, *-search, gitmcp.
- `~/.config/devin/mcp_config.json` has 98 entries; `figma` remains disabled
  pending a real `--figma-api-key` value.
- Code comprehension: `codebase-intelligence` (LSP, call graphs, NL queries),
  `codebase-memory` (knowledge graph, blast radius), `repomix` (pack+grep),
  `jcodemunch` (action router), `blueprint` (ADR/placement checks).
- Live-UI loop: `chrome-devtools` (a11y snapshot, `get_css_styles`,
  element screenshots, console, Lighthouse), `playwright` MCP, `screenpipe`.

## Open items / next session

1. `figma` MCP — needs real API key in `~/.config/devin/mcp_config.json`,
   then enable.
2. Real gold/silver/bronze medal records need backend runner-up data.
3. Platform badge cards (GH/X/LI/FB/email) — family documented in
   `docs/LIVE_BOARD_BADGE_INDEX.md`, not built.
4. Settings menu + notification bell are placeholders (local popovers).
5. `SignalLiveDemo.tsx` eslint `<img>` warning (1, known).
6. If session restarts: re-wake hub servers (`mcp-hub wake_server chrome-devtools`
   etc.) — they sleep by default.
