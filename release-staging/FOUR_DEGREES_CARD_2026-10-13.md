# Four Degrees custom share card

Preview: http://localhost:3230/share/four-degrees

Created a dedicated post layout in the current pixel/terminal visual style: gold block-letter heading, four colored reference panels, all seven chart metrics, and source/provenance notes. Added a direct entry to the existing operator share gallery. Existing chart layouts are preserved.

Uses existing getAverageUsersColumn/getPowerUsersColumn/getTopOperatorColumn helpers and AA_BASELINE; no new scoring or database path. Missing measured columns show an em dash rather than static reference numbers presented as live data. Existing helper cohort definitions remain unchanged.

Share, Download PNG, and Copy link use the existing ArtworkShareControls component. Export fixes the artwork width at 1080 CSS pixels with a 3× capture: tested PNG was 3240×3162. Public source link points to /wiki/four-degrees. The rendered page is still staging-only.

Validation: TypeScript clean; scoped ESLint clean; canonical 11/11; diff whitespace clean. WebKit rendered the card and successfully downloaded the real PNG. Export visually inspected for clipped labels, source notes, and legibility. Local downloaded artwork: /Users/dericmchenry/Downloads/signalaf-four-degrees-card.png.

Owned files: components/share/FourDegreesShareCard.tsx, components/share/four-degrees-card.css, app/share/four-degrees/page.tsx, and the Four Degrees entry in app/s/[codename]/page.tsx. No dependency or migration required.
