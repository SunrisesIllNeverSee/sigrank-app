-- ============================================================================
-- SigRank — Supabase / PostgreSQL schema (canonical, full).
--
-- This single file is the authoritative DDL. It is mirrored, split by concern,
-- into supabase/migrations/0001_init.sql (core leaderboard tables) and
-- supabase/migrations/0002_billing.sql (Stripe billing + claim + system tables).
-- Applying schema.sql once is equivalent to applying 0001 then 0002.
--
-- Design principle (db_schema.md): never store only final scores. Store
-- canonical submissions, reusable features, derived metrics, and cached boards
-- so every snapshot is replayable when scoring rules change.
--
-- Anonymity (OPERATOR OVERRIDE): operators are anonymous by default — identified
-- ONLY by their generated `codename`, no PII. An operator may CLAIM their entry
-- via a one-time lifetime Stripe payment (mode:'payment'), which populates the
-- claim_* columns on operators. Unclaimed operators show codename only.
--
-- The app runs fully on deterministic mock data without any of this applied
-- (lib/data falls back when Supabase creds are absent). Apply this schema only
-- when wiring live data. See README.md for how to apply.
-- ============================================================================

-- Extensions ------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- trigram search on codename

-- ============================================================================
-- 1. operators — primary identity table (anonymous by default + claim fields).
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
                          -- denormalized for fast queries
  total_messages_lifetime BIGINT DEFAULT 0,
                          -- denormalized lifetime counter

  -- Stripe billing linkage (stripe_integration.md).
  stripe_customer_id      TEXT UNIQUE,
  current_supporter_tier  TEXT NOT NULL DEFAULT 'free',
                          -- free, patron, pro, circle_sponsor

  -- Claim (one-time lifetime payment, mode:'payment'). Anonymous until claimed.
  claimed                 BOOLEAN NOT NULL DEFAULT false,
  claimed_at              TIMESTAMPTZ,
  claim_payment_id        TEXT,
                          -- Stripe PaymentIntent / Checkout Session id
  claim_contact           TEXT,
                          -- email captured at claim time, nullable (no PII required)

  -- Phase-0 identity fields (migration 0007, apply post-move).
  -- Public profile fields — all nullable, all opt-in.
  handle                  TEXT UNIQUE,
                          -- vanity handle (nullable-unique; codename stays anonymous primary id)
  avatar_url              TEXT,
                          -- Supabase Storage URL (Phase 3 upload; display-only pre-move)
  bio                     TEXT,
  links                   JSONB DEFAULT '{}'::jsonb,
                          -- fixed slots: { github, site, x } (matches ProfileEditForm.tsx)
  location                TEXT
);

CREATE INDEX IF NOT EXISTS idx_operators_codename ON operators(codename);
CREATE INDEX IF NOT EXISTS idx_operators_last_seen ON operators(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);
CREATE INDEX IF NOT EXISTS idx_operators_claimed ON operators(claimed);
-- Trigram index for fuzzy codename search (search-by-handle).
CREATE INDEX IF NOT EXISTS idx_operators_codename_trgm
  ON operators USING gin (codename gin_trgm_ops);

-- ============================================================================
-- 2. devices — each operator may run multiple local agents.
-- ============================================================================
CREATE TABLE IF NOT EXISTS devices (
  device_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  agent_public_key   TEXT NOT NULL,
  agent_version      TEXT NOT NULL,
  device_label       TEXT,
                     -- user-provided: "macbook", "desk linux", etc.
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen          TIMESTAMPTZ,
  trust_status       TEXT NOT NULL DEFAULT 'pending'
                     -- pending, trusted, revoked
);

CREATE INDEX IF NOT EXISTS idx_devices_operator ON devices(operator_id);

-- ============================================================================
-- 3. snapshot_submissions — raw agent payloads. Append-only, never modified.
-- ============================================================================
CREATE TABLE IF NOT EXISTS snapshot_submissions (
  submission_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  device_id          UUID NOT NULL REFERENCES devices(device_id),
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_type        TEXT NOT NULL,
                     -- today, 7d, 30d, 90d, all_time
  window_start       TIMESTAMPTZ NOT NULL,
  window_end         TIMESTAMPTZ NOT NULL,
  schema_version     TEXT NOT NULL,
                     -- snapshot payload version
  ruleset_version    TEXT NOT NULL,
                     -- scoring engine version applied
  snapshot_hash      TEXT NOT NULL,
                     -- sha256 of canonical payload
  signature          TEXT NOT NULL,
                     -- agent signature
  payload_json       JSONB NOT NULL,
  status             TEXT NOT NULL DEFAULT 'received'
                     -- received, validated, rejected, scored
);

