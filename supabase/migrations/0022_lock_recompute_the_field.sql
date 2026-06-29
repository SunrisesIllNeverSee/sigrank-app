-- 0022_lock_recompute_the_field.sql
-- Security fix flagged by `supabase db advisors` (lints 0028 + 0029): the
-- SECURITY DEFINER function public.recompute_the_field() (from 0019 — the nightly
-- "The Field" averager) was left EXECUTE-able by anon + authenticated via Supabase's
-- default privileges, i.e. ANYONE could trigger a Field recompute through
-- POST /rest/v1/rpc/recompute_the_field.
--
-- It is only meant to run from the pg_cron job ('recompute-the-field', 06:11 UTC),
-- which executes as postgres and bypasses grants; no app code calls it (verified).
-- Revoke the public API-role execute so it is no longer an exposed RPC. service_role
-- (the trusted server-only key) keeps its grant for any manual admin trigger.
--
-- 🔴 APPLY VIA `supabase db query --linked` OR the dashboard SQL editor — NEVER
--    `supabase db push` (re-runs ALL numbered migrations = catastrophic).

revoke execute on function public.recompute_the_field() from public, anon, authenticated;
