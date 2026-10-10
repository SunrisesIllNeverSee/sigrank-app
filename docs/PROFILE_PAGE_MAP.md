# /user/[codename] — Full Component & Wiring Map

> For integration into the board's four-column workspace.
> Generated 2026-10-08 from the live codebase on `feat/live-board-2b`.

---

## 1. Route files

```
app/user/
  page.tsx                         → redirect("/user/the-field")
  [codename]/
    page.tsx                       → OperatorProfilePage (server, ISR 21600s)
    ProfileBody.tsx                → ProfileBody (server, streamed via Suspense)
    opengraph-image.tsx            → Satori OG card (1200x630 PNG)
    wrapped/page.tsx               → Wrapped recap (Spotify-style)
```

---

## 2. Data fetching (server-side, mostly cached)

### page.tsx — critical path (renders the header)
```
Promise.all([
  isOperatorRetired(codename),    → UNCACHED direct query (fast boolean, no unstable_cache)
  getOperator(codename),          → unstable_cache 90s → LeaderboardRow
])
```

### ProfileBody.tsx — heavy path (streamed, all cached via lib/board/cached.ts)
```
Promise.all([
  getOperatorHistory(codename),            → unstable_cache → HistoryPoint[]
  getOperatorSubmissions(codename),        → unstable_cache → OperatorSubmission[]
  getOperatorReport(operator.operator_id), → unstable_cache → OperatorReport | null
  getLeaderboard({all_time, all}),         → in-memory memo 3600s → LeaderboardRow[] (~2.5MB)
  getHallOfSignal(),                       → unstable_cache 300s → HallRecord[]
])
```
Then sync computations:
- `computeFieldAverages(boardRows)` → FieldAverages (means of all ranked ops)
- `buildArchetypeOf({leverage, velocity, construction})` → BuildArchetype
- `computeTrophyCounts(codename, displayName, boardRows)` → TrophyCounts (also fetches hall internally — redundant but cached)
- `computeTierProgress(classTier, totalTokens)` → TierProgress

### Client-side API calls (after hydration)
| Component | Endpoint | Purpose |
|---|---|---|
| ProfileAuthGate | `GET /api/auth/session` | isOwner / isSignedIn / hasOperator |
| ProfileEditModal | `GET /api/v1/profile` | load editable profile data |
| CompareAgainstMe | `GET /api/auth/session` | show "compare against me" if signed in |
| TrackProfileView | `GET /api/v1/profile` | PostHog profile view event |
| SnapshotHistory | `GET /api/v1/operators/{cn}/snapshot-history?page=N` | paginated history |
| ReportTab | `POST /api/profile/report-visibility` | toggle report visibility |
| ClaimTab | `POST /api/claim` | claim the operator |

---

## 3. Component tree

```
OperatorProfilePage (SERVER)
├── TrackProfileView (client, renders null — PostHog event)
├── ← Leaderboard link
├── Compare → link (/compare?a=codename)
├── CompareAgainstMe (client — "compare against me" for signed-in visitors)
├── ClaimedBadge (server — "✓ Claimed" pill)
├── ProfileEditModal (client — owner-only edit button + modal)
├── <header> identity block
│   ├── OperatorAvatar (server — 64px img or initial)
│   ├── <h1> name
│   ├── SignalClassBadge (server — tier color chip)
│   ├── HITL / Agentic chip
│   ├── Build archetype chip → /wiki#archetypes
│   ├── Workflow evidence link (agentic only)
│   └── 🔒 Private chip (if private)
│
└── <Suspense fallback={Υ skeleton}>
    └── ProfileBody (SERVER, streamed)
        ├── JsonLd (server — ld+json script tag)
        ├── DeferredSplitFlapCard (client, lazy + IntersectionObserver)
        │   └── SplitFlapCard (1372 lines, "use client")
        │       ├── Gold identity panel (name, Υ yield, § logo)
        │       ├── TwoSeriesRadar SVG (you vs field avg, 6 axes)
        │       ├── Black terminal panel (TypewriterLine animations)
        │       └── Controls: Replay / Share / Download
        │
        ├── OperatorRecords (server, async — "Trophy Room")
        │   └── medal strip: static hall + dynamic top-3 records
        │
        └── ProfileAuthGate (client — context provider)
            ├── ClaimTabGate (client, unclaimed only)
            │   └── ClaimTab (client — claim form)
            │
            └── ProfileTabs (client — tab bar, 6 panels)
                ├── [overview] OverviewTab (server)
                │   ├── TrophyRoom (server — medal counts)
                │   ├── Experience Tier box
                │   │   ├── SignalClassBadge
                │   │   ├── progress bar to next tier
                │   │   ├── TierScatter (client — SVG scatter plot)
                │   │   └── stat rows
                │   ├── Build Archetype box
                │   │   ├── ArchetypeChip (server)
                │   │   ├── ArchetypeBubble (client — SVG bubble chart)
                │   │   └── archetype blurb + stat rows
                │   ├── Rank trajectory strip
                │   └── OverviewChart (client — dual-series SVG, mode toggle)
                │
                ├── [stats] rankedStatsPanel (server-rendered JSX)
                │   ├── Stat grid (rank, percentile bar, platform, age, turns)
                │   ├── vs field avg / vs top operator deltas
                │   ├── CascadePanel (server — species badge + 5 cascade stats)
                │   ├── "Cascade fingerprint" section
                │   │   ├── KpiTile ×9 (client — Υ, SNR, V, L, 10xDEV, ScaleV, $/1M, Eff, OpRatio)
                │   │   ├── CascadeRadar ×2 (client — derived axes + raw fuel)
                │   │   ├── OperatingRatioBar (client — stacked bar)
                │   │   ├── HeatBar (client — intensity ramp)
                │   │   └── EvolutionLine (client — score trajectory SVG)
                │   └── — OR pendingPanel (unranked empty state)
                │
                ├── [report] ReportTabGate (client, owner-gated)
                │   └── ReportTab → BadgeCollection, HealthScore, DnaCard
                │
                ├── [lab] LabTabGate (client, owner-gated)
                │   └── LabTab → SandboxClient (yield calculator)
                │
                ├── [submissions] submissionsPanel
                │   ├── SubmissionsGrid (server — platform×window table)
                │   └── SnapshotHistory (client — paginated history list)
                │
                └── [social] socialPanel (server-rendered JSX)
                    └── handle, location, bio, links (github/x/site)
```

