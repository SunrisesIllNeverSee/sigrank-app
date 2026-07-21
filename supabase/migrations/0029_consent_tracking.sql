-- 0029_consent_tracking.sql — add consent tracking columns to operators.
--
-- Adds columns only; no application code reads or writes them yet (Phases 5-6).
-- This migration is additive and idempotent so it is safe for existing operators.

ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS consented_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version   TEXT,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT,
  ADD COLUMN IF NOT EXISTS data_opt_out    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_opt_out_at TIMESTAMPTZ;

COMMENT ON COLUMN operators.consented_at IS 'Timestamp when user explicitly consented to data collection';
COMMENT ON COLUMN operators.terms_version IS 'Version string of Terms of Service accepted (e.g. 2026-07-20)';
COMMENT ON COLUMN operators.privacy_version IS 'Version string of Privacy Policy accepted';
COMMENT ON COLUMN operators.data_opt_out IS 'When true, reject future submissions for this operator';
COMMENT ON COLUMN operators.data_opt_out_at IS 'Timestamp when opt-out was activated';
