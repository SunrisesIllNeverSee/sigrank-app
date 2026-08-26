-- Execution Provider Hardening — Review Fixes (P0.2, P1.1, P1.2)
--
-- Addresses findings from the hardening review:
--   1. P0.2: Add nonce replay protection (unique constraint on (provider, nonce))
--   2. P1.1: FORCE ROW LEVEL SECURITY so the table owner cannot bypass RLS
--   3. P1.2: Strengthen the composite FK to include provider_reference for
--            external executions (additional composite FK, not a replacement)
--
-- The existing Contribution Exchange authorization model is service_role-only
-- with authorization enforced in API routes (authenticateCompany /
-- authenticateProposer). Per the hardening spec ("Do not invent a second
-- authorization model just for execution records"), we keep that model and
-- add FORCE RLS as defense-in-depth rather than introducing participant RLS
-- policies that don't exist on exchange_records either.

-- ─── P0.2: Nonce replay protection ───
-- A nonce supplied by a provider must be unique per provider within its
-- validity window. We enforce this with a partial unique index on
-- (provider, nonce) where nonce is not null. The application layer rejects
-- expired timestamps before insert, so the index effectively enforces
-- uniqueness within the live window (expired rows are never inserted).
CREATE UNIQUE INDEX IF NOT EXISTS idx_execution_receipts_provider_nonce
  ON exchange_execution_receipts(provider, nonce)
  WHERE nonce IS NOT NULL;

-- ─── P1.1: FORCE Row Level Security ───
-- ENABLE RLS without FORCE leaves the table owner able to bypass policies.
-- FORCE RLS closes that bypass so even the owner is subject to the policies.
-- Combined with the existing service_role-only policies from migration 0039,
-- this means only the service_role (which has an explicit USING (true) /
-- WITH CHECK (true) policy) can read or write these tables.
ALTER TABLE exchange_executions FORCE ROW LEVEL SECURITY;
ALTER TABLE exchange_execution_receipts FORCE ROW LEVEL SECURITY;

-- ─── P1.2: Strengthen composite FK to include provider_reference ───
-- The prior composite FK (execution_id, provider) from migration 0039
-- prevented provider mismatches but not provider_reference mismatches at
-- the DB layer. We ADD a second composite FK on (execution_id, provider,
-- provider_reference) that binds the receipt's provider_reference to the
-- persisted execution's provider_reference at the database layer.
--
-- Both FKs coexist:
--   - fk_receipt_execution_provider (execution_id, provider)
--     Covers ALL executions regardless of provider_reference. This is the
--     baseline provider-binding check and is retained from migration 0039.
--   - fk_receipt_execution_provider_ref (execution_id, provider, provider_reference)
--     Adds stricter binding for executions that carry a non-NULL
--     provider_reference. PostgreSQL FK columns with NULL skip the check,
--     so internal/self-executed receipts with NULL provider_reference are
--     unaffected by this second FK and remain covered by the first.
--
-- The application layer (Zod schema) requires provider_reference to be a
-- non-empty string on all receipts, so in practice both FKs are always
-- active. The NULL-skip path exists only as a DB-layer safety margin for
-- direct inserts that bypass the application schema.
--
-- We do NOT drop the existing (execution_id, provider) FK — it remains as
-- defense-in-depth for all execution modes.

-- Add a full unique index on the composite (execution_id, provider,
-- provider_reference). execution_id is already globally unique, so this
-- composite is guaranteed unique regardless of mode. PostgreSQL NULL
-- semantics treat NULL provider_reference values as distinct, so internal
-- executions with NULL provider_reference do not collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_executions_execution_id_provider_ref
  ON exchange_executions(execution_id, provider, provider_reference);

-- Add a composite FK on receipts that references the strengthened composite.
-- This prevents a receipt from being attached under a mismatched
-- provider_reference at the database layer. Receipts with NULL
-- provider_reference skip this FK check (PostgreSQL NULL semantics) but
-- are still covered by the original (execution_id, provider) FK from
-- migration 0039.
ALTER TABLE exchange_execution_receipts
  ADD CONSTRAINT fk_receipt_execution_provider_ref
  FOREIGN KEY (execution_id, provider, provider_reference)
  REFERENCES exchange_executions(execution_id, provider, provider_reference)
  ON DELETE CASCADE
  NOT VALID;

-- NOT VALID above avoids a full table scan during ALTER; existing rows are
-- not checked. The table is empty in production, so this is safe. Validate
-- now that the constraint is in place for future inserts.
ALTER TABLE exchange_execution_receipts
  VALIDATE CONSTRAINT fk_receipt_execution_provider_ref;
