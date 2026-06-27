-- ============================================================================
-- 0017_drop_circles_indexes.sql — schema-drift fix + performance indexes
--
-- Three things in one migration:
--   (a) Drop the circles tables (circles, circle_members, circle_metric_snapshots)
--       + the challenges.circle_id FK column. These tables were dropped manually
--       from the live DB on 2026-06-25 (Circles feature dropped — fresh-slate
--       rebuild later) but no DROP migration existed, causing schema drift: a
--       fresh Supabase project would get 3 dead tables + a dead FK the app
--       doesn't use. This brings migrations in sync with the live DB.
--   (b) Drop the unused operators.privacy_level column (0008 comment says
--       "dropped per the public-by-default lock" but no DROP COLUMN existed).
--   (c) Add 3 missing indexes identified in the 2026-06-27 data-integrity audit:
--       metric_snapshots(operator_id), metric_snapshots(window_type),
--       operators(primary_domain). These prevent slow profile/board queries as
--       data grows.
--
-- Safe to re-run (all statements use IF EXISTS / IF NOT EXISTS).
-- Pre-existing data in circles tables (if any) will be lost — but the feature
-- was already dropped + tables removed from the live DB, so this is a no-op
-- on production. On a fresh project, the tables are empty.
-- ============================================================================

-- (a) Drop circles tables + challenges.circle_id FK.
--     Order: child tables first (FK dependencies), then parent, then column.

-- Drop the FK constraint on challenges.circle_id before dropping the column.
-- The constraint name is auto-generated; find + drop it dynamically.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname
    INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = con.conkey[1]
    JOIN pg_class ref ON ref.oid = con.confrelid
   WHERE rel.relname = 'challenges'
     AND att.attname = 'circle_id'
     AND ref.relname = 'circles';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE challenges DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;
END $$;

-- Drop the circle_id column from challenges (no longer used — circle_war format
-- is dormant with the Circles feature).
ALTER TABLE challenges DROP COLUMN IF EXISTS circle_id;

-- Drop circles tables (child → parent order for FK safety).
DROP TABLE IF EXISTS circle_metric_snapshots CASCADE;
DROP TABLE IF EXISTS circle_members CASCADE;
DROP TABLE IF EXISTS circles CASCADE;

-- (b) Drop the unused privacy_level column from operators.
--     0008_public_view.sql line 53: "privacy_level (dropped per the public-by-
--     default lock)" — the column is not in OPERATOR_COLUMNS and never read by
--     the app. The view already excludes it.
ALTER TABLE operators DROP COLUMN IF EXISTS privacy_level;

-- (c) Add 3 missing indexes (data-integrity audit P2 #2-4).
--     metric_snapshots is queried by operator_id (profile pages) and window_type
--     (board pages) but had no single-column indexes on either. operators is
--     queried by primary_domain (platform filtering) but had no index on it.

-- Profile pages: getOperator() queries metric_snapshots by operator_id.
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_operator_id
  ON metric_snapshots(operator_id);

-- Board pages: filterToWindow() filters by window_type.
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_window_type
  ON metric_snapshots(window_type);

-- Platform-filtered board queries: operators filtered by primary_domain.
CREATE INDEX IF NOT EXISTS idx_operators_primary_domain
  ON operators(primary_domain);

-- ============================================================================
-- End of 0017.
-- ============================================================================
