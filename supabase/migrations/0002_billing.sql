-- ============================================================================
-- Migration 0002_billing — Stripe billing + operational / system tables.
--
-- Second half of supabase/schema.sql. Depends on 0001_init (operators table).
-- The operators table already carries stripe_customer_id, current_supporter_tier
-- and the claim_* columns (created in 0001), so this migration only adds the
-- billing, webhook, audit, ruleset-version and system-stats tables.
--
-- Anonymous + claimable model: claims are a one-time lifetime payment
-- (Stripe Checkout mode:'payment', price env STRIPE_PRICE_CLAIM_LIFETIME). The
-- claim outcome is written to operators.claim_* (0001) and recorded in audit_log
-- here. Subscriptions cover the recurring supporter tiers (patron / pro /
-- circle_sponsor) and are independent of claim.
-- ============================================================================

-- ============================================================================
-- subscriptions — Stripe subscription state (stripe_integration.md).
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id      TEXT PRIMARY KEY,            -- Stripe sub id
  operator_id          UUID NOT NULL REFERENCES operators(operator_id),
  status               TEXT NOT NULL,               -- active, past_due, canceled, etc.
  tier                 TEXT NOT NULL,               -- patron, pro, circle_sponsor
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end   TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_operator ON subscriptions(operator_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- webhook_events — Stripe webhook idempotency (webhook_handling.md).
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id           TEXT PRIMARY KEY,              -- Stripe event id (evt_xxx)
  event_type         TEXT NOT NULL,
  received_at        TIMESTAMPTZ DEFAULT now(),
  processed_at       TIMESTAMPTZ,
  payload_json       JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);

-- ============================================================================
-- audit_log — append-only forensic / state-change trail (IPO S.X.03).
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  audit_log_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type         TEXT NOT NULL,
  event_source       TEXT NOT NULL,                 -- stripe, scoring_worker, admin, agent
  operator_id        UUID REFERENCES operators(operator_id),
  submission_id      UUID REFERENCES snapshot_submissions(submission_id),
  step_id            TEXT,                          -- canonical scoring step (S.xx)
  input_hash         TEXT,
  output_hash        TEXT,
  ruleset_version    TEXT,
  payload            JSONB,
  occurred_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_operator ON audit_log(operator_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type, occurred_at DESC);

-- ============================================================================
-- ruleset_versions — trust ledger of scoring changes (refresh_cadences.md).
-- ============================================================================
CREATE TABLE IF NOT EXISTS ruleset_versions (
  version            TEXT PRIMARY KEY,
  effective_from     TIMESTAMPTZ NOT NULL,
  changelog          TEXT NOT NULL,
  changed_params     JSONB NOT NULL  -- which RS.xx params changed
);

-- ============================================================================
-- system_stats — singleton homepage aggregate block (one row, id pinned TRUE).
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_stats (
  id                  BOOLEAN PRIMARY KEY DEFAULT TRUE,
  total_operators     INTEGER NOT NULL DEFAULT 0,
  total_snapshots     BIGINT NOT NULL DEFAULT 0,
  total_tokens_scored BIGINT NOT NULL DEFAULT 0,
  transmitter_count   INTEGER NOT NULL DEFAULT 0,
  top_operator_id     UUID REFERENCES operators(operator_id),
  top_signa_rate      NUMERIC(5,2),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT system_stats_singleton CHECK (id IS TRUE)
);

-- End of 0002_billing.
