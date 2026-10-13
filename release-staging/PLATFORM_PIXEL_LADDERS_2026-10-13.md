# Cumulative platform Pixel ladders — staging receipt

Implemented on integration/site-a315435. Preview: http://localhost:3230/user/signal-92b4f9f485?tab=badges . Included with the preceding badge UI work in the scoped staging commit titled "feat(profile): add badge explorer and cumulative platform pixels". No production deployment.

## Delivered

- 35 distinct progressive 7×7 Pixel designs: five tiers (10M, 100M, 1B, 10B, 100B tokens) for Claude, Codex, ChatGPT, Gemini, Pi, Devin, and Oh My Pi.
- Actual earned tiers appear in Your badges and the right-side inventory. Unreached tiers stay small and dim in the searchable Badge index.
- Left sidebar shows recorded platform totals and progress toward each next tier.
- Shared eligibility feeds the owner mark options and save validation. The rail Pixel renderer recognizes the new IDs and retains its 25×25 footprint.
- Existing creative proposals remain proposals; no sharing/watch awards are fabricated.

## Evidence rules

Use the latest accepted, explicitly attributed all-time total per platform. Do not sum repeated snapshots or shorter windows. Mixed, other, inferred-platform, invalid-date, non-finite, conflicting same-date, and pending facts cannot award platform tiers. Aliases normalize without combining Pi with Oh My Pi. These are current-total eligibility milestones, not a permanent historical award ledger.

Platform details use their source snapshot date. A proof hash is linked only when the same platform/all-time/date record exists; combined-field hashes are not reused as platform proof.

## Ownership and data cost

Core registry and rules: lib/profile/platform-pixels.ts; lib/profile/pixel-eligibility.ts. Existing profile integration: lib/profile/profile-marks.ts, app/user/[codename]/ProfileBody.tsx, components/profile-v2/BadgesView.tsx, BadgeExplorer.tsx, components/live/PixelBadge.tsx. lib/board/queries.ts adds an attribution flag to existing submissions, with no new SQL query or column.

Profile rendering passes its already loaded submissions, adding no database reads. Other mark-option callers reuse the existing operator-scoped getOperatorSubmissions cache (180 seconds); a cold helper call includes the existing operator lookup and bounded snapshot read. No unfiltered corpus scan was added. Existing privacy and claim guards remain in force.

## Validation

- TypeScript: clean.
- Scoped ESLint: clean.
- Relevant Vitest suite: 38/38 passed across six files, including six ladder cases and profile query-budget coverage.
- Canonical tests: 11/11 passed.
- Full Node unit suite: 682 passed, zero failures, four skipped.
- git diff --check: clean.
- WebKit staged profile: 18 current awards. Claude 5,834,451,618 and Codex 2,324,630,463 tokens unlock through 1B; Devin 45,741,150,062 unlocks through 10B. Claude index correctly shows three earned and two dim future tiers.
- Browser screenshot: /tmp/platform-pixel-ladder.png.

Authenticated selection/save of a newly added tier has not been exercised end-to-end in this turn; shared eligibility and renderer paths are wired and covered by scoped checks.

## Next handoff

Keep incoming agents on this staging tree. Preserve unrelated edits. No new migration or dependency is required. Editorial refactor 220c7d2 on feat/live-board-2b was checked: staging already has identical lib/editorial helpers and BlogWorkspaceFrame, introduced via 5fdcd76, with newer page/sidebar/layout changes. Do not cherry-pick the older editorial state over those newer owner edits.
