# Profile lane reconciliation — 2026-10-12

## Verified baseline

- Worktree: `/Users/dericmchenry/Developer/active/SigRank-repos/signalaf-integration-a315435`
- Branch: `integration/site-a315435`
- HEAD and GitHub branch: `d1a525fabfcae0624716faec516e8a04d5ef5f20` (checked with git ls-remote).
- Devin profile commits `260b849`, `4266818`, and `c95cf8b` are included. The report's initial `2eec3df` clean-tree checkpoint is historical, not the current working-tree status.
- Preview: `http://localhost:3230`. `http://localhost:8791/shell.html` is the mock, not the integrated application.
- GPT's newer board commit is included in this baseline. Its toolbar lane was not changed in this reconciliation.

## Preserved profile work

- Rail submission activity and honors; centered native dialogs and record detail dialogs.
- Holographic shine, workflow marks, field/cohort rank contexts, and compressed ticker gaps.
- `app/user/[codename]/ProfileBody.tsx` still passes `percentile={fieldPct}` to BadgesView. This remains part of the uncommitted badge lane, as Devin requested.
- Earned-only profile gallery, Hall badge directory, owner Settings link, earned Pixel and secondary-logo choices, and Passport selected marks remain in the working tree.

## Reconciliation fix implemented

`app/api/v1/profile/route.ts` GET previously returned saved mark IDs but omitted `pixel_badges`, `secondary_logos`, and `mark_settings_ready`. `components/profile/ProfileEditModal.tsx` passes that response into the shared ProfileEditForm, so the popup could show unavailable badge controls even when the Settings page offered them.

GET now returns live eligible options and schema availability, and clears stale selections from the returned form data using the same eligibility checks as `/me/edit`. Normal unauthenticated behavior remains `{operator:null}`. Options use the existing cached leaderboard/Hall accessors; no new raw corpus query or cache policy was introduced. The fix is in the working tree, not yet committed or pushed.

## Verification rerun for this reconciliation

- TypeScript: passed.
- Canonical: 11/11 passed.
- Full unit suite: 682 passed, 0 failed, 4 skipped.
- Scoped ESLint and git diff --check: passed.
- Current staged profile WebKit suite: 36/36 passed, covering centered activity/honors dialogs, 154-cell rail, records, shine, field/cohort ranks, pending states, and 820px overflow.
- Test copies write screenshots to `/tmp/profile-reconcile-evidence` so shared release evidence is not overwritten.
- Staged earned-badges profile and `/hall/badges` returned HTTP 200 in WebKit, with no horizontal overflow; directory screenshot reviewed. Anonymous profile GET returned HTTP 200 and `{operator:null}`.
- Real signed-in badge preference save was not exercised; no authenticated owner session was supplied to these checks.

## Open findings and ownership

1. **Owner clarification: intentional usage simulation.** The owner confirmed the heatmap intentionally simulates usage until daily observations are available. Do not remove that simulation as a defect. The simulated cells also feed activity/streak totals; keep their interpretation distinct from observed daily submission history when reviewing the UI. Actual day-based wiring is future work.
2. **Artwork consistency implemented in staged code.** Shared metric/Hall symbols live in `lib/profile/record-artwork.ts`. The right rail, earned gallery, Settings selector, and selected secondary Passport mark use the same double-hex record artwork with standing-metal rings and metric-family symbols. The gallery now renders individual owned Hall awards rather than one generic Hall badge. Changes remain uncommitted.
3. **Legacy ownership consistency implemented.** `lib/profile/profile-marks.ts` recognizes case-insensitive codename and the current operator display-name keys, matching the rail's legacy ownership convention, and excludes placeholders. Three focused tests in `__tests__/board/profile-marks.test.ts` cover owned legacy/current records, other-owner/placeholder exclusion, metric versus standing distinction, and Pixel eligibility. They pass; TypeScript, canonical 11/11, scoped lint, diff check, and profile WebKit 36/36 also pass. The rendered gallery has no horizontal overflow.
4. **Preference persistence: schema check performed after owner reported migration 0052 implemented.** A read-only zero-row select against the staged app configuration (`copqtaqzsdvpdbhpwjmt.supabase.co`) returned PostgreSQL 42703: `operators.profile_pixel_badge` does not exist. The migration file is present, but these columns are not available in the preview database. Confirm where the SQL was executed before applying it again. Then verify an authenticated owner selecting earned marks, saving, reloading Settings, and opening the profile card. No preference or schema writes were made during this check.
5. **Devin/owner: rank semantics.** API current_rank/rank_history versus combined-field display remains a documented semantic discrepancy. Do not silently revise thresholds or taxonomy while reconciling display code.
6. **Devin/owner: attestation concern.** Owner clarified Hybrid means the combined field and questioned old hybrid/agentic category assumptions. Real external attestation evidence and the current category/threshold rules must be checked separately; do not classify an old category name as proof that the updated rules are wrong.

## Next handoff

Review GPT's leaderboard report against this same worktree and pushed baseline. Keep profile reconciliation, board layout, and database changes in separate scoped commits. Exclude pre-existing modified screenshot evidence from any code commit unless its owner explicitly includes it. No main merge or production deployment occurred in this review.

## Direct Supabase schema follow-up

After the owner asked about migration 0053, inspected the Sigrank project through the Supabase connector: information_schema contains legacy `badges` and `operator_badges` tables, but no profile_pixel_badge/profile_secondary_logo columns. The migration ledger contains neither 0052 nor 0053, and the authorized repo tree contains only `20261012120000_0052_profile_visual_marks.sql` for these preferences. Manual SQL-editor runs need not create migration-ledger entries, so ledger absence alone is not proof an upload was not run. The actual missing columns are the blocking evidence. The uploaded 0053 SQL has not been identified; do not call the 0052 file an updated 0053 migration or reapply different SQL blindly. No database writes were made.

## Pixel selector omission corrected

Owner reported no selectable Pixel badges after storage was enabled. The profile selector and gallery previously implemented only percentile and verification marks; the existing leaderboard's 10M token milestone was omitted. `lib/profile/pixel-eligibility.ts` now shares the existing standing/verification and exact 10M processed-token rule between `profile-marks.ts` and `BadgesView`. The profile passes the combined board row's four raw pillar sum; preferences derive the same sum with existing sortValue. No new catalog proposal, rank, verification status, or simulated-day award is issued. Staged MO§ES profile returned HTTP 200 and visibly showed 10M Tokens Milestone in WebKit. TypeScript, scoped lint, diff check, canonical 11/11, and six ownership/eligibility tests passed. Changes are in the local staging worktree and remain uncommitted. Signed-in save-and-reload remains an owner session check.

## Saved Pixel badge navigation and card styling

Supabase confirmed the operator had saved `tokens10m`, but the shared workspace session still derived its badge only from percentile. `components/live/session.ts` now reads the existing owner-scoped profile GET response in parallel with the rank lookup, accepts the saved recognized badge only for the matching owner, and respects a cleared preference. `ProfileEditForm` invalidates the shared session after a successful save so navigation and account chrome refresh together. `PassportCard` removes the selected Pixel overlay's opaque background, border, and shadow and displays the artwork at 28px. No saved preference was modified for testing. Three focused session tests cover selected token badge, cached-request deduplication, change/clear refresh, and owner mismatch. WebKit with a mocked signed-in response showed the 10M badge in PROFILE navigation; the actual server-rendered card container had transparent background, 0px border, and no shadow. Real authenticated navigation was not automated. Code remains in local staging, uncommitted.
