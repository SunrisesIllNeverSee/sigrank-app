# Live Board — Asset Pack Audit + Surgical Upgrades (2026-10-06)

Source packs reviewed:

- `~/Downloads/SignalAF_SigRank_logo_asset_pack/` — brand board, mark icon
  set, logo variations, palettes, typography, badge system
- `~/Downloads/SignalAF_share_system_12_sections 2/` — global language,
  flagship signal card, momentum card, hall record card, milestone badges,
  credential card, story card, QR module

## What the packs confirm (no drift)

- **Palette**: Signal Lime `#A6FF00`, Bone `#F7F7F2`, Navy `#0B0F14`,
  Charcoal `#1A1E25`, Slate `#2C3138` + accents Cyan `#00E5FF`, Blue
  `#3B82F6`, Purple `#A855F7`, Magenta `#FF00D4`, Orange `#FF9A3C`, Yellow
  `#FFE600` — identical to the board's `--*` tokens in
  `components/live/proto-scoped.css`.
- **Type**: Inter / Space Grotesk (UI) + JetBrains Mono (terminal) — matches
  `components/live/fonts.ts`.
- **System context**: mosaic `SIGRANK` = model benchmarks; `signalaf` XX
  mark = operator evaluations (the board's product surface).

## Extracted assets now in the repo

- `public/live/signalaf-mark.png` — the canonical XX mark (lime,
  transparent, 66×60). Cropped from `03_signalaf_mark_icon_set.png`,
  dark pixels keyed to alpha. Referenced by `SharePreview` in
  `components/live/OperatorDock.tsx`.
- `docs/assets/live-board-icon-options.png` — the 5-set icon options
  sheet rendered at rail size (A pixel-art / B glyphs / C emoji /
  D minimal / E hex-badges). **Option A implemented** in
  `components/live/PixelIcon.tsx` (5×5 block grids, `currentColor` so
  per-icon accents apply); swappable per owner pick.

## Lost / degraded elements vs. the packs (the surgical list)

1. **Pixel medallions (buttons/pins)** — the badge sheet's 3×3 block
   badges (TOP 10% ACHIEVER, TOP 5% ELITE, TOP 1% LEGEND, 100 DAYS
   CONSISTENT, 10M TOKENS MILESTONE, VERIFIED OPERATOR). Board surfaces
   that should use them: the `✓` verified chip → VERIFIED block badge;
   percentile cells → TOP X% badge; TROPHIES strip → block badges.
2. **Hexagon milestone medallions** — hex outline + inner glyph + label
   (pack section I). Target: TROPHIES strip + class medallion chips.
3. **Hexagonal radar** — flagship card uses concentric hex rings + filled
   shape. Our dock/share radar is polygonal; hex rings would match the
   card graphics. (Dual-layer stays; rings → hex.)
4. **Sparkline metric cells** — flagship card right column: label + big
   number + mini sparkline. Target: HOT STATS + MOVERS modules.
5. **Hall record card (bone)** — cream monument treatment (TOP 1% / RANK /
   ALL-TIME BEST). Target: HallSpot "lifetime achievement" variant.
6. **Momentum card** — "Up 723 spots in the last 30 days" + area chart.
   Target: movers module hero treatment when a mover is featured.
7. **Mosaic SIGRANK wordmark** — pixel-mosaic wordmark for footer/title
   treatments (optional; keep pagetitle as-is unless owner wants it).

## Icon decision

Rail icons per `docs/assets/live-board-icon-options.png`. Implemented:
**Option A (pixel-art)** — consistent with the pixel mark + badge system.
Other sets remain one-line swaps in `LiveBoardWorkspace.tsx` if the owner
prefers B–E.
