# SignalAF Sharables · Offline Workspace

**Decision (22 October 2026):** The current sharables package contains only:
1. **White × holographic card** (one bone-white PNG, 1200 × 627).
2. **Holographic animation** of the same card as four color GIFs: aqua, coral, gold, violet.

This package is **not a new SignalAF page**. Do not copy these exports to \`public/\`, mount this workspace under \`app/\`, create a public catalog, or automatically email any recipient. The site's existing \`/s/[codename]\` share renderer and link-preview contract are unchanged; it remains the source used to generate editable exports.

## Locate all other shareables

Open \`tools/sharables-workspace/index.html\` **locally** in your browser. It is a self-contained searchable studio with:

- **23 source entries** for operator cards, Four Degrees LinkedIn/X graphics, compare graphics, platform share controls, review mockups and social assets.
- Source links that open the actual GitHub files for editing.
- Category search/filter, review state (To review / Editing / Approved / Archived), notes and JSON export/import.
- A separate pointer to the local \`labs/promo-kit/\`, containing additional social cards, carousels and GIF/video renderers. That directory is **git-ignored**, so its contents cannot be inventoried without access to the owner's workstation.

The **Sharables Archive** is a logical status/category in the workspace, not a new public site surface. Archiving a draft does not delete its source code.

## Build the five-file package locally

Use Node 22 and Playwright from the repository checkout:

\`\`\`bash
npm install
npx playwright install chromium
node scripts/export-sharables-package.mjs --codename signal-17cd049318
\`\`\`

An alternate public codename may be passed after \`--codename\`. Exports land in the gitignored \`release-staging/sharables-package/<codename>/\`, plus \`manifest.json\` checksums. The script checks PNG and GIF file signatures and ensures the downloaded media are nonempty.

**GitHub Actions:** use the workflow **Sharables · Offline Export** to produce the same five assets as a downloadable Actions artifact without pushing them onto the website. The workflow can also be dispatched manually for another codename after merging into \`main\`.

## Editing source files

| Role | Source |
| --- | --- |
| Bone-white/foil composition | \`components/share/BoneHolocard.tsx\` and \`components/share/bone-holocard.css\` |
| Palette/color selectors | \`components/share/BoneHolocard.tsx\` |
| Animated GIF palette/frames | \`components/share/holocard-gif.ts\` |
| Export buttons/browser capture | \`components/share/ArtworkShareControls.tsx\` |
| Passport inside foil panel | \`components/profile-v2/PassportCard.tsx\` |
| Gallery rendering/data | \`components/share/HolocardGallery.tsx\` |
| Every other known shareable | \`tools/sharables-workspace/index.html\` |

**Boundary:** The exporter uses the existing production renderer but does not add downloadable GIF endpoints, change social \`og:image\`, send emails, or publish assets. A later design review can decide which drafts should be moved to the production website.