CREATE INDEX IF NOT EXISTS idx_submissions_operator
  ON snapshot_submissions(operator_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_status
  ON snapshot_submissions(status);

-- ============================================================================
-- 4. session_summaries — per-session metrics.
-- ============================================================================
CREATE TABLE IF NOT EXISTS session_summaries (
  session_id              UUID PRIMARY KEY,
  operator_id             UUID NOT NULL REFERENCES operators(operator_id),
  submission_id           UUID NOT NULL REFERENCES snapshot_submissions(submission_id),
  source_type             TEXT NOT NULL,
                          -- claude, chatgpt, gemini, pi, generic
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
-- 5. feature_rollups_daily — daily aggregated features. Reusable middle layer.
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
                     -- bag of additional features for replay
  PRIMARY KEY (rollup_date, operator_id)
);

CREATE INDEX IF NOT EXISTS idx_rollups_operator
  ON feature_rollups_daily(operator_id, rollup_date DESC);

-- ============================================================================
-- 6. metric_snapshots — board-grade scored metrics. The leaderboard reads here.
--    Includes sdot_score (C.02) + sdrm_score (C.03), both NUMERIC(5,2).
-- ============================================================================
CREATE TABLE IF NOT EXISTS metric_snapshots (
  metric_snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  snapshot_date      DATE NOT NULL,
  window_type        TEXT NOT NULL,

  -- Core 5 (M.01–M.05)
  compression_ratio  NUMERIC(5,4),
  prompt_complexity  NUMERIC(5,2),
  cross_thread       INTEGER,
  session_depth      NUMERIC(6,2),
  token_throughput   BIGINT,

  -- Background 3 (B.01–B.03)
  message_volume     INTEGER,
  account_age_days   INTEGER,
  total_messages     BIGINT,

  -- Composites (Big 3: C.01 SIGNA, C.02 SDOT, C.03 SDRM) + E.01 / E.02
  signa_rate         NUMERIC(5,2),
  sdot_score         NUMERIC(5,2),   -- C.02 Signal Delta Over Time
  sdrm_score         NUMERIC(5,2),   -- C.03 Signal Density Resonance Metric
  signal_force       NUMERIC(10,2),  -- E.01 Signal Force
  drift_ratio        NUMERIC(5,2),   -- E.02 Drift Ratio (Pro-only)

  -- Class assignment (K.xx)
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
-- 7. rank_history — per-metric historical ranks for trend charts.
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
-- 8. badges — canonical badge catalog (BG.01–BG.16).
-- ============================================================================
CREATE TABLE IF NOT EXISTS badges (
  badge_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name         TEXT NOT NULL UNIQUE,
  badge_type         TEXT NOT NULL,
                     -- structural, event, prestige, audit, patron
  criteria_json      JSONB NOT NULL,
  rarity             TEXT NOT NULL DEFAULT 'common',
                     -- common, rare, epic, legendary
  icon_url           TEXT
);

-- ============================================================================
-- 9. operator_badges — badge awards.
-- ============================================================================
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
-- 10. leaderboards_cached — precomputed boards. The web app reads from here.
-- ============================================================================
CREATE TABLE IF NOT EXISTS leaderboards_cached (
  leaderboard_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_type         TEXT NOT NULL,
                     -- global, compression, depth, complexity, cross_thread,
                     -- volume, circle_global, class_transmitter, etc.
  scope              TEXT NOT NULL,
                     -- global, region, platform, class
  scope_value        TEXT,
                     -- e.g. "claude", "north_america", "transmitter"
  window_type        TEXT NOT NULL,
                     -- 24h, 7d, 30d, 90d, all_time
  generated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ruleset_version    TEXT NOT NULL,
  payload_json       JSONB NOT NULL,
                     -- ordered array of {rank, operator_id, score, ...}
  expires_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_lookup
  ON leaderboards_cached(board_type, scope, scope_value, window_type, generated_at DESC);

-- ============================================================================
-- 11. audit_records — precision-tier (sig_army) audit findings.
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_records (
  audit_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  audit_date         TIMESTAMPTZ NOT NULL DEFAULT now(),
  auditor            TEXT NOT NULL,
                     -- sig_army_v1, manual_review, etc.
  finding_type       TEXT NOT NULL,
                     -- score_verified, score_revised, anomaly_flagged
  finding_summary    TEXT,
  audit_payload      JSONB,
  status             TEXT NOT NULL DEFAULT 'active',
  confidence         NUMERIC(3,2)
);

CREATE INDEX IF NOT EXISTS idx_audit_records_operator
  ON audit_records(operator_id, audit_date DESC);

-- ============================================================================
-- 12. rulesets — versioned scoring rule sets so we can replay history.
-- ============================================================================
CREATE TABLE IF NOT EXISTS rulesets (
  ruleset_version    TEXT PRIMARY KEY,
  effective_from     TIMESTAMPTZ NOT NULL,
  effective_to       TIMESTAMPTZ,
  formula_json       JSONB NOT NULL,
                     -- the full scoring formula as JSON
  threshold_json     JSONB NOT NULL,
                     -- class tier thresholds
  weight_json        JSONB NOT NULL,
                     -- composite weights
  notes              TEXT
);

-- ============================================================================
-- 13. subscriptions — Stripe subscription state (stripe_integration.md).
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
-- 14. webhook_events — Stripe webhook idempotency (webhook_handling.md).
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
-- 15. audit_log — append-only forensic / state-change trail (IPO S.X.03,
--     stripe_integration.md). Records every state-changing operation.
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  audit_log_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type         TEXT NOT NULL,
                     -- e.g. stripe.subscription.updated, score.recompute, claim.completed
  event_source       TEXT NOT NULL,
                     -- stripe, scoring_worker, admin, agent
  operator_id        UUID REFERENCES operators(operator_id),
  submission_id      UUID REFERENCES snapshot_submissions(submission_id),
  step_id            TEXT,
                     -- canonical scoring step (S.xx) when applicable
  input_hash         TEXT,
  output_hash        TEXT,
  ruleset_version    TEXT,
  payload            JSONB,
  occurred_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_operator ON audit_log(operator_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type, occurred_at DESC);

-- ============================================================================
-- 16. ruleset_versions — trust ledger of scoring changes (refresh_cadences.md).
--     Charts overlay vertical markers from this table.
-- ============================================================================
CREATE TABLE IF NOT EXISTS ruleset_versions (
  version            TEXT PRIMARY KEY,
  effective_from     TIMESTAMPTZ NOT NULL,
  changelog          TEXT NOT NULL,
  changed_params     JSONB NOT NULL  -- which RS.xx params changed
);

-- ============================================================================
-- 17. system_stats — singleton homepage aggregate block (one row).
--     `id` is pinned to TRUE so there can only ever be a single row.
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

-- ============================================================================
-- 18. circles — team / clan equivalent (Phase 2).
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

-- ============================================================================
-- 19. circle_members — membership rows.
-- ============================================================================
CREATE TABLE IF NOT EXISTS circle_members (
  circle_id          UUID NOT NULL REFERENCES circles(circle_id),
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  joined_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  role               TEXT NOT NULL DEFAULT 'member',
                     -- owner, officer, member
  status             TEXT NOT NULL DEFAULT 'active',
  PRIMARY KEY (circle_id, operator_id)
);

CREATE INDEX IF NOT EXISTS idx_circle_members_operator ON circle_members(operator_id);

-- ============================================================================
-- 20. circle_metric_snapshots — daily aggregated circle metrics.
-- ============================================================================
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

-- ============================================================================
-- 21. signal_prompts — weekly / event prompt briefs (challenge system).
-- ============================================================================
CREATE TABLE IF NOT EXISTS signal_prompts (
  prompt_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number       INTEGER,
  season            TEXT,
  format            TEXT NOT NULL DEFAULT 'signal_drop',
  brief             TEXT NOT NULL,
  constraint_text   TEXT,
  domain_tags       TEXT[] DEFAULT '{}',
  active_from       TIMESTAMPTZ NOT NULL,
  active_to         TIMESTAMPTZ NOT NULL,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        TEXT NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_signal_prompts_week   ON signal_prompts(week_number DESC);
CREATE INDEX IF NOT EXISTS idx_signal_prompts_active ON signal_prompts(active_from, active_to);
CREATE INDEX IF NOT EXISTS idx_signal_prompts_format ON signal_prompts(format);

-- ============================================================================
-- 22. challenges — one row per challenge match (throwdown / signal_drop /
--     bracket_match / circle_war).
-- ============================================================================
CREATE TABLE IF NOT EXISTS challenges (
  challenge_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id     UUID REFERENCES operators(operator_id),
  challenged_id     UUID REFERENCES operators(operator_id),
  prompt_id         UUID REFERENCES signal_prompts(prompt_id),
  prompt_brief      TEXT NOT NULL,
  format            TEXT NOT NULL DEFAULT 'throwdown',
  circle_id         UUID REFERENCES circles(circle_id),
  bracket_id        UUID,
  bracket_round     INTEGER,
  window_open       TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_close      TIMESTAMPTZ NOT NULL,
  challenger_score  NUMERIC(5,2),
  challenged_score  NUMERIC(5,2),
  score_breakdown   JSONB,
  winner_id         UUID REFERENCES operators(operator_id),
  margin            NUMERIC(5,2),
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','active','complete','expired','cancelled')),
  challenger_engine TEXT,
  challenged_engine TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  ruleset_version   TEXT NOT NULL DEFAULT 'challenge-v1'
);

CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_status     ON challenges(status, window_close);
CREATE INDEX IF NOT EXISTS idx_challenges_format     ON challenges(format, status);

-- ============================================================================
-- 23. challenge_submissions — one row per operator per challenge.
-- ============================================================================
CREATE TABLE IF NOT EXISTS challenge_submissions (
  submission_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id      UUID NOT NULL REFERENCES challenges(challenge_id),
  operator_id       UUID NOT NULL REFERENCES operators(operator_id),
  signal_text       TEXT NOT NULL,
  score_density     NUMERIC(5,2) NOT NULL,
  score_clarity     NUMERIC(5,2) NOT NULL,
  score_fidelity    NUMERIC(5,2) NOT NULL,
  score_brevity     NUMERIC(5,2) NOT NULL,
  score_impact      NUMERIC(5,2) NOT NULL,
  composite_score   NUMERIC(5,2) NOT NULL,
  engine            TEXT NOT NULL DEFAULT 'claude',
  certificate_json  JSONB,
  scoring_mode      TEXT NOT NULL DEFAULT 'local_sim',
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, operator_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_subs_challenge ON challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_subs_operator  ON challenge_submissions(operator_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_subs_score     ON challenge_submissions(composite_score DESC);

-- operator_domains — for /transmitters discovery page
ALTER TABLE operators ADD COLUMN IF NOT EXISTS operator_domains TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_operators_domains ON operators USING gin (operator_domains);

-- challenge record denormalized onto metric_snapshots for fast profile reads
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS challenges_total INTEGER DEFAULT 0;
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS challenges_won   INTEGER DEFAULT 0;
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS challenges_lost  INTEGER DEFAULT 0;
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS signal_drop_best NUMERIC(5,2);

-- ────────────────────────────────────────────────────────────────────────────
-- operators_public — column-restricted public read surface (P5 PII fix, 0008).
-- Mirrors supabase/migrations/0008_public_view.sql. Exposes every profile column
-- EXCEPT the auth identity (claim_contact) + payment ids (claim_payment_id,
-- stripe_customer_id) + privacy_level. security_invoker so base-table RLS still
-- governs row visibility. APPLY POST-MOVE (after 0007) — see the migration header.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW operators_public
  WITH (security_invoker = true) AS
  SELECT
    operator_id, codename, display_name, handle, avatar_url, bio, links, location,
    status, verification_status, primary_domain, account_age_days,
    total_messages_lifetime, current_supporter_tier, claimed, claimed_at, operator_domains
  FROM operators;
GRANT SELECT ON operators_public TO anon, authenticated;

-- ============================================================================
-- End of schema. Seed data lives in seed.sql; RLS policies in policies.sql.
-- ============================================================================
