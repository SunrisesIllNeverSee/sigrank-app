-- 0054_security_hardening_pass2.sql
--
-- Idempotent; never deletes user data.
--   1. Revoke residual grants on vercel_integrations / agent_mailboxes
--      (created after 0035 relied on Supabase default ALL grants) and stop
--      future tables in public from inheriting anon/authenticated grants.
--   2. operator_reports: drop always-true INSERT/UPDATE policies.
--   3. signal_* actor policies: empty claim must never match an empty actor_id.
--   4. codename_history table (30-day codename change cooldown).
--   5. Pin search_path on the real operator_reports trigger function (0033
--      referenced a misspelled name, so it never took effect).

BEGIN;

-- 1 ---------------------------------------------------------------------
REVOKE ALL ON public.agent_mailboxes, public.vercel_integrations FROM anon, authenticated;

-- Applies to tables later created by the role running migrations (postgres on
-- Supabase). New tables then need explicit GRANTs (see 0051 pattern).
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

-- 2 ---------------------------------------------------------------------
-- service_role bypasses RLS; these policies let any client role write.
DROP POLICY IF EXISTS "server writes reports" ON public.operator_reports;
DROP POLICY IF EXISTS "server updates reports" ON public.operator_reports;

-- 3 ---------------------------------------------------------------------
-- NULLIF makes a missing/empty actor_id claim yield NULL (no match) rather
-- than '' (which would match rows whose actor_id is '').
DROP POLICY IF EXISTS actor_read_own_attempts ON public.signal_attempts;
CREATE POLICY actor_read_own_attempts ON public.signal_attempts
  FOR SELECT TO public
  USING (
    NULLIF(
      (SELECT NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'actor_id'),
      ''
    ) = actor_id
  );

DROP POLICY IF EXISTS actor_read_own_qualifications ON public.signal_qualifications;
CREATE POLICY actor_read_own_qualifications ON public.signal_qualifications
  FOR SELECT TO public
  USING (
    NULLIF(
      (SELECT NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'actor_id'),
      ''
    ) = subject_actor_id
  );

DROP POLICY IF EXISTS actor_read_own_verifications ON public.signal_verifications;
CREATE POLICY actor_read_own_verifications ON public.signal_verifications
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.signal_attempts a
      WHERE a.id = signal_verifications.attempt_id
        AND NULLIF(
          (SELECT NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'actor_id'),
          ''
        ) = a.actor_id
    )
  );

-- 4 ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.codename_history (
  id          bigserial PRIMARY KEY,
  operator_id uuid NOT NULL REFERENCES public.operators(operator_id),
  old_codename text NOT NULL,
  new_codename text NOT NULL,
  changed_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.codename_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.codename_history FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.codename_history_id_seq FROM anon, authenticated;
GRANT ALL ON public.codename_history TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.codename_history_id_seq TO service_role;
CREATE INDEX IF NOT EXISTS idx_codename_history_operator_changed
  ON public.codename_history (operator_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_codename_history_old_codename_lower
  ON public.codename_history (lower(old_codename));

-- 5 ---------------------------------------------------------------------
DO $$
BEGIN
  IF to_regprocedure('public.update_operator_reports_updated_at()') IS NOT NULL THEN
    ALTER FUNCTION public.update_operator_reports_updated_at()
      SET search_path = public, extensions;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
