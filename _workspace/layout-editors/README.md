# Layout Editors — Hall & Compare

Mid-fidelity **spatial layout editors** for fitting the existing Hall and
Compare production pages into the fixed SignalAF workspace frame
(icon rail · left panel · stage · right inspector · footer strip).

This is a configuration tool, not a redesign — the exported JSON is the
implementation contract for the real React work later.

## Run

No build, no server needed:

```bash
open _workspace/layout-editors/index.html        # picker
open _workspace/layout-editors/hall.html         # direct
open _workspace/layout-editors/compare.html      # direct
```

Designed for 1600×1000; usable at 1440×900.

## Controls

| Area | What |
|---|---|
| ◧ L / ◨ R | collapse / show left + right panels |
| panel edge (hover) | drag to resize; numeric width shown; `reset` restores 220/260 |
| GRID | `overlay` toggle · 8/12/16 columns · `snap` toggle |
| Stage tiles | drag header to move · corner handle to resize · `✕` hides |
| Sidebar modules | ↑/↓ reorder · `◉/◌` hide/show · drag onto other panel or stage (drop target live) |
| Click a tile/module | opens the inspector (zone · x/y · w/h · visible · arrows · nudge buttons · reset tile) |
| PRESET | `CURRENT FLOW` (production order) / `WORKSPACE COMPACT` |
| SAVE LAYOUT | persists to `localStorage` (`layout-editor:<page>`) |
| RESET | back to defaults · RESET TO PRESET re-applies the active preset |
| EXPORT JSON | opens + copies the layout contract JSON · DOWNLOAD saves the file |
| PREVIEW MODE | hides handles/grid/buttons; drag/resize are inert |

## Export format

```json
{
  "page": "compare",
  "viewportReference": { "width": 1600, "height": 1000 },
  "panels": { "left": { "visible": true, "width": 220 },
              "right": { "visible": true, "width": 260 } },
  "grid": { "columns": 12, "snap": true },
  "tiles": [
    { "id": "CMP-02", "component": "CompareMatchup", "zone": "stage",
      "x": 0, "y": 0, "w": 8, "h": 3, "order": null, "visible": true }
  ]
}
```

Stage tiles: `x`/`w` in grid columns, `y`/`h` in 36px grid rows.
Sidebar tiles: `zone: left|right` + `order`.

## Tile inventories

Compare tiles map to `app/compare/page.tsx` components:
`CompareAgainstMe`+selectors, `CompareMatchup`, `CompareRadars` (split into
raw/metric tiles for spatial play — production renders them paired),
`CompareHistoryChart`, `CompareLedger`, `CompareShareCard`,
`DeferredCompareMatchupCard`, `ChallengeBar`, `ChallengeOnX`, plus
placeholder side modules (A/B mini profiles, matchup summary, metric
context).

Hall tiles map to `app/hall/page.tsx` + `components/hall/*`: `HallHero`,
`HallHeader` scope/window/class/platform controls, `RecordTicker`,
`MetricTopTen` boards (yield/leverage/velocity/snr/10xdev + other-metrics
group), plus placeholders (featured record, selected-record inspector,
holder mini, record actions, hall rules).

Not included on purpose: `ComingSoonMarkers` (hall footer strip — a footer
element, not a movable tile), `JsonLd`, `TrackCompareView`, `WaveHero`
(page-level chrome, not tiles).

## Scope

- No production files touched — everything lives under `_workspace/`.
- No APIs, no backend — `localStorage` only.
- Hidden tiles are recoverable via the `HIDDEN` rail in the toolbar.
- Grid-column changes clamp out-of-range tiles back into the canvas.
- Profile editor not built yet; the framework (`editor.js` + page-level
  `window.EDITOR` registry) supports adding `profile.html` with a tile
  list + presets.