---

## 4. Auth model

Auth is **entirely client-side** so the page stays ISR-cached:

1. Server hardcodes `isOwner = false` in both RSC files
2. `ProfileAuthGate` fetches `/api/auth/session` on mount → sets `{isOwner, isSignedIn, hasOperator, loaded}`
3. Three gate components consume this context:
   - `ClaimTabGate` — shows ClaimTab when signed in + no operator
   - `ReportTabGate` — shows privacy toggle when owner
   - `LabTabGate` — shows sandbox when owner
4. `ProfileEditModal` independently fetches `/api/v1/profile` for editable data
5. `CompareAgainstMe` independently fetches `/api/auth/session`

**Total: 4 independent client-side auth/session fetches** on mount.

---

## 5. Computed values (server, passed as props)

| Value | Source | Used by |
|---|---|---|
| `resolveName(operator)` | `display_name ?? codename` | header, body |
| `topPct` | `100 - row.percentile` | header, stats, overview |
| `buildArchetype` (page.tsx) | `describeBuildArchetype({pillars})` | header chip |
| `buildArchetype` (body) | `buildArchetypeOf({leverage,velocity,construction})` | overview archetype box |
| `fieldAvg` | `computeFieldAverages(boardRows)` | split-flap radar, deltas |
| `deltaFromAvg/Top` | arithmetic on yields | stats panel |
| `operatorRecords` | hall filter by codename/display_name | trophy room |
| `trophyCounts` | `computeTrophyCounts(cn, dn, rows)` | overview trophy room |
| `tierProgress` | `computeTierProgress(class, totalTokens)` | overview tier box |
| `radarAxes` | 6 cascade metrics, display-range maxes | cascade fingerprint |
| `rawRadarAxes` | 4 raw pillars, max-normalized | raw fuel radar |
| `heatRows` | SNR/V/L/Eff scaled to display range | heat bar |
| `evolutionPoints` | `history.map(h => {date, signa_rate})` | evolution line |

---

## 6. OG image route

`opengraph-image.tsx` — Satori server-rendered PNG (1200x630):
- Mirrors `SplitFlapCard` layout: gold left panel + black terminal right
- Two-series radar SVG (you vs avg) inline
- Fetches `getOperator(codename)` only
- Separate from the `/s/[codename]/card.png` share card and `/api/outreach-card/[codename]`

---

## 7. Key types

```ts
LeaderboardRow {
  operator: Operator          // identity, claimed, links, etc.
  snapshot: Snapshot           // cascade metrics, class_tier
  telemetry: Telemetry        // input/output/cache_read/cache_create
  global_rank: number
  percentile: number
  pending: boolean
  workflow_mode: "hitl" | "agentic" | null
  workflow_evidence_url: string | null
  window_type: string | null
  snapshot_date: string | null
}

CascadeMetrics {
  yield_: number
  snr: number
  leverage: number
  velocity: number
  dev10x: number | null
  scaleV: number
  efficiency: number
  costPerMillion: number
  opRatio: string
  cascadeStr: string
  construction: number
  nonCompounding: boolean
}

FieldAverages {
  yield_: number | null
  snr, leverage, velocity, dev10x, scaleV, efficiency, costPerMillion: number | null
  crRatio, outRatio, cwRatio: number | null
  opRatio: string | null
}
```

---

## 8. Migration notes for board integration

### What transfers directly
- **Identity header** — name, avatar, class badge, archetype, rank, percentile, HITL/agentic
- **Cascade fingerprint section** — KPI tiles, dual radar, op-ratio bar, heat bar, evolution line
- **CascadePanel** — species badge + 5 cascade stats
- **Trophy Room** — medal counts + records
- **Social panel** — handle, bio, location, links

