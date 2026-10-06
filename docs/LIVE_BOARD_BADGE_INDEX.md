# Live Board — Badge Index (v1)

Owner request (2026-10-06): "the badges are going to need an index and
versions of each." This is the canonical registry — every badge key,
pattern source, palette, and where it renders. When a badge is revised,
bump its `ver` and record the delta here; patterns live in
`components/live/PixelBadge.tsx`.

## Index — v1 (extracted from `10_badge_system.png`)

| key | label | ver | palette | cells | awarded for |
|---|---|---|---|---|---|
| `verified` | VERIFIED OPERATOR | 1 | mosaic (violet/red/blue/pink/yellow/magenta) | 3×3 | `verification_status === verified` — avatar corner + name line |
| `top1` | TOP 1% LEGEND | 1 | purple + magenta | 3×3 | percentile ≥ 99 — name line |
| `top5` | TOP 5% ELITE | 1 | blue + slate | 3×3 | percentile ≥ 95 — name line |
| `top10` | TOP 10% ACHIEVER | 1 | lime + slate | 3×3 | percentile ≥ 90 — name line |
| `days100` | 100 DAYS CONSISTENT | 1 | yellow/orange/red | 3×3 | `account_age_days ≥ 100` — profile BADGES row |
| `tokens10m` | 10M TOKENS MILESTONE | 1 | cyan + white | 3×3 | reserved — wire when a total-tokens milestone is in the payload |

## Render rules (v1)

- **Avatar corner** (`.avbd`): `verified` only — top-left overlay on
  `.av`/`.mav`/`.hav`.
- **Name line** (`.nm`): percentile tier badge, right of the verified
  check — one badge, highest tier only.
- **Profile BADGES row**: full earned set (verified + tier + days100).
- Versioning: pattern changes bump `ver` in this table + a comment at
  `BADGES` in `PixelBadge.tsx`. Palette swaps ride the theme vars and
  don't need a version bump.

## Platform badge family (planned — owner note)

Share surfaces get per-platform badge cards (GitHub / X / LinkedIn /
Facebook / email) when accounts link. Each platform = a new PixelBadge
entry (`gh`, `x`, `li`, `fb`, `em`, …) with its own 3×3 pattern + a
GENERATE flow targeting `/share` gallery rather than single `/s/<slug>`.
Candidate for a dedicated agent pass — see LIVE_BOARD_ASSET_AUDIT.md.
