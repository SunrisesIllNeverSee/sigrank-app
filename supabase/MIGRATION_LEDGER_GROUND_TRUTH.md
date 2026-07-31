# SigRank Supabase Migration Ledger — Ground Truth

> **Discovered 2026-07-31 by Drep2** via direct query of live
> `supabase_migrations.schema_migrations` on the linked Sigrank project
> (`copqtaqzsdvpdbhpwjmt`, East US Ohio) using `supabase db query --linked`.
> This file is the authoritative record of the remote ledger state BEFORE
> reconcile. It supersedes the stale mapping table in `README.md` (which
> stopped at 0023 and incorrectly claimed several migrations had no ledger
> entry).

## Method

```sql
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
```

Plus schema introspection (`information_schema.tables`, `information_schema.routines`,
`information_schema.columns`) to confirm what's actually applied.

## Remote ledger state (42 entries, all marked applied)

### Numbered migrations (30 entries, versions `0001`–`0030`)

Every numbered local file has a matching ledger row. The README's claim that
0006, 0009–0012, 0018, 0021–0023 had "no ledger entry" is **WRONG** — they
are all present.

| Ledger version | Ledger name | Local file | Notes |
|----------------|-------------|------------|-------|
| 0001 | init | 0001_init.sql | CLI-applied |
| 0002 | billing | 0002_billing.sql | CLI-applied |
| 0003 | audit_patch | 0003_audit_patch.sql | CLI-applied |
| 0004 | challenges | 0004_challenges.sql | CLI-applied |
| 0005 | token_pillars | 0005_token_pillars.sql | CLI-applied |
| 0006 | pg_trgm_schema | 0006_pg_trgm_schema.sql | |
| 0007 | identity_columns | 0007_identity_columns.sql | ALSO has timestamp dupe (see below) |
| 0008 | public_view | 0008_public_view.sql | ALSO has TWO timestamp dupes (see below) |
| 0009 | auth_accounts | 0009_auth_accounts.sql | |
| 0010 | storage_avatars | 0010_storage_avatars.sql | |
| 0011 | auth_operator_id_private | 0011_auth_operator_id_private.sql | |
| 0012 | identity_locks | 0012_identity_locks.sql | |
| 0013 | device_enroll | 0013_device_enroll.sql | ALSO has timestamp dupe |
| 0014 | enroll_rpc | 0014_enroll_rpc.sql | ALSO has timestamp dupe |
| 0015 | platform_slots | 0015_platform_slots.sql | ALSO has timestamp dupe |
| 0016 | revoke_rebind | 0016_revoke_rebind.sql | ALSO has timestamp dupe |
| 0017 | drop_circles_indexes | 0017_drop_circles_indexes.sql | ALSO has timestamp dupe (partial — p6_revoke_anon_circles) |
| 0018 | seed_homes | 0018_seed_homes.sql | |
| 0019 | the_field_autoupdate | 0019_the_field_autoupdate.sql | ALSO has timestamp dupe |
| 0020 | delete_account | 0020_delete_account.sql | ALSO has timestamp dupe |
| 0021 | site_counters | 0021_site_counters.sql | ALSO has a DISTINCT timestamp migration 20260716160000 (see below) — NOT a dupe |
| 0022 | lock_recompute_the_field | 0022_lock_recompute_the_field.sql | |
| 0023 | source_attestation | 0023_source_attestation.sql | |
| 0024 | the_field_median_upsilon | 0024_the_field_median_upsilon.sql | |
| 0025 | atomic_throttle | 0025_atomic_throttle.sql | ALSO has a DISTINCT timestamp migration 20260727120000 (see below) — NOT a dupe |
| 0026 | operator_reports | 0026_operator_reports.sql | |
| 0027 | crm_calculate | 0027_crm_calculate.sql | |
| 0028 | reparse_rpc | 0028_reparse_rpc.sql | |
| 0029 | consent_tracking | 0029_consent_tracking.sql | |
| 0030 | clear_operator_data | 0030_clear_operator_data.sql | |

### Timestamp migrations (12 entries)

These are the Dashboard-applied originals. Most are logical duplicates of a
numbered migration (same SQL effect, different file representation). Two are
**distinct** migrations that collide on the 00NN number with a different
numbered file.

| Ledger version | Ledger name | Local timestamp file | Numbered counterpart | Relationship |
|----------------|-------------|----------------------|----------------------|--------------|
| 20260624153429 | 0007_identity_columns | 20260624153429_0007_identity_columns.sql | 0007_identity_columns.sql | DUPLICATE (timestamp = original applied; numbered = record-only copy with extra comments) |
| 20260624171956 | 0008_public_view | 20260624171956_0008_public_view.sql | 0008_public_view.sql | DUPLICATE |
| 20260624172019 | 0008_public_view_revoke | 20260624172019_0008_public_view_revoke.sql | 0008_public_view.sql (partial) | DUPLICATE (the revoke was folded into the numbered 0008 file) |
| 20260625080637 | p6_revoke_anon_circles | 20260625080637_p6_revoke_anon_circles.sql | 0017_drop_circles_indexes.sql (partial) | DUPLICATE (the revoke is part of what 0017 documents) |
| 20260625220535 | 0013_device_enroll | 20260625220535_0013_device_enroll.sql | 0013_device_enroll.sql | DUPLICATE |
| 20260625220551 | 0014_enroll_rpc | 20260625220551_0014_enroll_rpc.sql | 0014_enroll_rpc.sql | DUPLICATE |
| 20260626141333 | 0015_platform_slots | 20260626141333_0015_platform_slots.sql | 0015_platform_slots.sql | DUPLICATE |
| 20260626141832 | 0016_revoke_rebind | 20260626141832_0016_revoke_rebind.sql | 0016_revoke_rebind.sql | DUPLICATE |
| 20260627112209 | the_field_autoupdate | 20260627112209_the_field_autoupdate.sql | 0019_the_field_autoupdate.sql | DUPLICATE |
| 20260627115029 | delete_account | 20260627115029_delete_account.sql | 0020_delete_account.sql | DUPLICATE |
| 20260716160000 | 0021_profile_visibility | 20260716160000_0021_profile_visibility.sql | 0021_site_counters.sql | **DISTINCT** — adds `profile_visibility` column. NOT the same as 0021_site_counters. Both are real, both applied. |
| 20260727120000 | 0025_fix_field_bigint_overflow | 20260727120000_0025_fix_field_bigint_overflow.sql | 0025_atomic_throttle.sql | **DISTINCT** — fixes bigint overflow in `recompute_the_field()`. NOT the same as 0025_atomic_throttle. Both are real, both applied. |

