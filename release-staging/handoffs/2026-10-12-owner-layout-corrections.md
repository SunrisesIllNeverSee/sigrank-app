# Owner layout corrections — 2026-10-12

Base checkpoint: c26b5aa on integration/site-a315435. Preview: http://localhost:3230.

- Homepage leaderboard toolbar uses a single grid row with equal flexible window/platform/class fields. Share retains CSV and PNG exports; shorter default field labels preserve their underlying filter values. Workspace row sizing keeps the footer and toolbar within the viewport.
- SigRank editorial tree retains Overview and its contents. Removed redundant Leaderboard/Compare/Hall entries from that topic; Methodology now belongs to Field.
- Compare sidebar defaults widen from 180/198 to 228/240 pixels. Replaced the 680px minimum stage and independently scrolling report/ledger panels with a viewport-height grid. All 16 ledger rows and four operator radars remain mounted.
- Restored the existing CompareHistoryChart (Yield overtime) instead of the token-volume chart introduced by 196bb34. Timeline allocation decreases from 240px to 120px. Corrected series colors to match the corresponding operator and abbreviated axis/end labels. Live-only selectors and guarded real history reads remain intact; no mock history restored.
- Supabase URL Configuration independently verified: only the production callback had been allowed. Added http://localhost:3230/auth/callback and http://localhost:3230/auth/callback?**. Production Site URL and callback remain unchanged. Configuration save confirmed; personal authenticated sign-in still requires the user to retry.

Verification: TypeScript and touched-file lint passed; canonical tests 11/11. Browser at 1229x739: toolbar height 43px, no horizontal overflow, footer bottom 739px; Compare report/ledger heights and scroll heights each 509px, four radars, 16 rows, timeline 118px inner height. At 1440x900 reports/ledger each 670px with matching scroll heights. Actual Safari visually checked and screenshot saved.

Screenshots live in the chat outputs folder: home-toolbar-fixed.png, compare-fixed-stage-1229.png, compare-fixed-stage-safari.png, staging-auth-local-callbacks.png.

Ownership: this change covers app/compare/page.tsx, CompareHistoryChart.tsx, compare-workspace.css, EditorialSidebar.tsx, LiveBoardWorkspace.tsx (default option labels only), board-cols.css and this receipt. Concurrent lib/board/queries.ts and mock-fallback-guard tests belong to the other implementation lane and are excluded from this commit.

Desktop fixed layout applies above 1050px width / 650px height. Smaller viewports retain an intentional scrolling stage rather than clipping content.
