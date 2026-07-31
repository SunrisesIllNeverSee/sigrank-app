# SigRank — Supabase schema

PostgreSQL schema, seed data, and Row Level Security (RLS) policies for the
SigRank leaderboard. This directory is **optional**: the app builds and every
page renders on deterministic mock data when no Supabase credentials are present
(`lib/data` falls back automatically). Apply this only when wiring **live** data.

## Files

| File                          | Purpose                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema.sql`                  | Canonical, full DDL — all tables, indexes, and constraints. Authoritative snapshot of the initial schema.                                    |
| `migrations/`                 | 32 migration files (0001–0030 numbered + 2 timestamp-prefixed). Ledger-reconciled 2026-07-31 — see "Migration ledger" below.                 |
| `seeds/`                      | Seed data files (`tokscale_seed_full.sql`, `tokscale_seed_preview.sql`). NOT migrations — relocated out of `migrations/` during reconcile.   |
| `seed.sql`                    | Ruleset v1.0, 16 badges (BG.01–BG.16), MO§ES operator + snapshot + rank + cached board, `system_stats` singleton. Mirrors `lib/data/mock.ts`. |
| `policies.sql`                | Enables RLS on every table; public read-only on public tables; writes are service-role only (Phase-2 owner writes deferred).                  |

> `schema.sql` ≡ `0001_init.sql` + `0002_billing.sql`. Apply **either** the
> single `schema.sql` **or** the two migrations in order — not both.

## Apply

### Option A — `supabase db push` (now safe — ledger reconciled 2026-07-31)

```bash
# The migration ledger was reconciled on 2026-07-31. Local files now match the
# remote ledger 1:1 (32 entries each, zero pending). `supabase db push` is safe
# for FUTURE migrations. Always run --dry-run first to verify parity:
supabase db push --dry-run --linked
# → "Remote database is up to date." means nothing will be re-run.
```

See "Go-forward workflow" below for the full safe-push procedure.

### Option B — plain psql (single-file schema, fresh project only)

```bash
# Only for spinning up a NEW project from scratch. Never on the live project.
export DATABASE_URL="postgresql://postgres:<pw>@<host>:5432/postgres"

psql "$DATABASE_URL" -f supabase/schema.sql
psql "$DATABASE_URL" -f supabase/seed.sql
psql "$DATABASE_URL" -f supabase/policies.sql
```

All scripts are idempotent (`CREATE ... IF NOT EXISTS`, `INSERT ... ON CONFLICT
DO NOTHING`, `DROP POLICY IF EXISTS` before `CREATE POLICY`), so re-running them
is safe on a fresh project.

## Migration ledger (reconciled 2026-07-31)

The live Supabase project's migration ledger
(`supabase_migrations.schema_migrations`) is **reconciled and in parity** with
the local `migrations/` directory: 32 local files, 32 remote ledger entries,
zero pending. `supabase db push --dry-run` confirms "Remote database is up to
date."

### History (what was fixed and why)

**Pre-reconcile state (stale, documented in the prior version of this README):**
The ledger had 42 entries — 30 numbered (`0001`–`0030`) plus 12
timestamp-prefixed. Ten of the timestamp entries were **duplicates** of numbered
migrations (the same SQL applied twice: once via Dashboard which stamped a
timestamp, once tracked under the numbered version). Two timestamp entries
(`20260716160000` profile_visibility, `20260727120000` fix_field_bigint_overflow)
were **distinct** migrations that shared a 00NN number with a different numbered
file but had unique ledger versions. The prior README (last updated 2026-06-25)
incorrectly claimed several migrations had no ledger entry and stopped its
mapping table at 0023.

**Reconcile actions taken (2026-07-31, Drep2):**
1. Queried the live ledger directly (`supabase db query --linked`) — 42 entries
   found, all 30 numbered + 12 timestamp. Ground truth recorded in
   `MIGRATION_LEDGER_GROUND_TRUTH.md`.
2. Introspected the applied schema (27+ tables, 10 functions, key columns) —
   confirmed all migrations are applied.
3. Deleted 10 timestamp-prefixed **duplicate** files from `migrations/` (their
   SQL effects are captured by the canonical numbered versions which remain).
4. `supabase migration repair --status reverted` on the 10 duplicate timestamp
   ledger entries — removed them from the remote ledger. This is ledger-only
   stamping; no DB schema was touched, no SQL was re-run.
5. Kept the 2 **distinct** timestamp files as-is
   (`20260716160000_0021_profile_visibility.sql`,
   `20260727120000_0025_fix_field_bigint_overflow.sql`) — they have unique
   ledger versions and are correctly matched.
6. Moved `tokscale_seed_full.sql` + `tokscale_seed_preview.sql` from
   `migrations/` to `seeds/` (they are seed data, not migrations; the CLI was
   already skipping them due to filename pattern mismatch).
7. Verified: `db push --dry-run` → "Remote database is up to date." Ledger
   count = 32, local file count = 32, all matched.

### Current ledger (32 entries)

| Version | Name | File |
|---------|------|------|
| 0001 | init | `0001_init.sql` |
| 0002 | billing | `0002_billing.sql` |
| 0003 | audit_patch | `0003_audit_patch.sql` |
| 0004 | challenges | `0004_challenges.sql` |
| 0005 | token_pillars | `0005_token_pillars.sql` |
| 0006 | pg_trgm_schema | `0006_pg_trgm_schema.sql` |
| 0007 | identity_columns | `0007_identity_columns.sql` |
| 0008 | public_view | `0008_public_view.sql` |
| 0009 | auth_accounts | `0009_auth_accounts.sql` |
| 0010 | storage_avatars | `0010_storage_avatars.sql` |
| 0011 | auth_operator_id_private | `0011_auth_operator_id_private.sql` |
| 0012 | identity_locks | `0012_identity_locks.sql` |
| 0013 | device_enroll | `0013_device_enroll.sql` |
| 0014 | enroll_rpc | `0014_enroll_rpc.sql` |
| 0015 | platform_slots | `0015_platform_slots.sql` |
| 0016 | revoke_rebind | `0016_revoke_rebind.sql` |
| 0017 | drop_circles_indexes | `0017_drop_circles_indexes.sql` |
| 0018 | seed_homes | `0018_seed_homes.sql` |
| 0019 | the_field_autoupdate | `0019_the_field_autoupdate.sql` |
| 0020 | delete_account | `0020_delete_account.sql` |
| 0021 | site_counters | `0021_site_counters.sql` |
| 0022 | lock_recompute_the_field | `0022_lock_recompute_the_field.sql` |
| 0023 | source_attestation | `0023_source_attestation.sql` |
| 0024 | the_field_median_upsilon | `0024_the_field_median_upsilon.sql` |
| 0025 | atomic_throttle | `0025_atomic_throttle.sql` |
| 0026 | operator_reports | `0026_operator_reports.sql` |
| 0027 | crm_calculate | `0027_crm_calculate.sql` |
| 0028 | reparse_rpc | `0028_reparse_rpc.sql` |
| 0029 | consent_tracking | `0029_consent_tracking.sql` |
| 0030 | clear_operator_data | `0030_clear_operator_data.sql` |
| 20260716160000 | 0021_profile_visibility | `20260716160000_0021_profile_visibility.sql` |
| 20260727120000 | 0025_fix_field_bigint_overflow | `20260727120000_0025_fix_field_bigint_overflow.sql` |

> **Note on the two timestamp entries:** `20260716160000` and `20260727120000`
> share their 00NN number (0021, 0025) with a *different* numbered migration.
> They are distinct migrations with unique ledger versions — not duplicates.
> The 00NN collision is naming-only; the ledger tracks them correctly by
> timestamp.

### Go-forward workflow

For **new** migrations, use the standard Supabase CLI flow:

```bash
# 1. Create a new migration (use timestamp format to match the 2 existing
#    timestamp entries, OR continue the numbered sequence — both work since
#    the CLI matches by version string):
supabase migration new <descriptive_name>
# → creates supabase/migrations/<timestamp>_<name>.sql

