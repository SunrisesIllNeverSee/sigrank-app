# SigRank — Supabase schema

PostgreSQL schema, seed data, and Row Level Security (RLS) policies for the
SigRank leaderboard. This directory is **optional**: the app builds and every
page renders on deterministic mock data when no Supabase credentials are present
(`lib/data` falls back automatically). Apply this only when wiring **live** data.

## Files

| File                          | Purpose                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema.sql`                  | Canonical, full DDL — all 20 tables, indexes, and constraints. Authoritative.                                                                 |
| `migrations/0001_init.sql`    | First half of `schema.sql`: core telemetry → scoring → leaderboard tables (incl. `operators` with its full claim + Stripe columns).           |
| `migrations/0002_billing.sql` | Second half: Stripe billing (`subscriptions`, `webhook_events`), `audit_log`, `ruleset_versions`, `system_stats`. Depends on `0001`.          |
| `seed.sql`                    | Ruleset v1.0, 16 badges (BG.01–BG.16), MO§ES operator + snapshot + rank + cached board, `system_stats` singleton. Mirrors `lib/data/mock.ts`. |
| `policies.sql`                | Enables RLS on every table; public read-only on public tables; writes are service-role only (Phase-2 owner writes deferred).                  |

> `schema.sql` ≡ `0001_init.sql` + `0002_billing.sql`. Apply **either** the
> single `schema.sql` **or** the two migrations in order — not both.

## Apply

> ⚠️ **NEVER run `supabase db push` on this project.** See "Migration ledger
> drift" below for why. Apply migrations via the Supabase Dashboard SQL editor
> or MCP `apply_migration` only.

### Option A — Supabase Dashboard / MCP (the ONLY safe path for this project)

```bash
# DO NOT run `supabase db push` — it will re-run ALL numbered migrations
# against a remote ledger that tracks by timestamp = catastrophic.
#
# Instead, paste the migration SQL into the Supabase Dashboard SQL editor
# (Dashboard → SQL → New query), or apply via Supabase MCP apply_migration.
# The local numbered files in migrations/ are RECORD-ONLY — they document
# what was applied, they are not commands to run via the CLI.
```

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

## Migration ledger drift (expected — do NOT "fix" with db push)

**The warning `Remote migration versions not found in local migrations directory`
is expected and safe to ignore.** Here's why:

The live Supabase project's migration ledger (`supabase_migrations.schema_migrations`)
tracks migrations by **timestamp** (e.g. `20260624153429`). The local files in
`migrations/` are **numbered** (`0001_init.sql` through `0023_source_attestation.sql`).
These two naming schemes are incompatible.

**What happened:** Migrations 0001–0005 were applied via the CLI early on (both
names match). From 0006 onward, migrations were applied by pasting SQL into the
Supabase Dashboard SQL editor, which stamped them with timestamps in the remote
ledger. The local numbered files were written afterward as record-only
documentation. Some migrations (0006, 0009–0012, 0018, 0021–0023) were applied
via the Dashboard's plain SQL editor, which doesn't record to the migration
ledger at all — so they exist in the DB but have no ledger entry.

**Why `db push` is catastrophic:** The CLI sees all 23 numbered local files as
"not yet applied" (because the remote ledger has timestamp-named entries, not
`0001`–`0023`) and tries to re-run every migration from scratch — double-creating
tables, erroring on constraints, potentially corrupting data.

**The decision (2026-06-25, DECISIONS.md):** Apply via Dashboard/MCP only, never
`db push`. The local files are record-only. The live DB is the source of truth.

**Mapping (remote timestamp → local numbered file):**

| Remote timestamp | Local file     | What it does                                                |
| ---------------- | -------------- | ----------------------------------------------------------- |
| `20260624153429` | 0007           | Identity columns (handle, avatar_url, bio, links, location) |
| `20260624171956` | 0008           | operators_public view (PII fix)                             |
| `20260624172019` | 0008           | Column-level GRANT/REVOKE on operators                      |
| `20260625080637` | 0017 (partial) | Revoke anon SELECT on circles tables                        |
| `20260625220535` | 0013           | Device enroll codes + materialize_verified_snapshot RPC     |
| `20260625220551` | 0014           | enroll_device RPC                                           |
| `20260626141333` | 0015           | Platform column on metric_snapshots                         |
| `20260626141832` | 0016           | Revoke/rebind fix for enroll_device                         |
| `20260627112209` | 0019           | pg_cron + recompute_the_field()                             |
| `20260627115029` | 0020           | delete_account() RPC                                        |

Local-only (applied to DB via Dashboard, no ledger entry): 0006, 0009, 0010,
0011, 0012, 0018, 0021, 0022, 0023.

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
