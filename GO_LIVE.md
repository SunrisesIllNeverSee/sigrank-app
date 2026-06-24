# SigRank — Go-Live Runbook (Supabase + Stripe)

> **⚠️ LARGELY SUPERSEDED (2026-06-20).** SigRank is LIVE on signalaf.com — Supabase
> is wired, the read facade hits the DB, the board/profile/metrics serve real data,
> and the cold-store snapshot is the fallback. The "MOCK mode → LIVE" framing below
> and every `TODO(DATA.LIVE)` reference are **archived/historical** — the DB is live.
> Still useful here: the Stripe go-live steps + the schema audit findings. Read the
> DATA.LIVE sections as a record of the first-phase cutover, not current state.
>
> Audience (historical): the operator wiring SigRank from MOCK mode to LIVE data.
> Scope: this is a **verification + runbook** document. No app code was changed
> to produce it. Follow the steps in order; the **AUDIT FINDINGS** at the bottom
> list the schema/code mismatches you must patch **before** the live write paths
> (Stripe webhook, snapshot ingest) will succeed.
>
> Telemetry framing: this version scores **token telemetry** (compression,
> session depth, prompt complexity, cross-thread, token throughput), not word
> content. **[ARCHIVED 2026-06-20] Snapshot signing (SIG.VERIFY) is retired** —
> the signed-agent / ed25519 path was superseded by the MCP-as-verifier + account
> + review model (paste = run-numbers, board = account+review). The historical note:
> the ingest route only required the `X-Agent-Signature` header to be present and
> full verification was deferred. No longer relevant.

---

## What works today (MOCK fallback — no env required)

The site is **fully operational with an empty `.env`**. Every page renders and
every read endpoint returns deterministic seed data, because the data layer
auto-detects missing credentials and falls back to mock fixtures.

- `lib/supabase/client.ts:18` / `lib/supabase/server.ts:22` export
  `SUPABASE_CONFIGURED` and return `null` from `getSupabase*()` when env is unset.
- `lib/data/index.ts` is the single read facade. **Every** function
  (`getLeaderboard`, `getOperator`, `getOperatorHistory`, `getMetricLeaders`,
  `getHallOfSignal`, `getHomepageStats`, `getClassDistribution`, `getCircles`,
  `getCircle`) uses the contract: `if (!sb) return <mock>; try { ...; return mock } catch { return mock }`.
- `lib/stripe/server.ts:19` exports `STRIPE_CONFIGURED`; checkout/portal/claim
  routes return `503 { error: 'stripe_not_configured' }` instead of selling
  silently. The webhook route also `503`s without `STRIPE_WEBHOOK_SECRET`.
- The one real operator (MO§ES / `TransVaultOrigin` / `TheSignalVault`) is the
  `#1` TRANSMITTER in both the mock (`lib/data/mock.ts:97`) and the seed
  (`supabase/seed.sql`).

> IMPORTANT — read this before you expect live data on the leaderboard:
> The read facade (`lib/data/index.ts`) currently **never actually queries
> Supabase**. Every live branch is a `TODO(DATA.LIVE)` stub that falls through to
> the mock. Wiring creds makes the **write** paths live (Stripe webhook → tier
> updates, claim → `operators.claimed`, snapshot ingest), and unlocks
> `getSupabaseServer()` for those routes — but the public leaderboard/profile
> pages will keep rendering mock data until the `TODO(DATA.LIVE)` mappers are
> implemented. This is the single most important thing to understand about
> "going live" in this build. See **AUDIT FINDINGS → F1**.

---

## Go live: Supabase

State of this machine (checked): `supabase` CLI **v2.98.2 installed**; **no
Docker**; **no local `psql`**; no `supabase/config.toml` (project not yet
`init`ed); not linked to a remote project. Therefore:

- Path A (LOCAL via Docker) requires installing Docker first, then `supabase init`.
- Path B (REMOTE supabase.com) is the **recommended** path here because it needs
  no Docker and you can run the SQL in the browser SQL editor (no local `psql`).

The three SQL files to apply, in order:

