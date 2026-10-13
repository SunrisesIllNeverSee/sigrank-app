# Profile navigation and Pixel designs — 2026-10-13

Staging: localhost:3230, integration/site-a315435. Local changes; production unchanged.

- Share Gallery is next to Badges in the top profile navigation (WebKit measured 8px gap); it points to the displayed operator's /s/<codename> gallery.
- Removed the sidebar Shareables Gallery link on all profile views.
- Badges-only sidebar retains collection tabs and Earned → Next. The listed Badge Gallery, capture controls, Back to Board and Operator block are hidden only on this view. Other profile views retain them. Universal shell Back/Home controls remain.
- Added fourteen editable 7×7 Pixel proposals in components/profile-v2/community-pixel-proposals.v1.json: sharing (3), watches (3), platform use (4), combinations (4).
- PixelArtwork now handles grid dimensions from the pattern; existing 3×3 patterns remain supported.
- Badge index Color preview enlarges and colors proposal art without changing earned status. Hover/focus details show a larger color artwork preview. Actual mini-ledger/earned status remains unchanged.
- All new rules remain proposals, not automatic grants. Their evidence requirements and visual motifs are included in the JSON catalog.

Validation: TypeScript/touched lint/whitespace clean. WebKit checked badge-only sidebar removal, top-link target and adjacency, non-badge capture preservation, platform design filtering, 49-cell artwork preview, and complete fourteen-design contact sheet.

Review image: release-staging/evidence/community-pixel-proposals-2026-10-13.png.
