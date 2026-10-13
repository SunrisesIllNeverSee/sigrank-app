# Badge explorer and holocard layout — 2026-10-13

Preview: localhost:3230. Branch: integration/site-a315435. Local uncommitted changes; production unchanged.

## Completed

- Profile opening holocard controls stack below the full-width card in a compact two-column button grid. WebKit measured card bottom 641px and controls top 659px.
- Profile Badges view and Hall Badge Index share BadgeExplorer. Your badges / Badge index / Achievement index navigation appears in the left sidebar; searchable sections can be independently expanded.
- Earned icons are large and colored; unearned catalog icons are smaller, grayscale and dimmed. Descriptions and requirements live in hover/focus details; click pins the evidence panel and Escape closes it.
- Left sidebar shows current award count and progress toward the next active token-volume or standing milestone. Right sidebar shows the complete miniature Pixel, achievement and canonical rank-1/2/3 medal collection; actual holdings match the earned view.
- Badge details show source snapshot date, linked submission ID and stored snapshot hash where available. These are evidence dates/hashes, not invented historical badge-award dates or newly generated proofs.
- SnapshotRecord now optionally includes snapshotHash from the existing scored, operator-scoped snapshot_submissions read. No query added; private, retired and unclaimed guards remain intact.
- Verification badge requires exact verified/audited status; missing status no longer implies verified.

## Catalog gaps addressed as proposals

Existing catalog includes a blocked draft Cross-Platform design. There were no issued sharing/watch/per-platform token/combo awards.

Nine searchable proposals now cover: first/10 distinct shares; first/10 active watches; Claude/Codex 10M accepted all-time token milestones; dual-platform/three-platform milestones; combined share + watch discovery. They are clearly unissued. Thresholds are proposals, not new entitlement rules.

Wiring requirements before activation:
- Shares: durable, authenticated, deduplicated events with an explicit definition of qualifying share. A native share intent does not prove publication.
- Watches: use the owner's authenticated watchlist; never expose watcher identities on another profile. Decide active holdings versus lifetime history.
- Platforms: accepted, non-overlapping all-time totals per platform; never sum overlapping window submissions. Approve milestone tiers and platform normalization.
- Combos: require both independent qualified component awards.
- Historical award dates and per-award receipt hashes need a durable award ledger. Current UI only presents actual linked snapshot evidence.

## Verification

- WebKit: profile and Hall sidebar tabs; 8 live held items matched 8 colored miniatures; canonical medals colored only when held; two-column catalog section layout; Claude/combo search; hover details; pinned dialogs; keyboard arrows; controls below holocard.
- Live example: 10M token badge detail displayed actual source timestamp, submission UUID and stored sha256 hash.
- Snapshot/privacy/eligibility/query-budget tests: 26/26.
- Full node suite: 682 pass, 4 skip, 0 fail. Canonical checks: 11/11.
- TypeScript, touched-file lint and whitespace checks clean.
