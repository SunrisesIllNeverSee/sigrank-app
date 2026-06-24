# SigRank — Supabase schema

PostgreSQL schema, seed data, and Row Level Security (RLS) policies for the
SigRank leaderboard. This directory is **optional**: the app builds and every
page renders on deterministic mock data when no Supabase credentials are present
(`lib/data` falls back automatically). Apply this only when wiring **live** data.

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Canonical, full DDL — all 20 tables, indexes, and constraints. Authoritative. |
| `migrations/0001_init.sql` | First half of `schema.sql`: core telemetry → scoring → leaderboard tables (incl. `operators` with its full claim + Stripe columns). |
| `migrations/0002_billing.sql` | Second half: Stripe billing (`subscriptions`, `webhook_events`), `audit_log`, `ruleset_versions`, `system_stats`. Depends on `0001`. |
| `seed.sql` | Ruleset v1.0, 16 badges (BG.01–BG.16), MO§ES operator + snapshot + rank + cached board, `system_stats` singleton. Mirrors `lib/data/mock.ts`. |
| `policies.sql` | Enables RLS on every table; public read-only on public tables; writes are service-role only (Phase-2 owner writes deferred). |

> `schema.sql` ≡ `0001_init.sql` + `0002_billing.sql`. Apply **either** the
> single `schema.sql` **or** the two migrations in order — not both.

## Apply

### Option A — Supabase CLI (recommended)

```bash
# From the repo root, with a linked project (supabase link).
# Push the migrations directory (runs 0001 then 0002 in lexical order):
supabase db push

# Then load seed + policies:
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
psql "$SUPABASE_DB_URL" -f supabase/policies.sql
```

### Option B — plain psql (single-file schema)

```bash
# Point at your Postgres / Supabase connection string:
export DATABASE_URL="postgresql://postgres:<pw>@<host>:5432/postgres"

psql "$DATABASE_URL" -f supabase/schema.sql
psql "$DATABASE_URL" -f supabase/seed.sql
psql "$DATABASE_URL" -f supabase/policies.sql
```

All scripts are idempotent (`CREATE ... IF NOT EXISTS`, `INSERT ... ON CONFLICT
DO NOTHING`, `DROP POLICY IF EXISTS` before `CREATE POLICY`), so re-running them
is safe.

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
