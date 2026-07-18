-- ============================================================================
-- 0009_crm_calculate.sql — operator_reparse + operator_actions tables.
--
-- WHY: The CRM + Calculate system needs persistent storage for:
--   1. Re-parse results (operator_reparse) — every re-parse saved with all 3
--      ratios + chosen ratio + reason. Never recalculate from scratch.
--   2. Action history / case file (operator_actions) — append-only log of every
--      action taken on an operator (retire, reparse, reply, issue_fired, etc).
--      This table IS the CRM. The Appsmith dashboard is a view on top.
--
-- Token signatures (metric_snapshots) are NEVER touched by these tables.
-- These tables reference operators.operator_id but do not modify existing data.
--
-- See: Devins_Plans/gtm/launch/crm/CRM_CALCULATE_PLAN.md
--      Devins_Plans/gtm/launch/crm/calculate/CALCULATE_SPEC.md
-- ============================================================================

-- ============================================================================
-- operator_reparse — persisted re-parse results (the "Calculate" side)
-- ============================================================================
CREATE TABLE IF NOT EXISTS operator_reparse (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id       UUID NOT NULL REFERENCES operators(operator_id) ON DELETE CASCADE,
  codename_at_time  TEXT,
  snapshot_date     DATE NOT NULL,

  -- Original (as reported / broken seed data)
  original_input        BIGINT,
  original_cache_write  BIGINT,
  original_yield        NUMERIC,
  original_rank         INTEGER,
  original_class        TEXT,

  -- AA avg (3.5:1:0.5) — all-users average
  aa_input        BIGINT,
  aa_cache_write  BIGINT,
  aa_yield        NUMERIC,
  aa_rank         INTEGER,
  aa_class        TEXT,
  aa_leverage     NUMERIC,
  aa_velocity     NUMERIC,

  -- HCM (20:1:0.1) — human center of mass, library builders
  hcm_input        BIGINT,
  hcm_cache_write  BIGINT,
  hcm_yield        NUMERIC,
  hcm_rank         INTEGER,
  hcm_class        TEXT,
  hcm_leverage     NUMERIC,
  hcm_velocity     NUMERIC,

  -- Codex PU (243:1:1.03) — Codex power users, aggressive caching
  codex_input        BIGINT,
  codex_cache_write  BIGINT,
  codex_yield        NUMERIC,
  codex_rank         INTEGER,
  codex_class        TEXT,
  codex_leverage     NUMERIC,
  codex_velocity     NUMERIC,

  -- Decision (which ratio was chosen + why)
  chosen_ratio    TEXT,     -- 'AA avg' | 'HCM' | 'Codex PU' | null
  chosen_yield    NUMERIC,
  chosen_rank     INTEGER,
  reason          TEXT,     -- why this ratio was chosen
  actor           TEXT,     -- who made the decision (djm | devin | gtm | gtm2)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operator_reparse_operator_id
  ON operator_reparse(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_reparse_operator_id_created
  ON operator_reparse(operator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_reparse_codename
  ON operator_reparse(codename_at_time);

-- ============================================================================
-- operator_actions — append-only case file / audit trail (IS the CRM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS operator_actions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id       UUID NOT NULL REFERENCES operators(operator_id) ON DELETE CASCADE,
  codename_at_time  TEXT,
  action_type       TEXT NOT NULL,
    -- reparse | retire | reply_sent | issue_fired | response_received |
    -- claim_made | whale_flagged | second_touch | flag | note |
    -- silent_closure | converted | opt_out
  action_data       JSONB,    -- flexible payload (ratio, yield, rank, reason, issue_url, etc)
  actor             TEXT,     -- djm | devin | gtm | gtm2 | system
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operator_actions_operator_id
  ON operator_actions(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_actions_operator_id_created
  ON operator_actions(operator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_actions_action_type
  ON operator_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_operator_actions_created_at
  ON operator_actions(created_at DESC);

-- ============================================================================
-- RLS — server-only (service role bypasses). No public access.
-- ============================================================================
ALTER TABLE operator_reparse ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_actions ENABLE ROW LEVEL SECURITY;

-- No policies = no access except service role (which bypasses RLS).
-- The Appsmith UI connects via a service-role connection string, so it
-- can read/write. Public/anon keys get nothing.
