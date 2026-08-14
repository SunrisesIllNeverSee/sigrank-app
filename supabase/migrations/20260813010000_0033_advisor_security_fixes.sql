-- 0033_advisor_security_fixes.sql
-- Fixes from `supabase db advisors --linked` audit (2026-08-13).
-- Reduced findings from 63 → 24 (remaining 24 are intentional public-table exposure + info).

-- 1. GraphQL exposure: revoke anon + authenticated SELECT on sensitive tables.
--    pg_graphql reflects any table where the role has SELECT grant. RLS blocks
--    data access, but the table names + column names were still visible via
--    GraphQL introspection. Revoking the GRANT hides them from GraphQL entirely.
--    Service role bypasses GRANTs, so server-side code is unaffected.
--
--    Public tables (KEEP anon/authenticated SELECT — intentionally exposed):
--      badges, leaderboards_cached, metric_snapshots, operator_badges,
--      operators (via operators_public view), rank_history, ruleset_versions,
--      rulesets, site_counters, system_stats
--
--    Sensitive tables (REVOKE anon + authenticated SELECT):
REVOKE SELECT ON public.audit_log FROM anon;
REVOKE SELECT ON public.audit_records FROM anon, authenticated;
REVOKE SELECT ON public.challenges FROM anon, authenticated;
REVOKE SELECT ON public.challenge_submissions FROM anon, authenticated;
REVOKE SELECT ON public.devices FROM anon, authenticated;
REVOKE SELECT ON public.device_enroll_codes FROM authenticated;
REVOKE SELECT ON public.feature_rollups_daily FROM anon, authenticated;
REVOKE SELECT ON public.operator_accounts FROM anon, authenticated;
REVOKE SELECT ON public.operator_actions FROM anon, authenticated;
REVOKE SELECT ON public.operator_reparse FROM anon, authenticated;
REVOKE SELECT ON public.operator_reports FROM anon, authenticated;
REVOKE SELECT ON public.operator_rewards FROM anon, authenticated;
REVOKE SELECT ON public.session_summaries FROM anon, authenticated;
REVOKE SELECT ON public.signal_prompts FROM anon, authenticated;
REVOKE SELECT ON public.snapshot_submissions FROM anon, authenticated;
REVOKE SELECT ON public.source_attestations FROM anon, authenticated;
REVOKE SELECT ON public.subscriptions FROM anon, authenticated;
REVOKE SELECT ON public.webhook_events FROM anon, authenticated;

-- 2. Function search_path: pin to prevent schema injection.
ALTER FUNCTION public.update_operator_reports_updatedated_at()
  SET search_path = public, extensions;
ALTER FUNCTION public.compute_board_ranks(p_operator_id uuid, p_aa_yield numeric, p_hcm_yield numeric, p_codex_yield numeric)
  SET search_path = public, extensions;
ALTER FUNCTION public.create_reparse_with_action(
  p_operator_id uuid, p_codename_at_time text, p_snapshot_date date,
  p_original_input bigint, p_original_cache_write bigint, p_original_yield numeric,
  p_original_rank integer, p_original_class text,
  p_aa_input bigint, p_aa_cache_write bigint, p_aa_yield numeric, p_aa_rank integer, p_aa_class text, p_aa_leverage numeric, p_aa_velocity numeric,
  p_hcm_input bigint, p_hcm_cache_write bigint, p_hcm_yield numeric, p_hcm_rank integer, p_hcm_class text, p_hcm_leverage numeric, p_hcm_velocity numeric,
  p_codex_input bigint, p_codex_cache_write bigint, p_codex_yield numeric, p_codex_rank integer, p_codex_class text, p_codex_leverage numeric, p_codex_velocity numeric,
  p_chosen_ratio text, p_chosen_yield numeric, p_chosen_rank integer, p_reason text, p_actor text
) SET search_path = public, extensions;

-- 3. Move extensions from public to extensions schema (Supabase best practice).
DROP EXTENSION IF EXISTS vector CASCADE;
CREATE EXTENSION vector SCHEMA extensions;
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION pg_net SCHEMA extensions;