## Files with NO ledger entry

**None.** Every local migration file has a corresponding ledger entry. The
README's "local-only (applied to DB via Dashboard, no ledger entry)" list
(0006, 0009, 0010, 0011, 0012, 0018, 0021, 0022, 0023) is incorrect — all
of those have ledger rows.

## Files that are NOT migrations (seed data)

| File | Status |
|------|--------|
| tokscale_seed_full.sql | Seed data (494 KB). Skipped by `supabase migration list` (name doesn't match `<timestamp>_name.sql`). Should be moved out of `migrations/`. |
| tokscale_seed_preview.sql | Seed data (221 KB). Same — skipped, should be moved. |

## Applied schema (confirmed via introspection)

### Tables (27)
audit_log, audit_records, badges, challenge_submissions, challenges,
device_enroll_codes, devices, feature_rollups_daily, leaderboards_cached,
metric_snapshots, operator_accounts, operator_actions, operator_badges,
operator_reparse, operator_reports, operator_rewards, operators, rank_history,
rulesets, session_summaries, signal_prompts, site_counters,
snapshot_submissions, source_attestations, subscriptions, system_stats,
webhook_events

### Functions (10, one duplicated)
clear_operator_data, compute_board_ranks, create_reparse_with_action,
delete_account, enroll_device, increment_site_counter,
materialize_verified_snapshot (×2 overloads), recompute_the_field,
update_operator_reports_updated_at

### Key columns verified on `operators`
handle, avatar_url, bio, links, location, profile_visibility — all present
(confirms 0007 + 20260716160000 both applied)

## Drift summary

1. **Numbered vs. timestamp naming mismatch:** 30 numbered files + 12
   timestamp files = 42 local files, all with ledger entries. The CLI's
   `migration list` shows them as matched because the ledger contains BOTH
   the numbered version AND the timestamp version for the duplicated ones.

2. **Duplicate ledger entries:** 10 migrations exist in the ledger under
   BOTH a numbered version and a timestamp version. This is harmless for
   the DB (the SQL is idempotent / `IF NOT EXISTS`), but it means
   `supabase db push` would see the numbered files as "already applied"
   only if the CLI matches by version string. **The CLI does match them
   as applied** (per `migration list` output showing local==remote for all).

3. **Two real number collisions:** `0021` is used by both `site_counters`
   (numbered) and `profile_visibility` (timestamp). `0025` is used by both
   `atomic_throttle` (numbered) and `fix_field_bigint_overflow` (timestamp).
   These are 4 distinct migrations sharing 2 numbers. The ledger tracks
   them correctly by their distinct versions (0021 + 20260716160000,
   0025 + 20260727120000).

4. **Seed files in migrations/:** `tokscale_seed_full.sql` and
   `tokscale_seed_preview.sql` are seed data, not migrations. The CLI
   already skips them (wrong filename pattern). They should be relocated.

## Reconcile plan (see README.md after reconcile for the go-forward workflow)

The goal: make `supabase db push` safe for FUTURE migrations without
re-running any existing SQL against prod.

**Mechanism:**
1. **Rename all numbered files to their true timestamp format** where a
   timestamp dupe exists. For numbered files with NO timestamp dupe
   (0001–0006, 0009–0012, 0018, 0022–0024, 0026–0030), assign a synthetic
   timestamp OR keep numbered and stamp via `migration repair`.
2. **Delete the timestamp-prefixed duplicate files** after confirming the
   numbered version is the canonical one (or vice versa — keep the
   timestamp file as canonical since that's what the ledger recorded
   first).
3. **For the 2 distinct collisions (0021/20260716160000,
   0025/20260727120000):** keep both, rename the numbered one to a
   non-colliding name.
4. **Move seed files** to `supabase/seeds/`.
5. **`migration repair --status applied`** for any file that exists locally
   but the CLI doesn't see as applied (if any remain after rename).
6. **NEVER `db push` or `migration up`** during reconcile. Only file
   renames + ledger stamping.

**Decision point (for Drep1/owner):** The cleanest path is to adopt the
Supabase-native `<timestamp>_name.sql` format for ALL migrations going
forward, since that's what the ledger tracks. The numbered files become
the canonical names only for 0001–0005 (which were CLI-applied with
matching names). Everything else gets a real or synthetic timestamp.
