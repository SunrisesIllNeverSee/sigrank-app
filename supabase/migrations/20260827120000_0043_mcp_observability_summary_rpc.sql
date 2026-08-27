-- Migration 0043: mcp_observability_summary RPC
--
-- Replaces the app-side aggregation that fetched up to 10K rows from
-- exchange_mcp_calls and aggregated in JavaScript. This function does the
-- aggregation in Postgres and returns a single JSON object, so the app
-- receives only the summary — not raw rows.
--
-- Fixes: https://github.com/SunrisesIllNeverSee/sigrank-app/issues/75

CREATE OR REPLACE FUNCTION mcp_observability_summary(
  p_since       TIMESTAMPTZ DEFAULT now() - interval '7 days',
  p_domain      TEXT         DEFAULT NULL,
  p_transport   TEXT         DEFAULT NULL,
  p_tool        TEXT         DEFAULT NULL,
  p_result      TEXT         DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  WITH filtered AS (
    SELECT
      server_id, transport, operation, tool_name, target_domain,
      auth_tier, result, duration_ms, idempotent_replay
    FROM public.exchange_mcp_calls
    WHERE occurred_at >= p_since
      AND (p_domain    IS NULL OR target_domain = p_domain)
      AND (p_transport IS NULL OR transport      = p_transport)
      AND (p_tool      IS NULL OR tool_name      = p_tool)
      AND (p_result    IS NULL OR result         = p_result)
  ),
  totals AS (
    SELECT
      count(*) AS total_calls,
      COALESCE(avg(duration_ms), 0)::int AS avg_duration_ms,
      count(*) FILTER (WHERE idempotent_replay = true) AS idempotent_replays
    FROM filtered
  ),
  by_server AS (
    SELECT COALESCE(jsonb_object_agg(server_id, cnt), '{}'::jsonb) AS agg
    FROM (SELECT server_id, count(*) AS cnt FROM filtered GROUP BY server_id) s
  ),
  by_transport AS (
    SELECT COALESCE(jsonb_object_agg(transport, cnt), '{}'::jsonb) AS agg
    FROM (SELECT transport, count(*) AS cnt FROM filtered GROUP BY transport) s
  ),
  by_operation AS (
    SELECT COALESCE(jsonb_object_agg(operation, cnt), '{}'::jsonb) AS agg
    FROM (SELECT operation, count(*) AS cnt FROM filtered GROUP BY operation) s
  ),
  by_tool AS (
    SELECT COALESCE(jsonb_object_agg(tool_name, cnt), '{}'::jsonb) AS agg
    FROM (SELECT tool_name, count(*) AS cnt FROM filtered WHERE tool_name IS NOT NULL GROUP BY tool_name) s
  ),
  by_domain AS (
    SELECT COALESCE(jsonb_object_agg(target_domain, cnt), '{}'::jsonb) AS agg
    FROM (SELECT target_domain, count(*) AS cnt FROM filtered WHERE target_domain IS NOT NULL GROUP BY target_domain) s
  ),
  by_result AS (
    SELECT COALESCE(jsonb_object_agg(result, cnt), '{}'::jsonb) AS agg
    FROM (SELECT result, count(*) AS cnt FROM filtered GROUP BY result) s
  ),
  by_auth_tier AS (
    SELECT COALESCE(jsonb_object_agg(auth_tier, cnt), '{}'::jsonb) AS agg
    FROM (SELECT auth_tier, count(*) AS cnt FROM filtered GROUP BY auth_tier) s
  ),
  funnel AS (
    SELECT
      count(*) FILTER (WHERE operation = 'initialize')  AS initializations,
      count(*) FILTER (WHERE operation = 'tools_list')  AS tool_list_requests,
      count(*) FILTER (WHERE operation = 'tools_call')  AS tool_calls,
      count(*) FILTER (WHERE tool_name IN ('exchange_get_signal', 'exchange_list_signals')) AS signals_viewed,
      count(*) FILTER (WHERE tool_name = 'exchange_create_attempt') AS attempts_created,
      count(*) FILTER (WHERE tool_name = 'exchange_submit_attempt') AS submissions_received,
      count(*) FILTER (WHERE tool_name IN ('exchange_propose', 'exchange_create_proposal_from_attempt')) AS proposals_created
    FROM filtered
  )
  SELECT jsonb_build_object(
    'total_calls',        t.total_calls,
    'by_server',          bs.agg,
    'by_transport',       bt.agg,
    'by_operation',       bo.agg,
    'by_tool',            bt2.agg,
    'by_domain',          bd.agg,
    'by_result',          br.agg,
    'by_auth_tier',       bat.agg,
    'avg_duration_ms',    CASE WHEN t.total_calls > 0 THEN t.avg_duration_ms ELSE NULL END,
    'idempotent_replays', t.idempotent_replays,
    'funnel', jsonb_build_object(
      'initializations',     f.initializations,
      'tool_list_requests',  f.tool_list_requests,
      'tool_calls',          f.tool_calls,
      'signals_viewed',      f.signals_viewed,
      'attempts_created',    f.attempts_created,
      'submissions_received', f.submissions_received,
      'proposals_created',   f.proposals_created
    )
  )
  FROM totals t
  CROSS JOIN by_server bs
  CROSS JOIN by_transport bt
  CROSS JOIN by_operation bo
  CROSS JOIN by_tool bt2
  CROSS JOIN by_domain bd
  CROSS JOIN by_result br
  CROSS JOIN by_auth_tier bat
  CROSS JOIN funnel f;
$$;

-- Grant execute to service_role (server-side calls only)
GRANT EXECUTE ON FUNCTION mcp_observability_summary TO service_role;

COMMENT ON FUNCTION mcp_observability_summary IS
  'SQL-side aggregation for MCP observability dashboard. Replaces app-side 10K-row fetch + JS aggregation (issue #75).';
