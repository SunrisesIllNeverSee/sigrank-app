-- 0044_advisor_security_fixes.sql
--
-- Fixes 4 advisor findings from `supabase db advisors --linked` (2026-08-30):
--   1. REVOKE excessive default grants on 8 tables from migrations 0041/0042
--      (they enabled RLS + created policies but never ran REVOKE, so anon and
--      authenticated inherited Supabase's default ALL grants — INSERT, UPDATE,
--      DELETE, TRUNCATE, TRIGGER, REFERENCES, SELECT — on all 8 tables).
--   2. Wrap current_setting() in (SELECT ...) in 3 signal_* RLS policies to
--      avoid per-row init plan re-evaluation (auth_rls_initplan advisor).
--   3. Pin search_path on 2 trigger functions (function_search_path_mutable).
--
-- Pattern follows migrations 0033 (advisor_security_fixes) and 0035
-- (lockdown_table_grants).
--
-- NOT fixed here (owner dashboard action):
--   4. auth_leaked_password_protection — enable in Dashboard → Auth → Settings.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. REVOKE excessive grants on 8 tables from migrations 0041/0042
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1a. Tables with NO public policy (deny-by-default): REVOKE ALL ───────
-- These tables have RLS enabled and no SELECT policy for anon/authenticated.
-- They are service-role-only. Revoke everything from anon + authenticated.

REVOKE ALL ON TABLE public.contribution_proposal_origins FROM anon;
REVOKE ALL ON TABLE public.contribution_proposal_origins FROM authenticated;
REVOKE ALL ON TABLE public.exchange_lineage FROM anon;
REVOKE ALL ON TABLE public.exchange_lineage FROM authenticated;

-- ─── 1b. Tables with intentional public-read SELECT: keep SELECT, revoke rest
-- These tables have RLS policies that allow public/actor-scoped SELECT.
-- Keep SELECT (the policy needs it), revoke all write + DDL grants.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.exchange_signals FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.exchange_signals FROM authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.exchange_signal_revisions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.exchange_signal_revisions FROM authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.signal_attempts FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.signal_attempts FROM authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.signal_qualifications FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.signal_qualifications FROM authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.signal_verifications FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON TABLE public.signal_verifications FROM authenticated;

-- ─── 1c. exchange_mcp_calls: REVOKE ALL from anon + authenticated ──────────
-- This table has an explicit anon-deny policy (USING false) + service-role
-- policies. The anon/authenticated grants are entirely unnecessary.

REVOKE ALL ON TABLE public.exchange_mcp_calls FROM anon;
REVOKE ALL ON TABLE public.exchange_mcp_calls FROM authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Fix auth_rls_initplan: wrap current_setting() in (SELECT ...)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- The advisor flags 3 policies that re-evaluate current_setting() per row.
-- Wrapping in (SELECT ...) forces a single evaluation per query (init plan).
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- signal_attempts: actor_read_own_attempts
DROP POLICY IF EXISTS actor_read_own_attempts ON public.signal_attempts;
CREATE POLICY actor_read_own_attempts ON public.signal_attempts
  FOR SELECT TO public
  USING (
    COALESCE(
      (SELECT current_setting('request.jwt.claims', true))::jsonb ->> 'actor_id',
      ''
    ) = actor_id
  );

-- signal_qualifications: actor_read_own_qualifications
DROP POLICY IF EXISTS actor_read_own_qualifications ON public.signal_qualifications;
CREATE POLICY actor_read_own_qualifications ON public.signal_qualifications
  FOR SELECT TO public
  USING (
    COALESCE(
      (SELECT current_setting('request.jwt.claims', true))::jsonb ->> 'actor_id',
      ''
    ) = subject_actor_id
  );

-- signal_verifications: actor_read_own_verifications
DROP POLICY IF EXISTS actor_read_own_verifications ON public.signal_verifications;
CREATE POLICY actor_read_own_verifications ON public.signal_verifications
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.signal_attempts a
      WHERE a.id = signal_verifications.attempt_id
        AND COALESCE(
          (SELECT current_setting('request.jwt.claims', true))::jsonb ->> 'actor_id',
          ''
        ) = a.actor_id
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Pin search_path on 2 trigger functions
-- ═══════════════════════════════════════════════════════════════════════════

ALTER FUNCTION public.trg_exchange_executions_updated_at()
  SET search_path = public, extensions;

ALTER FUNCTION public.enforce_commitment_hash_immutable()
  SET search_path = public, extensions;

-- ═══════════════════════════════════════════════════════════════════════════
-- Summary
-- ═══════════════════════════════════════════════════════════════════════════
-- After this migration:
--   contribution_proposal_origins: REVOKE ALL from anon+authenticated (no policy, deny-by-default)
--   exchange_lineage:              REVOKE ALL from anon+authenticated (no policy, deny-by-default)
--   exchange_mcp_calls:            REVOKE ALL from anon+authenticated (anon-deny policy, service-role only)
--   exchange_signals:              REVOKE non-SELECT from anon+authenticated (keep public-read SELECT policy)
--   exchange_signal_revisions:     REVOKE non-SELECT from anon+authenticated (keep public-read SELECT policy)
--   signal_attempts:               REVOKE non-SELECT from anon+authenticated (keep actor-scoped SELECT policy)
--   signal_qualifications:         REVOKE non-SELECT from anon+authenticated (keep actor-scoped SELECT policy)
--   signal_verifications:          REVOKE non-SELECT from anon+authenticated (keep actor-scoped SELECT policy)
--   3 signal_* policies:           current_setting() wrapped in (SELECT ...) for init plan
--   2 trigger functions:           search_path pinned to public, extensions
--
-- Remaining owner action:
--   Enable Leaked Password Protection in Dashboard → Authentication → Settings
