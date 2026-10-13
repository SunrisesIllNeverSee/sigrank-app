# Artwork sharing — staged results, 2026-10-12

Branch: integration/site-a315435. Preview: http://localhost:3230. Changes remain uncommitted locally; production unchanged.

- Profile Overview: stronger, continuous visible foil sweep above the card content. Reduced-motion retains a static foil sheen. Share holocard / Download PNG / Copy link below the opening card.
- Four Degrees: branded comparison-table export on the SigRank embed and full Wiki article. Includes modeled-baseline vs median vs single-evaluation distinctions and source URL.
- Compare: Share VS matchup / Download PNG / Copy link in the right SHARE sidebar. Captures the full displayed matchup, raw/metric radars, statistics and history. Existing snapshot/matchup exports retained.
- Shared export controls lazy-load html-to-image, render at 3× resolution and restore all temporary capture changes. Cross-origin avatars are embedded using CORS image loading, without changing CSP. Safari needs a warm-up render to preserve embedded avatars; confirmed in generated PNG.
- Share invokes native file sharing when supported; denied/unavailable native sharing falls back to PNG download. User cancellation does not trigger a download. Copy link uses public signalaf.com URLs.

Validation: real WebKit PNG downloads succeeded for all three surfaces; holocard avatar and foil sheen, Four Degrees content, and full matchup visually inspected. Mocked native-share boundary received a PNG file; public copy URL and export-state cleanup verified. TypeScript and touched-file lint clean; canonical tests 11/11; diff whitespace clean. Actual system share-sheet submission not performed.
