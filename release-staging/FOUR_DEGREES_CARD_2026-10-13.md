# AI comparison card — LinkedIn revision

Preview: http://localhost:3230/share/four-degrees

Owner requested a modern LinkedIn graphic independent of site themes and focused on the chart. Replaced the terminal design with white, navy, blue and teal sans-serif artwork. Comparison sequence: modeled average world user; our field median; question-mark CTA (Find your rank); power-user median; SignalAF OITL highs; SignalAF Auto/review highs. All seven existing metrics retained.

World-user values are explicitly identified as the AA modeled reference, not a measured global average. Field/power columns reuse existing Four Degrees helpers. OITL/Auto highs use cached getLeaderboard all-time claimed operator totals with mode all so workflow values are resolved. Membership uses inCohort, including hybrid overlap and unresolved Auto review candidates; this is disclosed on the artwork. Noncompounding, pending and placeholder rows are excluded. Each metric is maximized independently; operating ratio uses the Yield leader of its cohort. This card does not change classification, scoring, or existing board filters.

Shared export controls now accept an optional backgroundColor. This card passes white; existing cards retain their dark default. Export uses 1200 CSS pixel width at 3×. Verified download was 3600×3633 PNG, visually inspected with both cohort columns populated. Stored at /Users/dericmchenry/Downloads/signalaf-ai-comparison-linkedin.png. Share gallery entry updated.

Validation: TypeScript clean, scoped ESLint clean, canonical 11/11, two targeted metric-high tests passed, git diff whitespace clean. Actual WebKit PNG download succeeded. No database migration or dependency added; production unchanged.

Owned files: components/share/FourDegreesShareCard.tsx; four-degrees-card.css; ArtworkShareControls.tsx optional export background; app/share/four-degrees/page.tsx; gallery entry in app/s/[codename]/page.tsx; lib/share/four-degrees-highs.ts; __tests__/board/four-degrees-highs.test.ts.
