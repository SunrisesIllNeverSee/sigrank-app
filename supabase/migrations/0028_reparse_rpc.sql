-- ============================================================================
-- 0028_reparse_rpc.sql — Atomic reparse + action RPC + DB-side rank computation
--
-- WHY:
-- 1. saveReparseDecision in the CRM + Calculate app previously used a
--    compensating-delete strategy (insert reparse, insert action, delete
--    reparse if action fails). If the compensating delete itself failed, an
--    orphaned reparse row would persist with no audit-trail action. The
--    create_reparse_with_action RPC does both inserts inside a single
--    Postgres transaction — either both commit or neither does.
--
-- 2. computeRanks previously fetched ALL metric_snapshots rows and computed
--    yields + ranks in JS. compute_board_ranks does it DB-side in a single
--    round-trip using DISTINCT ON + window functions. cache_creation_tokens
--    is included in the temp table so the original_rank Codex-gap check reads
--    it directly — no join back to metric_snapshots.
--
-- See: Devins_Plans/gtm/launch/crm/calculate/app/lib/actions.ts
-- ============================================================================

-- ============================================================================
-- create_reparse_with_action — atomic insert of operator_reparse + operator_actions
-- ============================================================================
-- Returns the generated operator_reparse.id on success; raises on failure.
-- Both inserts commit in the same transaction (implicit in plpgsql — if any
-- statement raises, the whole function rolls back). No orphaned rows possible.
CREATE OR REPLACE FUNCTION create_reparse_with_action(
  p_operator_id        UUID,
  p_codename_at_time   TEXT,
  p_snapshot_date      DATE,
  p_original_input        BIGINT,
  p_original_cache_write  BIGINT,
  p_original_yield        NUMERIC,
  p_original_rank         INTEGER,
  p_original_class        TEXT,
  p_aa_input        BIGINT,
  p_aa_cache_write  BIGINT,
  p_aa_yield        NUMERIC,
  p_aa_rank         INTEGER,
  p_aa_class        TEXT,
  p_aa_leverage     NUMERIC,
  p_aa_velocity     NUMERIC,
  p_hcm_input        BIGINT,
  p_hcm_cache_write  BIGINT,
  p_hcm_yield        NUMERIC,
  p_hcm_rank         INTEGER,
  p_hcm_class        TEXT,
  p_hcm_leverage     NUMERIC,
  p_hcm_velocity     NUMERIC,
  p_codex_input        BIGINT,
  p_codex_cache_write  BIGINT,
  p_codex_yield        NUMERIC,
  p_codex_rank         INTEGER,
  p_codex_class        TEXT,
  p_codex_leverage     NUMERIC,
  p_codex_velocity     NUMERIC,
  p_chosen_ratio    TEXT,
  p_chosen_yield    NUMERIC,
  p_chosen_rank     INTEGER,
  p_reason          TEXT,
  p_actor           TEXT
) RETURNS UUID AS $$
DECLARE
  v_reparse_id UUID;
BEGIN
  -- Step 1: insert the reparse row, capturing the generated id.
  INSERT INTO operator_reparse (
    operator_id, codename_at_time, snapshot_date,
    original_input, original_cache_write, original_yield, original_rank, original_class,
    aa_input, aa_cache_write, aa_yield, aa_rank, aa_class, aa_leverage, aa_velocity,
    hcm_input, hcm_cache_write, hcm_yield, hcm_rank, hcm_class, hcm_leverage, hcm_velocity,
    codex_input, codex_cache_write, codex_yield, codex_rank, codex_class, codex_leverage, codex_velocity,
    chosen_ratio, chosen_yield, chosen_rank, reason, actor
  ) VALUES (
    p_operator_id, p_codename_at_time, p_snapshot_date,
    p_original_input, p_original_cache_write, p_original_yield, p_original_rank, p_original_class,
    p_aa_input, p_aa_cache_write, p_aa_yield, p_aa_rank, p_aa_class, p_aa_leverage, p_aa_velocity,
    p_hcm_input, p_hcm_cache_write, p_hcm_yield, p_hcm_rank, p_hcm_class, p_hcm_leverage, p_hcm_velocity,
    p_codex_input, p_codex_cache_write, p_codex_yield, p_codex_rank, p_codex_class, p_codex_leverage, p_codex_velocity,
    p_chosen_ratio, p_chosen_yield, p_chosen_rank, p_reason, p_actor
  )
  RETURNING id INTO v_reparse_id;

  -- Step 2: insert the audit-trail action. If this fails, plpgsql aborts the
  -- whole function and the reparse insert above is rolled back. No orphaned
  -- rows are possible.
  INSERT INTO operator_actions (
    operator_id, codename_at_time, action_type, action_data, actor
  ) VALUES (
    p_operator_id,
    p_codename_at_time,
    'reparse',
    jsonb_build_object(
      'reparse_id', v_reparse_id,
      'chosen_ratio', p_chosen_ratio,
      'yield', p_chosen_yield,
      'reason', p_reason
    ),
    p_actor
  );

  RETURN v_reparse_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke execute from public/anon/authenticated; only service role (which
-- bypasses RLS and is the caller) can invoke. SECURITY DEFINER runs with the
-- function owner's privileges, so we lock down who can call it.
REVOKE EXECUTE ON FUNCTION create_reparse_with_action FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- compute_board_ranks — DB-side rank computation for reparse candidate yields
-- ============================================================================
-- Given an operator_id and 3 candidate yields (aa, hcm, codex), returns one
-- row per ratio key with: key, rank, total, original_rank.
--
-- Yield = leverage * velocity = (cache_read / input) * (output / input).
-- Window pinned to '30d' (sigrank-app BOARD_WINDOW_DEFAULT). Operators with
-- cache_creation = 0 (Codex gap) are excluded from the board UNLESS they are
-- the operator being re-parsed (their yield is replaced by the candidate).
--
-- For each candidate yield, the operator's original yield is replaced by the
-- candidate, the board is re-sorted descending, and the operator's position
-- is their rank. original_rank is the operator's position with their
-- unmodified snapshot yield (NULL if they're not on the board or are a
-- Codex-gap operator).
--
-- If the operator being re-parsed has no 30d snapshot at all, they are not
-- in _board_yields. In that case we virtually insert them with the candidate
-- yield, so total = board_size + 1. This matches the JS fallback's behavior
-- (which pushes the operator into the yields array before ranking).
CREATE OR REPLACE FUNCTION compute_board_ranks(
  p_operator_id  UUID,
  p_aa_yield     NUMERIC,
  p_hcm_yield    NUMERIC,
  p_codex_yield  NUMERIC
) RETURNS TABLE (
  key            TEXT,
  rank           INTEGER,
  total          INTEGER,
  original_rank  INTEGER
) AS $$
DECLARE
  v_total          INTEGER;
  v_original_rank  INTEGER;
  v_op_on_board    BOOLEAN;
