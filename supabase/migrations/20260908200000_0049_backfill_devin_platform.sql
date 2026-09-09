-- 0049_backfill_devin_platform.sql — relabel "other" → "devin" for Devin submissions
--
-- PROBLEM: "devin" was missing from PLATFORM_ENUM (MCP) and platformPrimaryEnum
-- (app) until 2026-09-08. Devin CLI submissions were mapped to "other" by
-- toPlatformPrimary() before signing, so both snapshot_submissions.payload_json
-- and metric_snapshots.platform carry "other" for Devin runs.
--
-- FIX: backfill "other" → "devin" for the affected operator. This migration is
-- OPERATOR-SPECIFIC because "other" is a legitimate platform for non-Devin
-- submissions from platforms not yet in the enum. Identify Devin submissions by
-- the operator_id (the only operator with Devin submissions as of 2026-09-08).
--
-- SAFETY: dry-run queries first (commented), then apply. The WHERE clause is
-- scoped to the specific operator_id so other operators' "other" submissions
-- are untouched.
--
-- Run:
--   supabase db push    (if using Supabase CLI)
--   or: \i 0049_backfill_devin_platform.sql
--
-- Verify before:
--   SELECT platform, count(*) FROM metric_snapshots
--   WHERE operator_id = 'cc66a42d-d3ea-4c63-a6bd-7ce481f67290'
--   GROUP BY 1 ORDER BY 2 DESC;
--   SELECT payload_json->'platform'->>'primary' as platform, count(*)
--   FROM snapshot_submissions
--   WHERE operator_id = 'cc66a42d-d3ea-4c63-a6bd-7ce481f67290'
--   GROUP BY 1 ORDER BY 2 DESC;

-- ① Backfill metric_snapshots.platform: "other" → "devin"
UPDATE public.metric_snapshots
   SET platform = 'devin'
 WHERE operator_id = 'cc66a42d-d3ea-4c63-a6bd-7ce481f67290'
   AND platform = 'other';

-- ② Backfill snapshot_submissions.payload_json.platform.primary: "other" → "devin"
--    The payload_json is JSONB; update the nested field in-place.
UPDATE public.snapshot_submissions
   SET payload_json = jsonb_set(
     payload_json,
     '{platform,primary}',
     '"devin"'::jsonb
   )
 WHERE operator_id = 'cc66a42d-d3ea-4c63-a6bd-7ce481f67290'
   AND payload_json->'platform'->>'primary' = 'other';

-- Verify after:
--   SELECT platform, count(*) FROM metric_snapshots
--   WHERE operator_id = 'cc66a42d-d3ea-4c63-a6bd-7ce481f67290'
--   GROUP BY 1 ORDER BY 2 DESC;
--   SELECT payload_json->'platform'->>'primary' as platform, count(*)
--   FROM snapshot_submissions
--   WHERE operator_id = 'cc66a42d-d3ea-4c63-a6bd-7ce481f67290'
--   GROUP BY 1 ORDER BY 2 DESC;
--   -- Expect: no "other" rows for this operator; "devin" count = former "other" count.
