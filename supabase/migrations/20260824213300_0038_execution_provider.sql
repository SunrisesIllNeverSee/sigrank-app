-- Execution Provider Layer for Contribution Exchange
-- Adds execution routing, execution requests, and execution receipts
-- as separate tables from the core exchange_records.

-- Execution requests: outbound work sent to an execution provider
CREATE TABLE IF NOT EXISTS exchange_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL REFERENCES exchange_records(id) ON DELETE CASCADE,
  execution_id text NOT NULL UNIQUE,
  contribution_id text NOT NULL,
  source_commitment_hash text,
  provider text NOT NULL DEFAULT 'internal',
  provider_reference text,
  mode text NOT NULL DEFAULT 'self_executed',
  state text NOT NULL DEFAULT 'created',
  provider_state text,
  task jsonb NOT NULL,
  budget jsonb,
  authority jsonb NOT NULL DEFAULT '{"inspect":false,"test":false,"modify":false,"deploy":false,"access_scope":[]}',
  verification jsonb NOT NULL DEFAULT '{"criteria":[],"evidence_required":[]}',
  deadline timestamptz,
  provenance jsonb NOT NULL DEFAULT '{"originator":"","contribution_lineage":[]}',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_executions_exchange_id ON exchange_executions(exchange_id);
CREATE INDEX IF NOT EXISTS idx_exchange_executions_provider ON exchange_executions(provider);
CREATE INDEX IF NOT EXISTS idx_exchange_executions_state ON exchange_executions(state);

-- Execution receipts: normalized results returned from execution providers
CREATE TABLE IF NOT EXISTS exchange_execution_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id text NOT NULL REFERENCES exchange_executions(execution_id) ON DELETE CASCADE,
  exchange_id uuid NOT NULL REFERENCES exchange_records(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_reference text,
  status text NOT NULL,
  executor jsonb NOT NULL,
  artifact jsonb,
  verification jsonb,
  settlement jsonb,
  timestamps jsonb NOT NULL,
  provider_metadata jsonb,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_execution_receipts_execution_id ON exchange_execution_receipts(execution_id);
CREATE INDEX IF NOT EXISTS idx_exchange_execution_receipts_exchange_id ON exchange_execution_receipts(exchange_id);

-- Revoke public access (service_role only, same as other exchange tables)
REVOKE ALL ON exchange_executions FROM anon, authenticated;
REVOKE ALL ON exchange_execution_receipts FROM anon, authenticated;

-- updated_at trigger
CREATE OR REPLACE FUNCTION trg_exchange_executions_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS exchange_executions_updated_at ON exchange_executions;
CREATE TRIGGER exchange_executions_updated_at
  BEFORE UPDATE ON exchange_executions
  FOR EACH ROW
  EXECUTE FUNCTION trg_exchange_executions_updated_at();
