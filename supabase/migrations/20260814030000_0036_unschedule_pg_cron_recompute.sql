-- 0036_unschedule_pg_cron_recompute.sql
--
-- Unschedules the 3 daily recompute pg_cron jobs. The Vercel Workflow
-- (workflows/daily-recompute.ts) now owns the daily recompute schedule,
-- triggered by Vercel Cron at 06:11 UTC via /api/cron/recompute.
--
-- Without this migration, both pg_cron AND the Vercel Workflow fire the
-- same RPCs at the same time (06:11 UTC), causing concurrent execution
-- of recompute_the_field / refresh_system_stats / backfill_rank_history.
-- The RPCs have no advisory lock, so concurrent runs risk race conditions
-- and inconsistent board state.
--
-- Jobs being unscheduled (originally scheduled in 0019/0024/0025/0031):
--   - recompute-the-field   (06:11 UTC)
--   - refresh-system-stats  (06:12 UTC)
--   - backfill-rank-history (06:13 UTC)
--
-- The RPC functions themselves are NOT dropped — they are still called by
-- the Vercel Workflow via the service-role client. Only the pg_cron
-- schedules are removed.
--
-- cron.unschedule is idempotent: if the job doesn't exist it returns NULL
-- rather than raising an error, so this migration is safe to re-run.
--
-- 🔴 APPLY VIA `supabase db query --linked` OR the dashboard SQL editor — NEVER
--    `supabase db push` (re-runs ALL numbered migrations = catastrophic).

select cron.unschedule('recompute-the-field');
select cron.unschedule('refresh-system-stats');
select cron.unschedule('backfill-rank-history');