# 2. Write your SQL in the generated file.

# 3. ALWAYS dry-run first to verify parity:
supabase db push --dry-run --linked
# → must show only your new migration as pending, nothing else.

# 4. Push for real:
supabase db push --linked

# 5. Verify:
supabase migration list --linked
# → local == remote, zero pending.
```

**Guardrail:** A pre-push check script (`scripts/check-migration-parity.mjs`)
runs `supabase db push --dry-run` and hard-fails if the output is anything other
than "Remote database is up to date" OR exactly the expected new migration(s).
This prevents accidental pushes when the ledger has drifted. See
`scripts/check-migration-parity.mjs`.

## Extensions

`schema.sql` / `0001_init.sql` create two extensions up front:

- `pgcrypto` — for `gen_random_uuid()` primary keys.
- `pg_trgm` — for the trigram index on `operators.codename` (fuzzy
  search-by-handle, `idx_operators_codename_trgm`).

On Supabase both are available; `CREATE EXTENSION IF NOT EXISTS` is a no-op if
already enabled.

## Anonymity + claim model

- Operators are **anonymous by default**: identified only by a generated
  `codename`. No PII is required or stored to appear on the leaderboard.
- An operator may **claim** their entry via a **one-time lifetime** Stripe
  payment (`mode:'payment'`, price env `STRIPE_PRICE_CLAIM_LIFETIME`). On a
  successful claim the handler sets `operators.claimed = true`, `claimed_at`,
  `claim_payment_id`, and (optionally) `claim_contact`.
- Claimed operators may show `display_name` + a "✓ Claimed" pill; unclaimed
  operators show the codename only + a "Claim this operator" CTA.
- `claim_contact` is PII-adjacent: never select it into public API responses.
  See `TODO(RLS.PII)` in `policies.sql`.

## Live vs mock

When `SUPABASE_URL` / `SUPABASE_*` keys are absent, `lib/data` serves the
deterministic mock dataset (one real operator, MO§ES, plus fixtures). The seed
rows here mirror that mock exactly so behavior is identical once live data is
applied. There is **no app change** required to switch — the data facade
auto-detects credentials.

## RLS posture (MVP)

- RLS enabled on all tables.
- Public (`anon` + `authenticated`): read-only `SELECT` on the public tables
  (operators, metric_snapshots, rank_history, leaderboards_cached, badges,
  operator_badges, rulesets, ruleset_versions, system_stats, audit_records,
  circles, circle_members, circle_metric_snapshots).
- Non-public tables (devices, snapshot_submissions, session_summaries,
  feature_rollups_daily, subscriptions, webhook_events, audit_log) have **no**
  public policy → default-deny to the public API.
- All writes go through the Supabase **service role**, which bypasses RLS.
- Operator-scoped self-service writes are **deferred to Phase 2**
  (`TODO(RLS.PHASE2)` in `policies.sql`).

## RS.xx placeholders

`seed.sql` inserts Ruleset v1.0 with **PROVISIONAL** RS.xx weights/thresholds
mirrored from `lib/scoring/ruleset.ts`. Every block is tagged
`-- OPERATOR_OVERRIDE_REQUIRED RS.xx`. Replace these with the real Railway
scoring-worker configuration before production.
