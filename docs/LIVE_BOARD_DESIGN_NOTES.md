# Live Board — Owner Design Notes (2026-10-06)

## Component map (owner-requested key)

Numbered regions of `/board/[window]` as currently built:

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1 TITLE BAR — centered "GLOBAL AI OPERATOR LEADERBOARD"              │
│   1a pagetitle (centered)  1b panel glyphs (left sidebar, inspector) │
├──┬────────────┬──────────────────────────────────────┬──────────────┤
│ 2│ 3          │ 4                                    │ 5            │
│ICON│LEFT      │ STAGE                                │ INSPECTOR    │
│RAIL│SIDEBAR   │  4a filter bar: workflow pills ·     │ RAIL         │
│   │           │    window/platform/class selects ·   │              │
│2a px│  3a      │    ▲▼ dir chip · search              │  5a SHARE    │
│mark │BANNER    │  4b table: group headers · colored  │  5b MOVERS   │
│2b nav│  mod    │    icon columns (sortable) · top-3   │     rotating │
│  icons│ hero+  │    podium cells · pillar sub-line ·  │     7D/24H/  │
│  ▤⚖🏆│  stats  │    location · trend spark            │     HITL/AGT │
│  ◉▥✎│         │  4c pgn: showing · centered pages ·  │  5c COMPARE  │
│  ⬢  │  3b      │    Metrics/Raw seg · export CSV     │     +search  │
│2c    │OPERATOR │  4d floating dock (.feat, FEATURE)   │  5d HOT STATS│
│ theme│PROFILE  │                                      │     rotating │
│  swat│  mod    │                                      │  5e HALL     │
│2d    │  tile + │                                      │     spotlight│
│ acct │  dual   │                                      │  5f RECENTS  │
│  av  │  radar +│                                      │     & SOON   │
│      │ TROPHIES│                                     │              │
├──┴────────────┴──────────────────────────────────────┴──────────────┤
│ 6 FOOTER — LINKS strip · provenance · ruleset · sync stamp          │
└──────────────────────────────────────────────────────────────────────┘
```

Edges: `◂`/`▸` ear-flap sashes on each sidebar's inner edge — click =
collapse, drag = resize (`--lside-w`/`--rail-w` vars, 180–480px clamp).
Panels are PINNED (no media-query reflow); title-bar glyphs toggle them.

Durable directives from the owner review session. These govern the
`/board/[window]` redesign on `feat/live-board-2b` and supersede
reference-v1 parity wherever they conflict. Source artifacts:
hand-drawn wireframe (VS Code-style shell) + current production board
screenshot (purple theme).

## Workflow pills — FINAL SPEC

- Exactly **3 pills**: `HITL | HYBRID | AGENTIC` — in that order.
- `HYBRID` is the middle pill and means the **combined view** (shows HITL
  and Agentic workflows together — replaces the old "All"). **Default on
  open.**
- `HITL` = only hitl workflows; `AGENTIC` = only agentic workflows.
- The old `Operators | Outliers` pair is gone — these pills replace it.
- `?mode=hitl|agentic|hybrid` stays the URL contract; `hybrid`/absent →
  combined view.
- Stored `workflow_mode` vocabulary widened to `hitl | agentic | hybrid`
  (a `hybrid` row badge = an operator who does both; renders under the
  combined view).
- The reference's "outlier" re-rank survives as `SORT → 10xDEV` (◆ marks,
  position ranks, `10×DEV OUTLIER` labels derive from that sort).

## Shell layout (from the wireframe — VS Code anatomy)

- **Title bar kept** — `GLOBAL AI OPERATOR LEADERBOARD` flush left; the
  owner likes our current header setup, keep it.
- **Far-left icon rail** — icons ONLY, label appears on hover:
  - First icon = signalaf pixel mark → "home" of the workspace (the
    board itself, even though the site opens on the board).
  - Better/more suitable icons for the other entries (Leaderboard,
    Compare, Hall, Field).
  - **Add: Wiki, Blog, Enterprise** entries.
  - **Bottom of the icon rail = user's avatar/logo → settings.**
- **Left sidebar** — content TBD; candidate: banner + OP profile module.
- **Right sidebar** — interactive share, movement, compare modules.
- **Both sidebars collapsible AND adjustable** — VS Code-style,
  including a quick window-config button. The icon strip reference
  (shot 3) is VS Code's "Customize Layout" quick-pick: panel-composition
  glyphs (split panes / sidebar-left / sidebar-right / bottom panel /
  single column) + a globe. Implement as a small toggle group that
  shows/hides each panel — never a media-query reflow. Never let a
  sidebar reflow *below* the board — collapse is via toggle only.
- **Bottom bar** — status strip (already approximated by the footer
  strip; keep).

## Table requirements (from the production screenshot)

- **Column group headers**: `IDENTITY & SCALE | CASCADE YIELD |
  COMPOSITION & COST | ACTIVITY` — grouped super-headers like prod.
- **Every column header: icon + colored + sortable.** Click cycles
  sort; active column shows ▼ indicator.
- **Top-3 rows get per-column cell highlights** — prod shades the top-3
  cells per metric column (gold / blue / violet tints). Port this to the
  workspace (the `tt1/tt2/tt3` top-sets already exist in utils — bind
  them to cell classes).
- **Row sub-line under Σ TOTAL**: `I n · O n · W n · R n` four-pillar
  breakdown (prod has it; new board dropped it).
- **Location/flag on identity cell** — prod shows flag + locale
  (`🇺🇸 us`, `Seoul ROK`); confirm the field exists on live rows.

## OP profile

- Include the **dual overlapping radar** — owner prefers the
  **compare-page radar style** over the profile-page one.

## Sort / filter bar

- SORT select cleaned up, tighter, organized and symmetrical.

## Deferred / open questions

- "Header tabs" row — owner unsure whether needed; hold unless a use
  case emerges.
- Left sidebar final contents — awaiting owner decision.
- Narrow-viewport rail behavior — owner wants rails PINNED, not
  reflowed; collapse via explicit toggles only.

## Build checklist (owner: "bring this home with a swarm of agents")

Status tracked here — check items as they land.

- [x] 3-pill workflow toggle `HITL | HYBRID | AGENTIC` (hybrid = combined, default)
- [x] Inspector rail pinned (no media-query reflow) + title-bar layout toggle
- [x] Icon rail: icons-only, hover tooltips, avatar bottom → settings
- [x] **Rail icons: larger + per-icon color** (`rail-extras.css`, 19px +
      accent hues; bone-theme legibility guard on cyan/yellow)
- [x] **Enterprise promo** — icon opens a popover card: EKG demo video
      (`mos2es.com/assets/physical-product-brief.mp4`) + Upsilon blurb +
      CTA → `/upsilon`; outside-click close (`EnterprisePromo.tsx`)
- [x] **Column headers**: group super-headers (`IDENTITY & SCALE /
      CASCADE YIELD / COMPOSITION & COST / ACTIVITY`; raw mode = RAW
      TOKEN PILLARS), icon + per-column color, sortable w/ ▼▲ caret +
      aria-sort; click = sort, re-click = flip (`board-cols.css`,
      `rows.tsx`, `sortFlip` in workspace)
- [x] **Per-column top-3 cell highlights** — podium tints bound to the
      existing top-sets (board-cols.css `td.tt1/2/3`)
- [x] **Σ TOTAL sub-line** — `I·O·W·R` pillar breakdown
      (`LiveOperator.pillars`; null on nc rows)
- [x] **Flag/locale** — `◍ location` under the handle
      (`LiveOperator.location`; data already flowed via
      `OPERATOR_COLUMNS.location`, null when profile_visibility private)
- [x] **Dual overlapping radar** — compare-page CascadeRadar style;
      baseline = field leader's radar vs selected op, FIELD MAX rim on
      featured (`dock-radar.css`, `OperatorDock`, `radarBaseline`)
- [x] **SORT select cleanup** — symmetric field cluster (uniform select
      min-width, even label+select pairs) + `▲/▼` direction chip beside
      the SORT select flipping effective asc/desc; select change resets
      flip; Yield re-click now actually flips order
- [x] **Collapsible/adjustable sidebars** — left sidebar added
      (`leftOn`, default on, 248px `.lside`): BANNER module (hero +
      field-strip moved out of the stage, BANNER ctlbtn removed) +
      OPERATOR PROFILE module (profile tile when docked, ⇄ FEATURE
      floats it, re-dock chip when floating). Right rail keeps the
      pinned `.railcol`, now headed INSPECTOR with modules reordered
      per owner IA: share → movers → compare → field → hall. Title bar
      carries both panel glyphs (left fill = sidebar, right fill =
      inspector). No media-query reflow anywhere.
- [x] **Board tooltip glossary** — every column header carries its
      metric definition on hover (canonical formulas from
      `live-types.ts`: Υ = cache_read × output ÷ input², leverage =
      cache_read ÷ input, velocity = output ÷ input, SNR = output ÷
      (input+output), 10×DEV = log₁₀ leverage, pillars I/O/W/R). Raw
      pillar columns are now sortable too (`Input/Output/Cache-read/
      Cache-write` in SORT_KEY + CONTROLS.sorts).

## Owner annotation pass (2026-10-06, VS Code Simple Browser notes)

23 element annotations worked through; element inferred from note content
(selectors were generic). Interpretation calls flagged for review:

- [x] Radar on profile — `RadarChart` (dual, compare-style baseline)
      rendered under the profile tile in the left sidebar
- [x] Profile graphic — gradient avatar tiles in compare slots +
      spotlight; radar is the profile's graphic centerpiece
- [x] HALL OF SIGNAL → `HallSpot` rotating random spotlight (avatar +
      record, 5.2s cycle, click → select)
- [x] FIELD module duplicate → replaced by `HotStats` rotating ticker
      (dedupes banner strip + "rotating stats" note)
- [x] Trophy tracker — `TROPHIES` strip in profile mod binding
      `selOp.recs` (the same enriched records the dock RECORDS tab uses)
- [x] TOP MOVERS → `RotatingMovers` auto-cycles 7D·ALL → 24H·ALL →
      7D·HITL → 7D·AGENTIC (24h derives from `o.mv24`, wf facets filter
      resolved rows)
- [x] Pagination centered (`absolute`-center `.pages`)
- [x] Metrics/Raw seg moved from fbar into `.pgn`
- [x] COMPARE module: add-by-search input → match offers view-profile or
      carries `?a=<sel>&b=<match>` into /compare
- [x] SORT `<select>` removed (headers sort); `.sdir` chip remains
- [x] `.fl` dropdown labels removed (dead-space cleanup); selects carry
      aria-label + title
- [x] Page title centered in `.nav`
- [x] Railheads restyled to `.pagetitle` display face; right railhead =
      "BURNERS, BUILDERS & 10XERS" (kicker moved out of `.nav`)
- [x] RECENTS & SOON module — recents chips (reselect) + coming-soon
      chips: TEAMS / SESSION COMPS / HACKS / VERSUS
- [x] Hall icon → 🏆; `.sbtn:hover .gi` grows icons on hover

Interpretation calls (review): "four degree" read as the field-strip
stats → covered by HotStats; "randomize users + profile graphic" applied
to the hall module; "boxes inside header text box" read as already
satisfied (module buttons sit inside `.mod h3`).

## Process note

- Owner directive: **document all changes and follow-ups in a durable
  file** (this doc + `LIVE_BOARD_INTEGRATION.md`) so nothing is lost
  between sessions.
