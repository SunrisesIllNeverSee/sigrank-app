-- Execution Provider Hardening (P0.2, P0.3, P1.1, P1.2, P1.3)
-- Adds: idempotency columns, state_version, RLS, DB constraints, hash enforcement

-- ─── P0.2: Idempotency + replay protection columns ───
ALTER TABLE exchange_execution_receipts
  ADD COLUMN IF NOT EXISTS provider_event_id text,
  ADD COLUMN IF NOT EXISTS provider_event_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS nonce text,
  ADD COLUMN IF NOT EXISTS payload_hash text,
  ADD COLUMN IF NOT EXISTS verified_provider_id text;

-- Unique constraint on (provider, provider_event_id) for idempotency
-- This prevents duplicate receipts for the same provider event
CREATE UNIQUE INDEX IF NOT EXISTS idx_execution_receipts_provider_event
  ON exchange_execution_receipts(provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

-- ─── P0.3: Optimistic concurrency (state_version) ───
ALTER TABLE exchange_executions
  ADD COLUMN IF NOT EXISTS state_version bigint NOT NULL DEFAULT 0;

-- ─── P1.1: Enable Row-Level Security ───
ALTER TABLE exchange_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_execution_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies: service_role has full access, all others denied
-- (Tables are already REVOKED from anon/authenticated, but RLS adds
-- defense-in-depth for any role that might gain access in the future)
CREATE POLICY exchange_executions_service_role_all
  ON exchange_executions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY exchange_execution_receipts_service_role_all
  ON exchange_execution_receipts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No policies for anon or authenticated — they get nothing

-- ─── P1.2: Database constraints ───

-- Allowed execution modes
ALTER TABLE exchange_executions
  ADD CONSTRAINT chk_execution_mode
  CHECK (mode IN ('no_execution_required', 'self_executed', 'direct_agent', 'external_provider', 'human'));

-- Allowed normalized execution states
ALTER TABLE exchange_executions
  ADD CONSTRAINT chk_execution_state
  CHECK (state IN ('created', 'offered', 'accepted', 'funded', 'executing', 'delivered', 'verified', 'settled', 'failed', 'cancelled', 'disputed', 'expired'));

-- Non-empty provider ID
ALTER TABLE exchange_executions
  ADD CONSTRAINT chk_execution_provider_not_empty
  CHECK (provider IS NOT NULL AND provider != '');

-- Required provider reference for external executions
ALTER TABLE exchange_executions
  ADD CONSTRAINT chk_external_provider_reference
  CHECK (mode != 'external_provider' OR (provider_reference IS NOT NULL AND provider_reference != ''));

-- Allowed receipt statuses
ALTER TABLE exchange_execution_receipts
  ADD CONSTRAINT chk_receipt_status
  CHECK (status IN ('delivered', 'verified', 'failed', 'cancelled', 'disputed'));

-- Non-empty payload hash when provider_event_id is present
ALTER TABLE exchange_execution_receipts
  ADD CONSTRAINT chk_receipt_payload_hash
  CHECK (provider_event_id IS NULL OR (payload_hash IS NOT NULL AND payload_hash != ''));

-- Valid state-version values
ALTER TABLE exchange_executions
  ADD CONSTRAINT chk_state_version_nonneg
  CHECK (state_version >= 0);

-- ─── P1.3: Harden source_commitment_hash ───
-- Stage A: Audit — table is empty, no rows to audit
-- Stage B: Repair — no rows to repair
-- Stage C: Application writes already require finalized hash (router enforces)
-- Stage D: Enforce at DB layer

-- First make it NOT NULL
ALTER TABLE exchange_executions
  ALTER COLUMN source_commitment_hash SET NOT NULL;

-- Non-empty check
ALTER TABLE exchange_executions
  ADD CONSTRAINT chk_commitment_hash_not_empty
  CHECK (source_commitment_hash != '');

-- Make it immutable after creation (can only be set on INSERT, not UPDATE)
CREATE OR REPLACE FUNCTION enforce_commitment_hash_immutable()
RETURNS trigger AS $$
BEGIN
  IF NEW.source_commitment_hash IS DISTINCT FROM OLD.source_commitment_hash THEN
    RAISE EXCEPTION 'source_commitment_hash is immutable after execution creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS execution_commitment_hash_immutable ON exchange_executions;
CREATE TRIGGER execution_commitment_hash_immutable
  BEFORE UPDATE ON exchange_executions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_commitment_hash_immutable();

-- ─── Composite relationship: receipt → execution provider binding ───
-- This prevents a receipt from being attached under a mismatched provider
-- We add a composite FK from receipts to executions on (execution_id, provider)
-- Note: provider_reference is also checked at the application layer
-- but we can't easily composite-FK on it since executions.provider_reference
-- can be NULL for non-external modes.

-- Add provider to the existing FK by creating a unique composite index
-- on exchange_executions (execution_id, provider) and then a composite FK
CREATE UNIQUE INDEX IF NOT EXISTS idx_executions_execution_id_provider
  ON exchange_executions(execution_id, provider);

-- Add a composite FK on receipts
ALTER TABLE exchange_execution_receipts
  ADD CONSTRAINT fk_receipt_execution_provider
  FOREIGN KEY (execution_id, provider)
  REFERENCES exchange_executions(execution_id, provider)
  ON DELETE CASCADE;
