-- 0003_audit_patch.sql — AUDIT PATCH (F2–F5)
--
-- Aligns the schema with the Stripe-webhook + snapshot-ingest WRITE paths, which
-- reference columns/tables that 0001/0002 do not define. Those writes are wrapped
-- in try/catch and currently fail SILENTLY (200/202 returned, nothing persisted),
-- so this is a go-live correctness fix, not a build fix. Source: GO_LIVE.md
-- "Consolidated AUDIT PATCH" (findings F2–F5).
--
-- Apply order: after 0001_init + 0002_billing + seed, before policies.sql.
-- Additive only (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS), so it is
-- safe to re-run. The app's mock-data path never touches the DB, so this changes
-- nothing until real Supabase creds are wired.
--
-- ⚠️ UNVERIFIED: authored from the static audit; no local Postgres/Docker was
-- available to execute it. Review before applying to a live project. The cleaner
-- long-term fix is to align the route handlers to the canonical column names
-- (operator_id / event_type / payload) instead of widening the schema — that is
-- an operator decision (schema-side vs code-side), tracked in GO_LIVE.md.

-- F2: subscriptions columns the webhook (handlers.ts) writes + portal route reads.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price_id TEXT;
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer
  ON subscriptions(stripe_customer_id);

-- F3: operator_rewards table the reward grant/revoke (rewards.ts) writes.
CREATE TABLE IF NOT EXISTS operator_rewards (
  operator_id UUID NOT NULL REFERENCES operators(operator_id),
  reward_id   TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'supporter',
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (operator_id, reward_id)
);

-- F4: snapshot ingest columns / nullability the route insert (snapshots/route.ts) needs.
ALTER TABLE snapshot_submissions ADD COLUMN IF NOT EXISTS codename TEXT;
ALTER TABLE snapshot_submissions ADD COLUMN IF NOT EXISTS tier TEXT;
ALTER TABLE snapshot_submissions ALTER COLUMN operator_id    DROP NOT NULL;
ALTER TABLE snapshot_submissions ALTER COLUMN schema_version DROP NOT NULL;
ALTER TABLE snapshot_submissions ALTER COLUMN signature      DROP NOT NULL;
-- If you keep the route's string submission ids (sub_xxxx), also:
-- ALTER TABLE snapshot_submissions ALTER COLUMN submission_id TYPE TEXT;

-- F5: audit_log + webhook_events columns the webhook route (stripe-webhook/route.ts) inserts.
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS action     TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS detail     JSONB;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE audit_log ALTER COLUMN event_type   DROP NOT NULL;
ALTER TABLE audit_log ALTER COLUMN event_source DROP NOT NULL;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS type TEXT;

-- New table needs RLS (service-role-only writes; no public policy granted).
ALTER TABLE operator_rewards ENABLE ROW LEVEL SECURITY;
