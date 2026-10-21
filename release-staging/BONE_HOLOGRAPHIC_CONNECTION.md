# Bone holographic share-card connection — 2026-10-14

Location: `/s/<codename>#share-bone-holocard`, inside the existing holographic gallery.

The new client composition uses the existing server-rendered PassportCard, supplied by HolocardGallery. Identity, scored snapshot, global/workflow ranks, selected badges and trophies come from the same existing reads as the original portrait. No new database queries, public API routes or stored profile fields were introduced. The existing private-profile gate runs before either composition is rendered.

Tokens/day uses snapshotThroughput with all four raw pillars and the snapshot's exact start/end dates. Missing dates and pending data show an em dash. Operational ratio uses the same cascade leverage and velocity as the portrait. Nothing is copied from the local design studio's dated operator image.

Four hologram colors and eight logo treatments are selectable. Copy links preserve palette/brand query parameters and the section anchor. Download PNG renders 1200×627 regardless of preview scale. GIF uses the same image, at 1200×627, with 24×170ms frames; subsequent frames encode only the moving right panel. The original portrait remains available with its existing export behavior. Distinct card IDs prevent targeting the wrong portrait.

Validation: canonical 11/11; TypeScript; focused ESLint; Chromium and WebKit at desktop/mobile widths; four colors/eight logos; real PNG and GIF downloads; exact image dimensions/frame counts/timing; unchanged paper region throughout GIF animation; no duplicate IDs or JavaScript exceptions; a second real operator swaps identity and metrics. The connected card was opened and visually inspected in native Safari.

Local review: http://localhost:3231/s/<codename>?palette=aqua#share-bone-holocard

Source branch: feat/bone-holo-share-card. Production deployment is separate from local review. The standalone design studio and its owner feedback were not modified by this integration.