### What needs adaptation
- **SplitFlapCard** (1372 lines) — currently lazy-loaded via IntersectionObserver; too heavy for the board's inspector rail. The board already has a lightweight `SplitFlapCard`-inspired terminal printout on the share cards. Consider: link to full profile instead of embedding.
- **OverviewTab** — the richest panel (scatter plots, bubble charts, tier progress). Could become a drill surface in the inspector or a dedicated profile stage view.
- **ProfileTabs** — the 6-tab system. In the board workspace, these could map to inspector rail modules or stage sub-views rather than tabs.
- **Auth gates** — 4 independent client-side session fetches. Board already has `useBoardSession`; consolidate.
- **Data overlap** — the board's `LiveOperator` already carries yield/rank/trend/cascade fields that overlap with `LeaderboardRow`. The detail fan-out (`enrich.ts`) fetches history/snapshots. Profile additionally needs: `getOperatorSubmissions`, `getOperatorReport`, `computeFieldAverages`, `computeTrophyCounts`, `computeTierProgress`.
- **Redundant fetches** — `OperatorRecords` re-fetches `getHallOfSignal()` even though `ProfileBody` already has it. `computeTrophyCounts` also fetches it internally. Consolidate when migrating.
- **Two archetype APIs** — `describeBuildArchetype` (pillar-based, page.tsx) vs `buildArchetypeOf` (axes-based, ProfileBody). Different return shapes. Pick one.

### Board surfaces that already replicate profile content
| Profile section | Board equivalent | Status |
|---|---|---|
| Cascade radar | DualSignatureRadar (solar/UV) | Different visual; same data |
| KPI stats | ColumnRanks (slide 2) | Covers 7 cascade + 5 raw tokens |
| Score trajectory | CombinedSignal (COMBO/SINGLE) | 5 traces vs 1 evolution line |
| Records / trophies | Records block in profile module | Same data, different layout |
| Social | Not on board | New surface needed |
| Submissions grid | Not on board | New surface needed |
| Report / Lab / Claim | Not on board | Owner-only; keep behind auth gate |

---

## 9. Wrapped route

`/user/[codename]/wrapped` — Spotify-style recap. Separate page, ISR 3600s.
Uses `WrappedStats` (`components/sigrank/WrappedStats`), `SignaHistoryChart`, `TrackWrappedView`.
Mostly self-contained; unlikely to integrate into the board workspace but could link from the profile module.

---

## 10. File index

| File | Lines | Type | Role |
|---|---|---|---|
| `app/user/[codename]/page.tsx` | 300 | server | header + metadata + Suspense shell |
| `app/user/[codename]/ProfileBody.tsx` | 622 | server | heavy data + 6 tab panels |
| `app/user/[codename]/opengraph-image.tsx` | ~860 | server | Satori OG PNG |
| `components/profile/CascadePanel.tsx` | — | server | species badge + cascade stats |
| `components/profile/SubmissionsGrid.tsx` | — | server | platform×window table |
| `components/profile/SnapshotHistory.tsx` | — | client | paginated snapshot list |
| `components/profile/ProfileTabs.tsx` | — | client | 6-tab switcher |
| `components/profile/OperatorRecords.tsx` | — | server | trophy room + records |
| `components/profile/OverviewTab.tsx` | ~376 | server | tier + archetype + charts |
| `components/profile/ProfileAuthGate.tsx` | — | client | auth context provider |
| `components/profile/ProfileAuthGates.tsx` | — | client | claim/report/lab wrappers |
| `components/profile/DeferredSplitFlapCard.tsx` | — | client | lazy split-flap loader |
| `components/profile/ProfileEditModal.tsx` | — | client | owner edit form |
| `components/profile/CompareAgainstMe.tsx` | — | client | compare link for visitors |
| `components/signature/SplitFlapCard.tsx` | 1372 | client | animated terminal card |
| `components/charts/CascadeRadar.tsx` | — | client | hexagonal radar SVG |
| `components/charts/OperatingRatioBar.tsx` | — | client | stacked token bar |
| `components/charts/EvolutionLine.tsx` | — | client | score trajectory line |
| `components/charts/KpiTile.tsx` | — | client | single KPI cell |
| `components/charts/HeatBar.tsx` | — | client | intensity ramp bars |
| `components/sigrank/OperatorAvatar.tsx` | — | server | avatar or initial |
| `components/sigrank/SignalClassBadge.tsx` | — | server | tier badge chip |
| `components/analytics/TrackProfileView.tsx` | — | client | PostHog event |
| `components/seo/JsonLd.tsx` | — | server | ld+json injection |
| `lib/analytics/field-average.ts` | — | util | field mean computation |
| `lib/analytics/build-archetypes.ts` | — | util | 10-way archetype classifier |
| `lib/analytics/trophy-counts.ts` | — | util | medal/record computation |
| `lib/analytics/tier-progress.ts` | — | util | class tier progress |
