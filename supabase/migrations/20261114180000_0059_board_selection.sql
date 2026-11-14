-- 0059_board_selection.sql — database-side row selection for the board.
-- 2026-11-14 (Supabase egress block). NOT APPLIED: the owner approves applying it.
--
-- Why: getLeaderboard() used to page through ALL of metric_snapshots (~3,000
-- rows, ~3 MB of JSON), all of operators_public and all of rank_history, keep
-- one row per operator in JavaScript and throw the rest away. These functions
-- do the same selection inside Postgres so only the kept rows leave the
-- database. Nothing is deleted or changed: history stays in the tables, and
-- the per-operator history queries do not use these functions.
--
-- The rule below is the JS rule in lib/board/mappers.ts (pickPerKey /
-- operatorTotalCollapse / latestPerOperator / latestPerOperatorPlatform) and
-- lib/board/windows.ts (filterToWindow), written out clause by clause. The JS
-- twin is lib/board/selection.ts (selectSqlModel); the parity test and
-- scripts/verify-board-selection.mjs hold them together.
--
-- All objects are SECURITY INVOKER: they run with the caller's RLS and grants,
-- so the anon / service key the server client already uses sees exactly the
-- rows it could already read from the base tables.

BEGIN;

-- 1. Candidate rows: ghost-row guard + (optional) board-window filter ---------
--    p_prefer_window  the board's window enum ('7d','30d','90d','all_time') or NULL
--    p_window_filter  true = keep only that window_type (+ recency), as windowFilter does
--    p_max_age_days   days + buffer for the window, NULL = no recency (all_time/unknown)
--    p_operator_ids   restrict to these operators (claimedOnly), NULL = everyone
--    The recency reference ("now") is the newest snapshot_date among ALL rows of
--    the window, taken before the eligibility and operator restrictions, exactly
--    like filterToWindow's windowReference().
CREATE OR REPLACE FUNCTION public.board_candidates(
  p_prefer_window text,
  p_window_filter boolean,
  p_max_age_days  integer,
  p_operator_ids  uuid[] DEFAULT NULL
)
RETURNS SETOF public.metric_snapshots
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH ref AS (
    SELECT max(snapshot_date) AS d
    FROM public.metric_snapshots
    WHERE coalesce(p_window_filter, false)
      AND p_prefer_window IS NOT NULL
      AND window_type = p_prefer_window
  )
  SELECT m.*
  FROM public.metric_snapshots m
  CROSS JOIN ref
  WHERE (p_operator_ids IS NULL OR m.operator_id = ANY (p_operator_ids))
    -- isBoardEligible: input and output present and positive (migration 0028 rule)
    AND m.input_tokens  > 0
    AND m.output_tokens > 0
    AND (
      NOT coalesce(p_window_filter, false)
      OR p_prefer_window IS NULL
      OR (
        m.window_type = p_prefer_window
        AND (
          p_max_age_days IS NULL
          OR ref.d IS NULL
          OR (ref.d - m.snapshot_date) <= p_max_age_days
        )
      )
    )
$$;

-- 2. The row the board keeps, per operator (p_level='operator') or per
--    (operator, platform) (p_level='platform') ------------------------------
--    pickPerKey ladder, lowest bucket wins:
--      0  preferred window + platform 'multi'
--      1  preferred window + any other platform (incl. NULL)
--      2  other window     + platform 'multi'
--      3  anything else
--    Within a bucket the newest snapshot_date wins; same date -> larger
--    metric_snapshot_id (a total order). NULL platform folds under '∅' at the
--    platform level, as latestPerOperatorPlatform does.
--    Output order is deterministic: newest date first, then id.
CREATE OR REPLACE FUNCTION public.board_pick_snapshots(
  p_level         text,
  p_prefer_window text,
  p_window_filter boolean,
  p_max_age_days  integer,
  p_operator_ids  uuid[] DEFAULT NULL
)
RETURNS SETOF public.metric_snapshots
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT picked.*
  FROM (
    SELECT DISTINCT ON (
      c.operator_id,
      CASE WHEN p_level = 'platform' THEN coalesce(c.platform, '∅') END
    ) c.*
    FROM public.board_candidates(
      p_prefer_window, p_window_filter, p_max_age_days, p_operator_ids
    ) c
    ORDER BY
      c.operator_id,
      CASE WHEN p_level = 'platform' THEN coalesce(c.platform, '∅') END,
      (
        CASE WHEN p_prefer_window IS NOT NULL AND c.window_type = p_prefer_window
             THEN 0 ELSE 2 END
        + CASE WHEN c.platform = 'multi' THEN 0 ELSE 1 END
      ),
      c.snapshot_date DESC,
      c.metric_snapshot_id DESC NULLS LAST
  ) picked
  ORDER BY picked.snapshot_date DESC, picked.metric_snapshot_id DESC
$$;

-- 3. Distinct submitted platforms per operator (operatorTotal UI badge) -------
--    operatorTotalCollapse's platformsByOperator: non-null, non-empty platforms
--    over the candidate rows, newest submission first (platform name breaks
--    date ties; the JS order for same-date ties was arbitrary).
CREATE OR REPLACE FUNCTION public.board_operator_platforms(
  p_prefer_window text,
  p_window_filter boolean,
  p_max_age_days  integer,
  p_operator_ids  uuid[] DEFAULT NULL
)
RETURNS TABLE (operator_id uuid, platforms text[])
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT p.operator_id,
         array_agg(p.platform ORDER BY p.last_date DESC, p.platform ASC) AS platforms
  FROM (
    SELECT c.operator_id, c.platform, max(c.snapshot_date) AS last_date
    FROM public.board_candidates(
      p_prefer_window, p_window_filter, p_max_age_days, p_operator_ids
    ) c
    WHERE c.platform IS NOT NULL AND c.platform <> ''
    GROUP BY c.operator_id, c.platform
  ) p
  GROUP BY p.operator_id
$$;

-- 4. Latest rank_history row per operator -----------------------------------
--    getLeaderboard reads only the percentile of the newest row per operator.
--    Ties on snapshot_date cannot happen (PRIMARY KEY operator_id, snapshot_date).
CREATE OR REPLACE VIEW public.rank_history_latest
  WITH (security_invoker = true) AS
  SELECT DISTINCT ON (operator_id)
         operator_id, snapshot_date, global_rank, percentile
  FROM public.rank_history
  ORDER BY operator_id, snapshot_date DESC;

-- Same roles that already read the base tables through PostgREST.
REVOKE ALL ON FUNCTION public.board_candidates(text, boolean, integer, uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.board_pick_snapshots(text, text, boolean, integer, uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.board_operator_platforms(text, boolean, integer, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.board_candidates(text, boolean, integer, uuid[])
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.board_pick_snapshots(text, text, boolean, integer, uuid[])
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.board_operator_platforms(text, boolean, integer, uuid[])
  TO anon, authenticated, service_role;
GRANT SELECT ON public.rank_history_latest TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
