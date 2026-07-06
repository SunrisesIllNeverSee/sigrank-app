-- ============================================================================
-- Migration 0001_init — core SigRank leaderboard schema.
--
-- This is the first half of the canonical supabase/schema.sql, covering the
-- core telemetry → scoring → leaderboard tables. The billing, claim, and
-- system/operational tables land in 0002_billing.sql.
--
-- NOTE: operators here already carries the claim_* + Stripe linkage columns so
-- the table is created once with its full shape (0002 does NOT alter it).
-- Applying 0001 then 0002 is equivalent to applying schema.sql.
-- ============================================================================

-- Extensions ------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- trigram search on codename

-- ============================================================================
-- operators — primary identity table (anonymous by default + claim fields).
-- ============================================================================
CREATE TABLE IF NOT EXISTS operators (
  operator_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codename                TEXT NOT NULL UNIQUE,
  display_name            TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen               TIMESTAMPTZ,
  status                  TEXT NOT NULL DEFAULT 'active',
                          -- active, dormant, banned, retired
  privacy_level           TEXT NOT NULL DEFAULT 'public',
                          -- public, anonymous, private
  verification_status     TEXT NOT NULL DEFAULT 'unverified',
                          -- unverified, verified, audited
  primary_domain          TEXT,
                          -- which AI platform: claude, chatgpt, gemini, pi, multi
  account_age_days        INTEGER,
  total_messages_lifetime BIGINT DEFAULT 0,

  -- Stripe billing linkage (stripe_integration.md).
  stripe_customer_id      TEXT UNIQUE,
  current_supporter_tier  TEXT NOT NULL DEFAULT 'free',
                          -- free, patron, pro, circle_sponsor

  -- Claim (one-time lifetime payment, mode:'payment'). Anonymous until claimed.
  claimed                 BOOLEAN NOT NULL DEFAULT false,
  claimed_at              TIMESTAMPTZ,
  claim_payment_id        TEXT,
  claim_contact           TEXT
);
CREATE INDEX IF NOT EXISTS idx_operators_codename ON operators(codename);
CREATE INDEX IF NOT EXISTS idx_operators_last_seen ON operators(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);
CREATE INDEX IF NOT EXISTS idx_operators_claimed ON operators(claimed);
CREATE INDEX IF NOT EXISTS idx_operators_codename_trgm
  ON operators USING gin (codename gin_trgm_ops);