1. `supabase/schema.sql` — full DDL (20 tables). Equivalent to
   `migrations/0001_init.sql` + `migrations/0002_billing.sql`. Apply the single
   file **or** the two migrations — **not both**.
2. `supabase/seed.sql` — Ruleset v1.0, 16 badges, MO§ES operator + snapshot +
   rank + cached board, `system_stats` singleton.
3. `supabase/policies.sql` — enables RLS on all tables, grants public read on the
   public tables, leaves write to the service role.

> Apply the **AUDIT FINDINGS patches (F2–F5)** to your SQL **before** running it
> if you want the Stripe webhook and snapshot ingest write paths to work on day
> one. They are additive (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT
> EXISTS`) and safe to paste after `schema.sql`.

### Path A — LOCAL via Docker

```bash
# 1. Install Docker Desktop (required; supabase start runs Postgres in Docker).
brew install --cask docker
open -a Docker            # launch it once; wait until the whale icon is steady

# 2. Initialize the Supabase project scaffold (creates supabase/config.toml).
cd /Users/dericmchenry/RNS/sigrank-app
supabase init            # answer "N" to generating VS Code settings if prompted

# 3. Boot the local stack (Postgres + Studio + Kong). First run pulls images.
supabase start
#   -> prints: API URL, DB URL, Studio URL, anon key, service_role key. COPY THEM.

# 4. Apply schema -> seed -> policies against the local DB.
#    supabase start prints DB URL like:
#    postgresql://postgres:postgres@127.0.0.1:54322/postgres
export DBURL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

#    (a) If you have psql: run the three files directly.
#        (this machine has no psql — `brew install libpq` then add to PATH,
#         or use the bundled one below)
psql "$DBURL" -f supabase/schema.sql
psql "$DBURL" -f supabase/seed.sql
# --- AUDIT PATCH: apply F2-F5 here (see AUDIT FINDINGS) before policies ---
psql "$DBURL" -f supabase/policies.sql

#    (b) No psql? Use the Supabase Studio SQL editor at the printed Studio URL
#        (http://127.0.0.1:54323 by default) and paste each file's contents,
#        in order: schema.sql, seed.sql, [F2-F5 patch], policies.sql.

# 5. Wire .env.local with the LOCAL keys supabase start printed:
cat >> .env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from `supabase start`>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from `supabase start`>
EOF

# 6. Restart Next.js so it picks up .env.local.
npm run dev
```

### Path B — REMOTE via a supabase.com project (recommended here: no Docker/psql)

```bash
# 1. Create a project at https://supabase.com/dashboard (note the project ref,
#    the project URL, and the DB password you set).

# 2. Apply the SQL with ZERO local tooling: open the project's SQL Editor in the
#    dashboard and paste, running each in order:
#      (a) supabase/schema.sql
#      (b) supabase/seed.sql
#      (c) the AUDIT PATCH F2-F5 (see AUDIT FINDINGS)
#      (d) supabase/policies.sql
#    All files are idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING / DROP
#    POLICY IF EXISTS), so re-running is safe.

# 2-alt. Or push via CLI (needs `supabase init` + link; uses the migrations dir):
cd /Users/dericmchenry/RNS/sigrank-app
supabase init
supabase login
supabase link --project-ref <your-project-ref>
supabase db push          # runs migrations/0001_init.sql then 0002_billing.sql
#   then still apply seed.sql + F2-F5 patch + policies.sql via the SQL editor,
#   since they are NOT in the migrations directory.

# 3. Grab keys: Dashboard -> Project Settings -> API.
#    Project URL, anon public key, service_role secret key.

# 4. Wire .env.local with the REMOTE keys:
cat >> .env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role secret key>
EOF

# 5. Restart Next.js.
npm run dev
```

Extensions: `schema.sql` runs `CREATE EXTENSION IF NOT EXISTS pgcrypto` and
`pg_trgm` up front. Both are available on Supabase (no-op if already enabled).

---

## Go live: Stripe (test mode)

The app reads five `STRIPE_PRICE_*` ids plus the secret/publishable/webhook keys.
Create test-mode products/prices, copy the price ids into env, then run a local
webhook listener. The `claim` price is **OPERATOR_OVERRIDE_REQUIRED** — pick the
amount yourself ($1–5 lifetime per `app/api/v1/claim/route.ts:43`).

```bash
# 1. Auth the CLI to your Stripe account (test mode by default).
stripe login

# 2. Create one product per offering, then a price per billing cadence.
#    Patron — monthly recurring.
stripe products create --name "SigRank Patron"
stripe prices create --product <prod_patron> \
  --unit-amount 500  --currency usd --recurring interval=month
#    -> price id => STRIPE_PRICE_PATRON_MONTHLY

#    Pro — monthly AND yearly (two prices, same product).
stripe products create --name "SigRank Pro"
stripe prices create --product <prod_pro> \
  --unit-amount 1200 --currency usd --recurring interval=month
#    -> STRIPE_PRICE_PRO_MONTHLY
stripe prices create --product <prod_pro> \
  --unit-amount 12000 --currency usd --recurring interval=year
#    -> STRIPE_PRICE_PRO_YEARLY

#    Circle Sponsor — monthly recurring.
stripe products create --name "SigRank Circle Sponsor"
stripe prices create --product <prod_circle> \
  --unit-amount 2500 --currency usd --recurring interval=month
#    -> STRIPE_PRICE_CIRCLE_SPONSOR

#    Claim — ONE-TIME lifetime payment (NOT recurring). OPERATOR_OVERRIDE_REQUIRED.
stripe products create --name "SigRank Operator Claim (lifetime)"
stripe prices create --product <prod_claim> \
  --unit-amount 300  --currency usd
#    (no --recurring flag => one-time price) -> STRIPE_PRICE_CLAIM_LIFETIME

# 3. Put the ids + keys in .env.local:
cat >> .env.local <<'EOF'
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_PATRON_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_CIRCLE_SPONSOR=price_...
STRIPE_PRICE_CLAIM_LIFETIME=price_...
EOF

# 4. Start the local webhook forwarder. It prints a `whsec_...` signing secret.
stripe listen --forward-to localhost:3000/api/v1/billing/stripe-webhook
#    -> "Ready! Your webhook signing secret is whsec_xxx"

# 5. Add that secret to .env.local and restart Next.js:
echo "STRIPE_WEBHOOK_SECRET=whsec_xxx" >> .env.local
npm run dev

# 6. (optional) Fire a test event to exercise the handler:
stripe trigger checkout.session.completed
```

Price→tier mapping is built at module load in `lib/stripe/server.ts:42-53`
(`PRICE_TO_TIER`): patron→patron, pro-monthly & pro-yearly→pro,
circle→circle_sponsor. The claim price is **not** in that map by design — claim
is a one-time payment routed by `session.mode === 'payment'` +
`metadata.purpose === 'claim'` in `lib/stripe/handlers.ts:154`.

> Production webhooks: instead of `stripe listen`, register a webhook endpoint in
> the Stripe Dashboard pointing at `https://<your-domain>/api/v1/billing/stripe-webhook`,
> and copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`.

---

## Env checklist

| Var | Required for | Source | Breaks if unset |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase (client+server) | `supabase start` output / Dashboard → API | All Supabase write paths stay mock; `SUPABASE_CONFIGURED=false` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client; server fallback key | same | Browser client null; server falls back to anon only if no service key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server writes that bypass RLS (webhook, claim, snapshot, rewards) | Dashboard → API (secret) | Webhook/claim/snapshot writes can't bypass RLS; tier/claim updates silently no-op |
| `STRIPE_SECRET_KEY` | All Stripe server calls | Stripe Dashboard (test: `sk_test_`) | checkout/portal/claim/webhook all `503`; `STRIPE_CONFIGURED=false` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client Stripe (if used by UI) | Stripe Dashboard (`pk_test_`) | Client-side Stripe init fails |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verify | `stripe listen` / Dashboard endpoint | Webhook route `503 webhook_secret_not_configured`; no tier/claim sync |
| `STRIPE_PRICE_PATRON_MONTHLY` | Patron checkout + tier map | `stripe prices create` | Patron checkout `503 price_not_configured`; sub never maps to `patron` |
| `STRIPE_PRICE_PRO_MONTHLY` | Pro monthly checkout + tier map | `stripe prices create` | Pro-monthly checkout `503`; sub never maps to `pro` |
| `STRIPE_PRICE_PRO_YEARLY` | Pro yearly checkout + tier map | `stripe prices create` | Pro-yearly checkout `503`; yearly sub never maps to `pro` |
| `STRIPE_PRICE_CIRCLE_SPONSOR` | Circle checkout + tier map | `stripe prices create` | Circle checkout `503`; sub never maps to `circle_sponsor` |
| `STRIPE_PRICE_CLAIM_LIFETIME` | Operator claim (one-time) | `stripe prices create` (no `--recurring`) — **OPERATOR_OVERRIDE_REQUIRED** | `/api/v1/claim` `503 price_not_configured`; nobody can claim |
| `NEXT_PUBLIC_SITE_URL` | Stripe success/cancel/return URLs | your deploy URL (defaults to `http://localhost:3000`) | Redirects point at localhost in prod |
| `STRIPE_GRACE_PERIOD_DAYS` | (present in `.env.example`, **not read** at runtime) | n/a | No effect — grace is hardcoded `GRACE_PERIOD_DAYS = 7` in `lib/stripe/tier.ts:13`. See F6. |
| `RULESET_VERSION` | (present in `.env.example`, **not read** at runtime) | n/a | No effect — value is the constant `RULESET_VERSION = '1.0'` in `lib/scoring/ruleset.ts:121`. See F6. |
| `SIG_ARMY_DIR` | (present in `.env.example`, **not read** in app TS) | n/a | No effect in the Next.js app; informational only. See F6. |

All **12** vars actually read via `process.env.*` in the app code appear in
`.env.example` (PASS — see F0). The last three rows are documented-but-unused.

---

## Verification (after wiring)

1. **Supabase reachable / schema applied.** In the Supabase SQL editor:
   `select count(*) from badges;` → expect `16`. `select codename, claimed from
   operators;` → expect `TransVaultOrigin, true`. `select total_operators from
   system_stats;` → expect `1`.
2. **Server picks up creds.** Restart `npm run dev`; the server log should no
   longer print the `(no supabase)` / `(dev)` notes from the webhook/reward
   handlers when an event fires.
3. **Stripe checkout works.** `POST /api/v1/billing/create-checkout-session`
   with `{"tier":"pro","interval":"monthly","operator_id":"<uuid>"}` →
   expect `200 { "url": "https://checkout.stripe.com/..." }` (was `503` before
   creds). Complete the test checkout with card `4242 4242 4242 4242`.
4. **Webhook → tier update (this is the real "live data" proof).** With
   `stripe listen` running, complete a Pro checkout, then in SQL:
   `select tier,status from subscriptions where operator_id='<uuid>';` →
   expect a row with `tier='pro'`. And
   `select current_supporter_tier from operators where operator_id='<uuid>';` →
   expect `pro`. **This only succeeds after AUDIT PATCH F2 + F3 are applied**
   (the upsert writes `stripe_customer_id` + `price_id`, and rewards write to
   `operator_rewards`).
5. **Claim flow.** `POST /api/v1/claim` `{"operator_id":"<uuid>"}` → `200 {url}`;
   complete the one-time payment; webhook sets
   `operators.claimed=true, claimed_at, claim_payment_id`.
6. **Snapshot ingest.** `POST /api/v1/snapshots` with a valid signed payload and
   header `X-Agent-Signature: test` → `202 { status:'received', ... }`. To make
   the **DB insert** succeed (not just the mock-ack) you must apply AUDIT PATCH
   **F4** (the insert references columns the table doesn't have).
7. **What changes vs mock on the public site:** with the current build,
   **nothing visible** on the leaderboard/profile pages — those still render mock
   data because `lib/data/index.ts` live branches are `TODO(DATA.LIVE)` stubs
   (F1). "Live" today = write paths (billing, claim, ingest) hitting real tables,
   verifiable only via SQL, not via the public UI. Implementing the F1 mappers is
   what makes the public pages reflect the database.

---

## AUDIT FINDINGS

Verdict: **the schema/seed/policies/env are internally consistent for the READ
facade, but the Stripe webhook and snapshot WRITE paths reference tables/columns
that do not exist in `schema.sql`.** Four code↔schema mismatches (F2–F5) will
make live writes silently fail (they are wrapped in `try/catch` that swallows the
error and still acks). Patch them before cutover. The read paths can't break a
cutover because they never query the DB yet (F1).

### PASS

- **F0 — Env coverage: PASS.** All 12 vars read via `process.env.*` in
  `.ts/.tsx` are present in `.env.example`:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_PATRON_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY`,
  `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_CIRCLE_SPONSOR`,
  `STRIPE_PRICE_CLAIM_LIFETIME`, `NEXT_PUBLIC_SITE_URL`. Evidence:
  `.env.example` + grep of `process.env`.
- **Stripe price coverage: PASS.** Every price the billing code expects exists in
  `.env.example` and is mapped: checkout resolves them in
  `create-checkout-session/route.ts:34-45` and `claim/route.ts:44`; tier map in
  `lib/stripe/server.ts:44-51`. The claim price is correctly flagged
  OPERATOR_OVERRIDE_REQUIRED in both env and code.
- **seed.sql ↔ schema.sql: PASS.** Every column inserted by `seed.sql` exists in
  `schema.sql` with compatible types: `rulesets` (line 28), `ruleset_versions`
  (87), `badges` (102), `operators` (127 — all 14 columns present incl. claim_*),
  `metric_snapshots` (153 — 22 columns matched), `rank_history` (175),
  `leaderboards_cached` (192), `system_stats` (217). All FKs satisfied
  (`metric_snapshots`/`rank_history`/`leaderboards_cached`/`system_stats` resolve
  `operator_id` via the seeded `operators` row).
- **policies.sql ↔ schema.sql: PASS.** All 20 `ALTER TABLE ... ENABLE ROW LEVEL
  SECURITY` targets and all 13 public-SELECT policy tables are real tables in
  `schema.sql`. The anon read paths the app needs (operators, metric_snapshots,
  rank_history, leaderboards_cached, badges, operator_badges, rulesets,
  ruleset_versions, system_stats, audit_records, circles, circle_members,
  circle_metric_snapshots) are all granted `FOR SELECT TO anon, authenticated
  USING (true)` — the public read facade is **not** locked out. Non-public
  tables (devices, snapshot_submissions, session_summaries, feature_rollups_daily,
  subscriptions, webhook_events, audit_log) are correctly default-deny.
- **Read-facade columns: PASS (vacuously).** `lib/data/index.ts` issues **no live
  Supabase queries** — all live branches are `TODO(DATA.LIVE)` stubs returning
  mock. So no read references a missing column. (This is also F1: the public site
  stays on mock until those mappers are written.)
- **schema.sql ≡ migrations: PASS.** `0001_init.sql` + `0002_billing.sql` reproduce
  every table/column/index in `schema.sql` byte-for-shape. `operators` carries the
  full claim_* + Stripe columns in `0001`; `0002` does not ALTER it. Consistent.

### FAIL — code references DB objects not in `schema.sql` (patch before cutover)

- **F1 — Read facade is not wired to the DB (WARN, not a cutover-breaker).**
  `lib/data/index.ts:109-223` — every "live path" is a `TODO(DATA.LIVE)` comment
  followed by `return <mock>`. Consequence: applying schema+seed does **not** make
  the leaderboard/profile/hall/circles pages show database rows; they keep showing
  mock. Not a crash risk (it can't fail), but it means "go live" does not light up
  the public UI without implementing these mappers. Fix: implement the 9 facade
  mappers to read `leaderboards_cached` / `operators` + `metric_snapshots` /
  `rank_history` etc.

- **F2 — `subscriptions` table is missing two columns the webhook writes. FAIL.**
  `lib/stripe/handlers.ts:99-110` upserts `stripe_customer_id` and `price_id` into
  `subscriptions`, and `app/api/v1/billing/portal/route.ts:30-31` SELECTs
  `subscriptions.stripe_customer_id`. Neither column exists in `schema.sql`
  `subscriptions` (lines 332-342) nor in `0002_billing.sql` (lines 19-29).
  Consequence: the upsert throws → caught at `handlers.ts:133` → tier sync
  silently fails; the billing portal can never resolve a customer id → always
  `404 no_customer`. **Patch:**
  ```sql
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
  ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price_id TEXT;
  CREATE INDEX IF NOT EXISTS idx_subscriptions_customer
    ON subscriptions(stripe_customer_id);
  ```

- **F3 — `operator_rewards` table does not exist. FAIL.**
  `lib/stripe/rewards.ts:129` (`upsert ... onConflict 'operator_id,reward_id'`)
  and `:140` (`delete ... in('reward_id', ...)`) write to `operator_rewards`, but
  there is **no** `operator_rewards` table anywhere in `schema.sql` or the
  migrations. Consequence: every reward grant/revoke throws → caught at
  `rewards.ts:145` → supporter rewards are never persisted (the
  `operators.current_supporter_tier` update on `rewards.ts:124` still works, since
  `operators` exists). **Patch:**
  ```sql
  CREATE TABLE IF NOT EXISTS operator_rewards (
    operator_id UUID NOT NULL REFERENCES operators(operator_id),
    reward_id   TEXT NOT NULL,            -- canonical RW.xx id
    source      TEXT NOT NULL DEFAULT 'supporter',
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (operator_id, reward_id)  -- matches onConflict 'operator_id,reward_id'
  );
  ALTER TABLE operator_rewards ENABLE ROW LEVEL SECURITY;  -- service-role-only writes
  ```

- **F4 — `snapshot_submissions` insert column mismatch. FAIL.**
  `app/api/v1/snapshots/route.ts:94-105` inserts keys `codename`, `device_id`,
  `tier`, `payload_json`, `submission_id`, `window_type`, `window_start`,
  `window_end`, `ruleset_version`, `snapshot_hash`. But the `schema.sql`
  `snapshot_submissions` table (lines 92-112) has **no `codename` column and no
  `tier` column** (operator is referenced by `operator_id UUID NOT NULL`, and
  there is no submission-tier column), and `operator_id`, `schema_version`,
  `signature` are `NOT NULL` yet are **not provided** by the insert. Consequence:
  the insert violates NOT NULL / unknown-column → throws → caught at
  `route.ts:106` → ingest silently mock-acks, never persists. The route also
  passes a string `submission_id` (`sub_xxxxxxxx`) into a `UUID PRIMARY KEY`,
  which will also fail the cast. **Patch options:** either (preferred) implement
  the documented `TODO(DATA.LIVE)` at `route.ts:92` to upsert the operator by
  codename → real `operator_id`, generate a UUID `submission_id`, and supply
  `schema_version` + `signature`; **or**, to match the route as written, add the
  loose-ingest columns and relax the NOT NULLs:
  ```sql
  ALTER TABLE snapshot_submissions ADD COLUMN IF NOT EXISTS codename TEXT;
  ALTER TABLE snapshot_submissions ADD COLUMN IF NOT EXISTS tier TEXT;
  ALTER TABLE snapshot_submissions ALTER COLUMN operator_id    DROP NOT NULL;
  ALTER TABLE snapshot_submissions ALTER COLUMN schema_version DROP NOT NULL;
  ALTER TABLE snapshot_submissions ALTER COLUMN signature      DROP NOT NULL;
  ALTER TABLE snapshot_submissions ALTER COLUMN submission_id  TYPE TEXT;  -- if keeping string ids
  ```
  (The clean fix is the code TODO; the SQL above is the documentation of exactly
  what the current insert needs.)

- **F5 — `audit_log` insert column mismatch. FAIL.**
  `app/api/v1/billing/stripe-webhook/route.ts:18-22` inserts `action`, `detail`,
  `created_at` into `audit_log`. The `schema.sql` `audit_log` table (lines
  364-379) has **no `action`, `detail`, or `created_at` columns** — it has
  `event_type`, `event_source` (NOT NULL), `payload`, `occurred_at`. Consequence:
  the audit insert throws → caught at `route.ts:23` → bad-signature / handler-error
  audit rows are never written (functional webhook flow still acks). **Patch
  options:** either map the code to the real columns (`event_type=action`,
  `event_source='stripe'`, `payload=detail`, `occurred_at=created_at`), or add
  compatibility columns:
  ```sql
  ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS action     TEXT;
  ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS detail     JSONB;
  ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE audit_log ALTER COLUMN event_type  DROP NOT NULL;
  ALTER TABLE audit_log ALTER COLUMN event_source DROP NOT NULL;
  ```
  Also note `webhook_events` insert (`route.ts:83`) writes `type` + `received_at`,
  but the table column is `event_type` (line 351). The `received_at` matches;
  `type` does not exist → the dedup upsert will also fail. Add:
  ```sql
  ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS type TEXT;  -- or rename code field to event_type
  ```
  (This is part of F5: webhook idempotency dedup currently can't persist either.)

- **F6 — Unused env vars (INFO).** `STRIPE_GRACE_PERIOD_DAYS`, `RULESET_VERSION`,
  and `SIG_ARMY_DIR` appear in `.env.example` but are **never** read via
  `process.env` in the app TS. Grace is the hardcoded constant
  `GRACE_PERIOD_DAYS = 7` (`lib/stripe/tier.ts:13`); ruleset version is the
  constant `RULESET_VERSION = '1.0'` (`lib/scoring/ruleset.ts:121`). Harmless, but
  setting them has no effect — don't rely on them to change behavior.

### Consolidated AUDIT PATCH (paste after `seed.sql`, before `policies.sql`)

> **Shipped as `supabase/migrations/0003_audit_patch.sql`** — apply it alongside
> the other migrations. ⚠️ Authored from the static audit and **not yet run**
> against a live DB (no local Postgres/Docker). Review before applying; the
> schema-side-vs-code-side decision is still the operator's (see the note below).

```sql
-- F2: subscriptions columns the webhook + portal need
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price_id TEXT;
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer
  ON subscriptions(stripe_customer_id);

-- F3: operator_rewards table the reward grant/revoke needs
CREATE TABLE IF NOT EXISTS operator_rewards (
  operator_id UUID NOT NULL REFERENCES operators(operator_id),
  reward_id   TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'supporter',
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (operator_id, reward_id)
);

-- F4: snapshot ingest columns / nullability the route insert needs
ALTER TABLE snapshot_submissions ADD COLUMN IF NOT EXISTS codename TEXT;
ALTER TABLE snapshot_submissions ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE snapshot_submissions ALTER COLUMN operator_id    DROP NOT NULL;
ALTER TABLE snapshot_submissions ALTER COLUMN schema_version DROP NOT NULL;
ALTER TABLE snapshot_submissions ALTER COLUMN signature      DROP NOT NULL;
-- If you keep the route's string submission ids (sub_xxxx), also:
-- ALTER TABLE snapshot_submissions ALTER COLUMN submission_id TYPE TEXT;

-- F5: audit_log + webhook_events columns the webhook route inserts
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS action     TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS detail     JSONB;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE audit_log ALTER COLUMN event_type   DROP NOT NULL;
ALTER TABLE audit_log ALTER COLUMN event_source DROP NOT NULL;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS type TEXT;

-- Don't forget RLS for the new table (service-role-only writes; no public policy):
ALTER TABLE operator_rewards ENABLE ROW LEVEL SECURITY;
```

> Note: the patches above make the live write paths **succeed against the schema
> as the code is written today**. The cleaner long-term fix is to align the code
> to the canonical schema (use `operator_id`/`event_type`/`payload` columns,
> upsert operators by codename, generate UUID submission ids). Either direction
> closes the mismatch; pick one and keep code and schema in sync.
