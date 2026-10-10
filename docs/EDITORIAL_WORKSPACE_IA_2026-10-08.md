# SignalAF — Unified Editorial/Research Workspace IA

**State:** local implementation on `feat/live-board-2b`, uncommitted pending owner review.  
**Preview:** `http://127.0.0.1:61173/`  
**Boundary:** preserve the live board, Hall, Compare, underlying metrics, research documents, citations, SEO metadata, and canonical document URLs.

## Navigation authority

One shared Level 1 nav at the top of the **left sidebar**, in this exact order:

| Level 1 | Entry | Level 2 choices shown when selected |
|---|---|---|
| **SigRank** | `/` | Overview, Leaderboard, Compare, Hall of Signal, Methodology |
| **Field** | `/fieldhub` | Field Hub, Field Analysis, State of the Index (dataset), Academic Foundation (Science), About |
| **Articles** | `/articles` | Articles index, existing long-form essays and analytical publications |
| **Blog** | `/blog` | All Posts, Benchmarking Workflows, AI Coding Tools, Operator Scoring |
| **Wiki** | `/wiki` | Wiki Index, Four Degrees, Verification, Methodology Refinement, Local Agent |

This is **Level 1 → selected Level 2**, not six duplicated navigation banners on every page. Sections may additionally have a **local document TOC** (Field chart anchors, Wiki topics, or the Blog index), beneath the shared two-level IA. Level 1 order and Level 2 links are owned by `components/field/FieldWorkspaceFrame.tsx`'s `FieldFamilyNav` until a future neutral filename refactor is warranted.

## Content classification — without duplication

The existing Markdown files in `content/blog/` already have `type: article` frontmatter. `/articles` is a new index of precisely those files. At this revision the catalog contains four original articles. All still render at their pre-existing URLs `/blog/<slug>`; this avoids redirects, broken citations, duplicate SEO pages, and copied content. The article detail page selects **Articles** in the left rail when its frontmatter says `type: article`.

`/blog` now indexes the existing non-article content (**13 existing static guide/tool/commentary routes**), without moving their routes or changing their source articles. Five working static routes had previously been omitted from the index; they are now included based on their existing metadata. This classification is driven by existing source metadata rather than guessing by title or recategorizing texts by tone.

**Academic reports and foundations** live under Field's Level 2 for now: `/field` (empirical analysis), `/research` (historical data, Zenodo and DOI), `/science` (theoretical foundation), `/fieldhub` (research entry). `/about` also sits beneath Field per the immediate owner direction. None of these have been moved or copied.

## Stage geometry

`WorkspaceShell` now has an opt-in `editorialStage` prop so **only** editorial/research pages inherit a standardized stage layout. The live leaderboard and its Hall/Compare workflow surfaces are not affected.

The editorial Stage owns a centrally aligned `max-width:1120px` composition, with balanced responsive horizontal padding. Its long-form readable measure is `max-width:880px` and remains centered as the inspector widths change. Short research landings, field data charts, and long-form articles can use appropriate variant widths; the same outer stage alignment and spacing rules apply.

The content stage remains scrollable; both sidebars remain in the existing desktop workspace positions and retain their existing resize/collapse behavior. Article body, charts, images, data visualizations, anchor IDs, schema, and text are not rewritten.

**Right inspector is always contextual**, never another copy of the navigation:
- Field Analysis: statistical field summary, provenance, citation, related reading
- State of the Index: dataset DOI, version, source stats
- Science: research foundation/DOI
- Articles: publication metadata, source DOI if actually supplied
- Blog: post index/reading assistance
- Wiki: canonical telemetry/verification facts

## Acknowledged pending decisions

- **URLs:** Existing `/blog/<slug>` original article URLs are retained; whether future publications should be created directly under `/articles/<slug>` is a later canonical-routing decision.
- **Editorial taxonomy:** Existing frontmatter is authoritative for this first-pass separation. No inferred peer-review status or DOI is added to material without published evidence.
- **SigRank homepage:** Its marketing/benchmark modules retain their distinct full-stage composition. This task standardizes editorial pages without squeezing the board/marketing data views.
- **Sidebar names:** `FieldFamilyNav` is now a five-section navigator despite the legacy filename; rename can happen after owner acceptance without changing behavior.

## Verification criteria

1. Each of the five Level 1 links appears once, in order, on every text surface.
2. The selected Level 1 determines the Level 2 list, even for a deep article or wiki route.
3. Every Level 2 href resolves; active section/page is visibly marked and accessible to keyboard users.
4. `/articles` and `/blog` show distinct source-derived collections; original /blog article detail URLs remain valid.
5. Editorial Stage and long-form reading column are horizontally centered and have consistent spacing at 1600×1000 and 1440×900.
6. Right inspector varies by page; no unsourced metrics/DOIs added.
7. No impact on production leaderboards or core telemetry.
8. TypeScript/lint and browser smoke tests pass; identify pre-existing warnings separately.

**Do not deploy or merge until the owner reviews the unified structure and Stage.**