BEGIN
  -- Build the board: latest 30d snapshot per operator with a computable yield.
  -- DISTINCT ON (operator_id) + ORDER BY operator_id, snapshot_date DESC keeps
  -- the latest row per operator. Operators with cache_creation = 0 (Codex gap)
  -- are excluded unless they are the operator being re-parsed.
  -- cache_creation_tokens is included in the temp table so the original_rank
  -- Codex-gap check can read it directly — no join back to metric_snapshots.
  CREATE TEMP TABLE _board_yields ON COMMIT DROP AS
  SELECT
    s.operator_id,
    s.cache_creation_tokens,
    (COALESCE(s.cache_read_tokens, 0)::numeric / s.input_tokens::numeric)
      * (s.output_tokens::numeric / s.input_tokens::numeric) AS yield
  FROM (
    SELECT DISTINCT ON (operator_id)
      operator_id, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens
    FROM metric_snapshots
    WHERE window_type = '30d'
      AND input_tokens IS NOT NULL AND input_tokens > 0
      AND output_tokens IS NOT NULL AND output_tokens > 0
    ORDER BY operator_id, snapshot_date DESC
  ) s
  WHERE s.cache_creation_tokens <> 0 OR s.operator_id = p_operator_id;

  v_total := (SELECT COUNT(*) FROM _board_yields);

  -- Check whether the operator being re-parsed is already on the board.
  -- If not (no 30d snapshot), we virtually insert them for ranking, so the
  -- effective total is board_size + 1. This matches the JS fallback.
  v_op_on_board := EXISTS(SELECT 1 FROM _board_yields WHERE operator_id = p_operator_id);
  IF NOT v_op_on_board THEN
    v_total := v_total + 1;
  END IF;

  -- Original rank: where the operator sits with their unmodified snapshot yield.
  -- NULL if the operator isn't on the board, OR if they're a Codex-gap operator
  -- (cache_creation = 0) — sigrank-app nulls yield for those operators, so we
  -- must null their original_rank too. cache_creation_tokens is read directly
  -- from _board_yields (no join back to metric_snapshots needed).
  SELECT rn INTO v_original_rank
  FROM (
    SELECT
      operator_id,
      ROW_NUMBER() OVER (ORDER BY yield DESC) AS rn,
      cache_creation_tokens
    FROM _board_yields
  ) ranked
  WHERE ranked.operator_id = p_operator_id
    AND ranked.cache_creation_tokens <> 0;  -- Codex-gap → null original_rank

  -- For each candidate yield, compute the operator's rank when their yield is
  -- replaced by the candidate. rank = 1 + count of operators with strictly
  -- greater yield (where the operator's own row uses the candidate yield).
  -- If the operator is not on the board, ALL board members are "others", so
  -- the count is over the full board — correct for a virtual insertion.
  RETURN QUERY
  WITH candidates(key, y) AS (
    SELECT 'aa', p_aa_yield
    UNION ALL SELECT 'hcm', p_hcm_yield
    UNION ALL SELECT 'codex', p_codex_yield
  )
  SELECT
    c.key,
    -- 1 + number of operators with a yield strictly greater than the candidate.
    -- The operator's own row (if on the board) contributes the candidate yield,
    -- so it's never counted as "greater than itself". If the operator is NOT on
    -- the board, all board members are counted as "others" — correct.
    (1 + COUNT(*) FILTER (
       WHERE b.operator_id <> p_operator_id AND b.yield > c.y
    ))::INTEGER AS rank,
    v_total AS total,
    v_original_rank AS original_rank
  FROM candidates c
  CROSS JOIN _board_yields b
  GROUP BY c.key, c.y, v_total, v_original_rank;

  DROP TABLE _board_yields;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION compute_board_ranks FROM PUBLIC, anon, authenticated;
