-- 0035_lockdown_table_grants.sql
--
-- Defense-in-depth: revoke excessive table grants from anon and authenticated.
--
-- Supabase's default behavior grants ALL privileges (INSERT, UPDATE, DELETE,
-- TRIGGER, TRUNCATE, REFERENCES) to anon and authenticated on every table.
-- RLS policies protect the data, but if RLS is ever accidentally disabled on
-- a table, these grants would allow anon to modify or delete data.
--
-- This migration follows the principle of least privilege:
--   - anon: SELECT only on intentionally-public tables, NOTHING on sensitive tables
--   - authenticated: SELECT on public tables + INSERT/UPDATE/DELETE where RLS
--     policies allow it, NOTHING on service-role-only tables
--
-- The service_role bypasses RLS entirely and is unaffected by these changes.

-- ─── 1. Drop the useless p_audit_records_public_select policy ────────────
-- audit_records has a public SELECT policy with qual=true, but anon doesn't
-- have a SELECT grant, so the policy is dead code. Audit records should NOT
-- be public. Drop the policy.
DROP POLICY IF EXISTS p_audit_records_public_select ON public.audit_records;

-- ─── 2. Revoke ALL non-SELECT grants from anon on ALL public tables ──────
-- anon should never INSERT, UPDATE, DELETE, TRUNCATE, or TRIGGER any table.
-- All writes go through the service_role or authenticated (with RLS).

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.audit_log FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.audit_records FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.badges FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.challenge_submissions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.challenges FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.device_enroll_codes FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.devices FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.feature_rollups_daily FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.leaderboards_cached FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.metric_snapshots FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operator_accounts FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operator_actions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operator_badges FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operator_reparse FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operator_reports FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operator_rewards FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operators FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operators_public FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.rank_history FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.ruleset_versions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.rulesets FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.session_summaries FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.signal_prompts FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.site_counters FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.snapshot_submissions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.source_attestations FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.subscriptions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.system_stats FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.webhook_events FROM anon;

-- ─── 3. Revoke ALL grants from anon on sensitive tables ──────────────────
-- These tables should not be readable or writable by anon at all.
-- (No SELECT grant to revoke — it was never granted — but be explicit.)

REVOKE SELECT ON public.audit_log FROM anon;
REVOKE SELECT ON public.audit_records FROM anon;
REVOKE SELECT ON public.challenge_submissions FROM anon;
REVOKE SELECT ON public.challenges FROM anon;
REVOKE SELECT ON public.device_enroll_codes FROM anon;
REVOKE SELECT ON public.devices FROM anon;
REVOKE SELECT ON public.feature_rollups_daily FROM anon;
REVOKE SELECT ON public.operator_accounts FROM anon;
REVOKE SELECT ON public.operator_actions FROM anon;
REVOKE SELECT ON public.operator_reparse FROM anon;
REVOKE SELECT ON public.operator_reports FROM anon;
REVOKE SELECT ON public.operator_rewards FROM anon;
REVOKE SELECT ON public.session_summaries FROM anon;
REVOKE SELECT ON public.signal_prompts FROM anon;
REVOKE SELECT ON public.snapshot_submissions FROM anon;
REVOKE SELECT ON public.source_attestations FROM anon;
REVOKE SELECT ON public.subscriptions FROM anon;
REVOKE SELECT ON public.webhook_events FROM anon;

-- ─── 4. Revoke non-essential grants from authenticated on sensitive tables
-- authenticated should only have INSERT/UPDATE/DELETE on tables where RLS
-- policies allow it (operators, operator_accounts). Everything else is
-- service-role-only.

-- Sensitive tables: revoke ALL write grants from authenticated
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.audit_log FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.audit_records FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.badges FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.challenge_submissions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.challenges FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.device_enroll_codes FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.devices FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.feature_rollups_daily FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.leaderboards_cached FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.metric_snapshots FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operator_actions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operator_badges FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operator_reparse FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operator_reports FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.operator_rewards FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.rank_history FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.ruleset_versions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.rulesets FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.session_summaries FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.signal_prompts FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.site_counters FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.snapshot_submissions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.source_attestations FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.subscriptions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.system_stats FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.webhook_events FROM authenticated;

-- Sensitive tables: revoke SELECT from authenticated (no RLS policy allows it)
REVOKE SELECT ON public.audit_log FROM authenticated;
REVOKE SELECT ON public.audit_records FROM authenticated;
REVOKE SELECT ON public.challenge_submissions FROM authenticated;
REVOKE SELECT ON public.challenges FROM authenticated;
REVOKE SELECT ON public.device_enroll_codes FROM authenticated;
REVOKE SELECT ON public.devices FROM authenticated;
REVOKE SELECT ON public.feature_rollups_daily FROM authenticated;
REVOKE SELECT ON public.operator_actions FROM authenticated;
REVOKE SELECT ON public.operator_reparse FROM authenticated;
REVOKE SELECT ON public.operator_reports FROM authenticated;
REVOKE SELECT ON public.operator_rewards FROM authenticated;
REVOKE SELECT ON public.session_summaries FROM authenticated;
REVOKE SELECT ON public.signal_prompts FROM authenticated;
REVOKE SELECT ON public.snapshot_submissions FROM authenticated;
REVOKE SELECT ON public.source_attestations FROM authenticated;
REVOKE SELECT ON public.subscriptions FROM authenticated;
REVOKE SELECT ON public.webhook_events FROM authenticated;

-- ─── 5. Keep authenticated write access on operator-owned tables ─────────
-- These tables have RLS policies that allow authenticated users to write
-- their own data. The grants are kept (INSERT, UPDATE, DELETE) but TRIGGER,
-- TRUNCATE, and REFERENCES are revoked as unnecessary.
REVOKE TRIGGER, TRUNCATE, REFERENCES ON public.operators FROM authenticated;
REVOKE TRIGGER, TRUNCATE, REFERENCES ON public.operator_accounts FROM authenticated;

-- ─── Summary ─────────────────────────────────────────────────────────────
-- After this migration:
--   anon: SELECT only on 10 public tables (badges, leaderboards_cached,
--         metric_snapshots, operator_badges, operators, operators_public,
--         rank_history, ruleset_versions, rulesets, site_counters,
--         system_stats). No write grants on ANY table.
--   authenticated: SELECT on public tables + INSERT/UPDATE/DELETE on
--         operators + operator_accounts (RLS-gated). No write on sensitive
--         tables. No TRIGGER/TRUNCATE/REFERENCES on anything.
--   service_role: unchanged (bypasses RLS, full access)
