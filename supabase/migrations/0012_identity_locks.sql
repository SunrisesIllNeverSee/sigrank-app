-- 0012_identity_locks.sql — per-field locks for OAuth provider identity sync.
--
-- The auth callback (app/auth/callback/route.ts) resyncs the PUBLIC identity fields
-- (display_name / avatar_url / handle) from the OAuth provider on every login, so a
-- profile is never blank and stays fresh from GitHub/X. These three flags record which
-- of those fields the operator has DELIBERATELY edited — the resync SKIPS a field whose
-- lock is true, so a user's edit is hardlined and never reverted by a later login.
--
-- Set true by the edit surfaces: POST /api/v1/profile (display_name, handle) and
-- POST /api/v1/profile/avatar (avatar_url). Default false = provider-managed.
-- Additive + idempotent; existing rows default to provider-managed (nothing locked).
ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS display_name_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_locked       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS handle_locked       boolean NOT NULL DEFAULT false;