-- ============================================================================
-- devices
-- ============================================================================
CREATE TABLE IF NOT EXISTS devices (
  device_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  agent_public_key   TEXT NOT NULL,
  agent_version      TEXT NOT NULL,
  device_label       TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen          TIMESTAMPTZ,
  trust_status       TEXT NOT NULL DEFAULT 'pending'
                     -- pending, trusted, revoked
);
CREATE INDEX IF NOT EXISTS idx_devices_operator ON devices(operator_id);
-- ============================================================================
-- snapshot_submissions — append-only raw payloads.
-- ============================================================================
CREATE TABLE IF NOT EXISTS snapshot_submissions (
  submission_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  device_id          UUID NOT NULL REFERENCES devices(device_id),
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_type        TEXT NOT NULL,
  window_start       TIMESTAMPTZ NOT NULL,
  window_end         TIMESTAMPTZ NOT NULL,
  schema_version     TEXT NOT NULL,
  ruleset_version    TEXT NOT NULL,
  snapshot_hash      TEXT NOT NULL,
  signature          TEXT NOT NULL,
  payload_json       JSONB NOT NULL,
  status             TEXT NOT NULL DEFAULT 'received'
                     -- received, validated, rejected, scored
);
CREATE INDEX IF NOT EXISTS idx_submissions_operator
  ON snapshot_submissions(operator_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status
  ON snapshot_submissions(status);
-- ============================================================================
-- session_summaries
-- ============================================================================
CREATE TABLE IF NOT EXISTS session_summaries (
  session_id              UUID PRIMARY KEY,
  operator_id             UUID NOT NULL REFERENCES operators(operator_id),
  submission_id           UUID NOT NULL REFERENCES snapshot_submissions(submission_id),
  source_type             TEXT NOT NULL,
  started_at              TIMESTAMPTZ NOT NULL,
  ended_at                TIMESTAMPTZ,
  message_count           INTEGER NOT NULL DEFAULT 0,
  token_estimate          BIGINT DEFAULT 0,
  session_depth_avg       NUMERIC(6,2),
  prompt_complexity_score NUMERIC(5,2),
  cross_thread_score      INTEGER,
  compression_ratio       NUMERIC(5,4),
  last_seen_at            TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sessions_operator
  ON session_summaries(operator_id, started_at DESC);
-- ============================================================================
-- feature_rollups_daily
-- ============================================================================
CREATE TABLE IF NOT EXISTS feature_rollups_daily (
  rollup_date        DATE NOT NULL,
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  messages_total     INTEGER NOT NULL DEFAULT 0,
  sessions_total     INTEGER NOT NULL DEFAULT 0,
  depth_avg          NUMERIC(6,2),
  depth_max          INTEGER,
  complexity_avg     NUMERIC(5,2),
  complexity_max     NUMERIC(5,2),
  cross_thread_refs  INTEGER DEFAULT 0,
  memory_callbacks   INTEGER DEFAULT 0,
  active_minutes_est INTEGER DEFAULT 0,
  streak_days        INTEGER DEFAULT 0,
  feature_json       JSONB,
  PRIMARY KEY (rollup_date, operator_id)
);
CREATE INDEX IF NOT EXISTS idx_rollups_operator
  ON feature_rollups_daily(operator_id, rollup_date DESC);
-- ============================================================================
-- metric_snapshots — board-grade scored metrics (incl. sdot_score + sdrm_score).
-- ============================================================================
CREATE TABLE IF NOT EXISTS metric_snapshots (
  metric_snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  snapshot_date      DATE NOT NULL,
  window_type        TEXT NOT NULL,

  -- Core 5
  compression_ratio  NUMERIC(5,4),
  prompt_complexity  NUMERIC(5,2),
  cross_thread       INTEGER,
  session_depth      NUMERIC(6,2),
  token_throughput   BIGINT,

  -- Background 3
  message_volume     INTEGER,
  account_age_days   INTEGER,
  total_messages     BIGINT,

  -- Composites + extras
  signa_rate         NUMERIC(5,2),
  sdot_score         NUMERIC(5,2),   -- C.02 Signal Delta Over Time
  sdrm_score         NUMERIC(5,2),   -- C.03 Signal Density Resonance Metric
  signal_force       NUMERIC(10,2),  -- E.01 Signal Force
  drift_ratio        NUMERIC(5,2),   -- E.02 Drift Ratio (Pro-only)

  -- Class assignment
  class_tier         TEXT,

  -- Activity
  last_seen          TIMESTAMPTZ,
  recency_modifier   NUMERIC(3,2),
  live_signa_rate    NUMERIC(5,2),

  -- Movement
  movement_24h       INTEGER,
  movement_7d        INTEGER,

  generated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ruleset_version    TEXT NOT NULL,

  UNIQUE (operator_id, snapshot_date, window_type)
);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_signa
  ON metric_snapshots(signa_rate DESC);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_class
  ON metric_snapshots(class_tier, signa_rate DESC);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_date
  ON metric_snapshots(snapshot_date DESC);
-- ============================================================================
-- rank_history
-- ============================================================================
CREATE TABLE IF NOT EXISTS rank_history (
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  snapshot_date      DATE NOT NULL,
  global_rank        INTEGER,
  class_rank         INTEGER,
  compression_rank   INTEGER,
  depth_rank         INTEGER,
  volume_rank        INTEGER,
  complexity_rank    INTEGER,
  cross_thread_rank  INTEGER,
  percentile         NUMERIC(5,2),
  PRIMARY KEY (operator_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_rank_history_global
  ON rank_history(snapshot_date, global_rank);
-- ============================================================================
-- badges + operator_badges
-- ============================================================================
CREATE TABLE IF NOT EXISTS badges (
  badge_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name         TEXT NOT NULL UNIQUE,
  badge_type         TEXT NOT NULL,
  criteria_json      JSONB NOT NULL,
  rarity             TEXT NOT NULL DEFAULT 'common',
  icon_url           TEXT
);
CREATE TABLE IF NOT EXISTS operator_badges (
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  badge_id           UUID NOT NULL REFERENCES badges(badge_id),
  awarded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_snapshot_id UUID REFERENCES metric_snapshots(metric_snapshot_id),
  source_note        TEXT,
  PRIMARY KEY (operator_id, badge_id, awarded_at)
);
CREATE INDEX IF NOT EXISTS idx_operator_badges_operator
  ON operator_badges(operator_id);
-- ============================================================================
-- leaderboards_cached
-- ============================================================================
CREATE TABLE IF NOT EXISTS leaderboards_cached (
  leaderboard_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_type         TEXT NOT NULL,
  scope              TEXT NOT NULL,
  scope_value        TEXT,
  window_type        TEXT NOT NULL,
  generated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ruleset_version    TEXT NOT NULL,
  payload_json       JSONB NOT NULL,
  expires_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_leaderboards_lookup
  ON leaderboards_cached(board_type, scope, scope_value, window_type, generated_at DESC);
-- ============================================================================
-- audit_records — precision-tier audit findings.
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_records (
  audit_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  audit_date         TIMESTAMPTZ NOT NULL DEFAULT now(),
  auditor            TEXT NOT NULL,
  finding_type       TEXT NOT NULL,
  finding_summary    TEXT,
  audit_payload      JSONB,
  status             TEXT NOT NULL DEFAULT 'active',
  confidence         NUMERIC(3,2)
);
CREATE INDEX IF NOT EXISTS idx_audit_records_operator
  ON audit_records(operator_id, audit_date DESC);
-- ============================================================================
-- rulesets — versioned scoring rule sets.
-- ============================================================================
CREATE TABLE IF NOT EXISTS rulesets (
  ruleset_version    TEXT PRIMARY KEY,
  effective_from     TIMESTAMPTZ NOT NULL,
  effective_to       TIMESTAMPTZ,
  formula_json       JSONB NOT NULL,
  threshold_json     JSONB NOT NULL,
  weight_json        JSONB NOT NULL,
  notes              TEXT
);
-- ============================================================================
-- circles + circle_members + circle_metric_snapshots (Phase 2).
-- ============================================================================
CREATE TABLE IF NOT EXISTS circles (
  circle_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  tag                TEXT NOT NULL UNIQUE,
  visibility         TEXT NOT NULL DEFAULT 'public',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_operator_id  UUID NOT NULL REFERENCES operators(operator_id)
);
CREATE INDEX IF NOT EXISTS idx_circles_owner ON circles(owner_operator_id);
CREATE TABLE IF NOT EXISTS circle_members (
  circle_id          UUID NOT NULL REFERENCES circles(circle_id),
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  joined_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  role               TEXT NOT NULL DEFAULT 'member',
  status             TEXT NOT NULL DEFAULT 'active',
  PRIMARY KEY (circle_id, operator_id)
);
CREATE INDEX IF NOT EXISTS idx_circle_members_operator ON circle_members(operator_id);
CREATE TABLE IF NOT EXISTS circle_metric_snapshots (
  circle_id          UUID NOT NULL REFERENCES circles(circle_id),
  snapshot_date      DATE NOT NULL,
  avg_compression    NUMERIC(5,4),
  avg_depth          NUMERIC(6,2),
  avg_complexity     NUMERIC(5,2),
  avg_cross_thread   NUMERIC(6,2),
  total_volume       BIGINT,
  avg_signa_rate     NUMERIC(5,2),
  global_rank        INTEGER,
  PRIMARY KEY (circle_id, snapshot_date)
);
-- End of 0001_init.;
