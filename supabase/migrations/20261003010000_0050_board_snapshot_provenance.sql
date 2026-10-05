-- Link board rows to their exact accepted submission and recorded period.
-- Mode is an evidence-backed assessment of a submission, never a ratio alias.
ALTER TABLE public.snapshot_submissions
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS workflow_mode TEXT CHECK (workflow_mode IN ('hitl', 'agentic')),
  ADD COLUMN IF NOT EXISTS workflow_evidence_url TEXT,
  ADD COLUMN IF NOT EXISTS workflow_mode_version TEXT,
  ADD COLUMN IF NOT EXISTS mode_assessed_at TIMESTAMPTZ;

UPDATE public.snapshot_submissions
SET platform = coalesce(payload_json #>> '{platform,primary}', 'other')
WHERE platform IS NULL;

ALTER TABLE public.metric_snapshots
  ADD COLUMN IF NOT EXISTS source_submission_id UUID REFERENCES public.snapshot_submissions(submission_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS window_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS window_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS workflow_mode TEXT CHECK (workflow_mode IN ('hitl', 'agentic')),
  ADD COLUMN IF NOT EXISTS workflow_evidence_url TEXT,
  ADD COLUMN IF NOT EXISTS workflow_mode_version TEXT,
  ADD COLUMN IF NOT EXISTS mode_assessed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ix_metric_snapshots_source_submission
  ON public.metric_snapshots(source_submission_id);
CREATE INDEX IF NOT EXISTS ix_snapshot_submissions_public_history
  ON public.snapshot_submissions(operator_id, submitted_at DESC, submission_id DESC)
  WHERE status = 'scored';

-- Unique pillar/period matches only: ambiguous legacy records stay without a rate.
WITH matches AS (
  SELECT m.metric_snapshot_id, min(s.submission_id::text)::uuid AS submission_id,
         count(*) AS match_count
  FROM public.metric_snapshots m
  JOIN public.snapshot_submissions s
    ON s.operator_id = m.operator_id
   AND s.window_type = m.window_type
   AND s.window_end::date = m.snapshot_date
   AND s.status = 'scored'
   AND s.input_tokens IS NOT DISTINCT FROM m.input_tokens
   AND s.output_tokens IS NOT DISTINCT FROM m.output_tokens
   AND s.cache_creation_tokens IS NOT DISTINCT FROM m.cache_creation_tokens
   AND s.cache_read_tokens IS NOT DISTINCT FROM m.cache_read_tokens
   AND s.platform = m.platform
  WHERE m.source_submission_id IS NULL
  GROUP BY m.metric_snapshot_id
)
UPDATE public.metric_snapshots m
SET source_submission_id = s.submission_id,
    window_start = s.window_start,
    window_end = s.window_end
FROM matches x
JOIN public.snapshot_submissions s ON s.submission_id = x.submission_id
WHERE m.metric_snapshot_id = x.metric_snapshot_id AND x.match_count = 1;

CREATE OR REPLACE FUNCTION materialize_verified_snapshot(
  p_operator_id        UUID,
  p_device_id          UUID,
  p_window_type        TEXT,
  p_window_start       TIMESTAMPTZ,
  p_window_end         TIMESTAMPTZ,
  p_ruleset_version    TEXT,
  p_snapshot_hash      TEXT,
  p_payload_json       JSONB,
  p_input              BIGINT,
  p_output             BIGINT,
  p_cache_creation     BIGINT,
  p_cache_read         BIGINT,
  p_snapshot_date      DATE,
  p_signa_rate         NUMERIC,
  p_class_tier         TEXT,
  p_submitted_at       TIMESTAMPTZ DEFAULT NULL,
  p_schema_version     TEXT        DEFAULT NULL,
  p_signature          TEXT        DEFAULT NULL,
  p_codename           TEXT        DEFAULT NULL,
  p_tier               TEXT        DEFAULT NULL,
  p_verification_tier  TEXT        DEFAULT 'verified',
  p_compression_ratio  NUMERIC     DEFAULT NULL,
  p_prompt_complexity  NUMERIC     DEFAULT NULL,
  p_cross_thread       INTEGER     DEFAULT NULL,
  p_session_depth      NUMERIC     DEFAULT NULL,
  p_token_throughput   BIGINT      DEFAULT NULL,
  p_signal_force       NUMERIC     DEFAULT NULL,
  p_live_signa_rate    NUMERIC     DEFAULT NULL,
  p_message_volume     INTEGER     DEFAULT NULL,
  p_account_age_days   INTEGER     DEFAULT NULL,
  p_total_messages     BIGINT      DEFAULT NULL,
  p_platform           TEXT        DEFAULT 'claude'   -- 0015: per-platform slot
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_metric_snapshot_id UUID;
  v_submission_id UUID;
BEGIN
  -- ③ append-only canonical row. unique_violation on snapshot_hash aborts the tx.
  INSERT INTO public.snapshot_submissions (
    operator_id, device_id, submitted_at, window_type, window_start, window_end, platform,
    schema_version, ruleset_version, snapshot_hash, signature, payload_json,
    codename, tier, verification_tier, status,
    input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens
  ) VALUES (
    p_operator_id, p_device_id, COALESCE(p_submitted_at, now()),
    p_window_type, p_window_start, p_window_end, p_platform,
    p_schema_version, p_ruleset_version, p_snapshot_hash, p_signature, p_payload_json,
    p_codename, p_tier, p_verification_tier, 'scored',
    p_input, p_output, p_cache_creation, p_cache_read
  ) RETURNING submission_id INTO v_submission_id;

  -- ④ board read layer — live-upload UPSERT (§0.4), now keyed per-platform.
  INSERT INTO public.metric_snapshots AS m (
    operator_id, snapshot_date, window_type, platform,
    source_submission_id, window_start, window_end,
    input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens,
    signa_rate, class_tier, ruleset_version,
    compression_ratio, prompt_complexity, cross_thread, session_depth, token_throughput,
    signal_force, live_signa_rate, message_volume, account_age_days, total_messages,
    last_seen, movement_24h, movement_7d, generated_at
  ) VALUES (
    p_operator_id, p_snapshot_date, p_window_type, p_platform,
    v_submission_id, p_window_start, p_window_end,
    p_input, p_output, p_cache_creation, p_cache_read,
    p_signa_rate, p_class_tier, p_ruleset_version,
    p_compression_ratio, p_prompt_complexity, p_cross_thread, p_session_depth, p_token_throughput,
    p_signal_force, p_live_signa_rate, p_message_volume, p_account_age_days, p_total_messages,
    now(), 0, 0, now()
  )
  ON CONFLICT (operator_id, snapshot_date, window_type, platform) DO UPDATE SET
    source_submission_id = EXCLUDED.source_submission_id,
    window_start         = EXCLUDED.window_start,
    window_end           = EXCLUDED.window_end,
    workflow_mode        = NULL,
    workflow_evidence_url = NULL,
    workflow_mode_version = NULL,
    mode_assessed_at     = NULL,
    input_tokens          = EXCLUDED.input_tokens,
    output_tokens         = EXCLUDED.output_tokens,
    cache_creation_tokens = EXCLUDED.cache_creation_tokens,
    cache_read_tokens     = EXCLUDED.cache_read_tokens,
    signa_rate            = EXCLUDED.signa_rate,
    class_tier            = EXCLUDED.class_tier,
    ruleset_version       = EXCLUDED.ruleset_version,
    compression_ratio     = COALESCE(EXCLUDED.compression_ratio, m.compression_ratio),
    prompt_complexity     = COALESCE(EXCLUDED.prompt_complexity, m.prompt_complexity),
    cross_thread          = COALESCE(EXCLUDED.cross_thread,       m.cross_thread),
    session_depth         = COALESCE(EXCLUDED.session_depth,      m.session_depth),
    token_throughput      = COALESCE(EXCLUDED.token_throughput,   m.token_throughput),
    signal_force          = COALESCE(EXCLUDED.signal_force,       m.signal_force),
    live_signa_rate       = COALESCE(EXCLUDED.live_signa_rate,    m.live_signa_rate),
    message_volume        = COALESCE(EXCLUDED.message_volume,     m.message_volume),
    account_age_days      = COALESCE(EXCLUDED.account_age_days,   m.account_age_days),
    total_messages        = COALESCE(EXCLUDED.total_messages,     m.total_messages),
    last_seen             = now(),
    generated_at          = now()
  RETURNING m.metric_snapshot_id INTO v_metric_snapshot_id;

  RETURN v_metric_snapshot_id;
END;
$$;

-- Only a service-role write to the private submission can assign a mode.
-- The public board projection follows the source submission exactly.
CREATE OR REPLACE FUNCTION public.sync_board_workflow_assessment()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.workflow_mode = 'agentic' AND
     (NEW.workflow_evidence_url IS NULL OR NEW.workflow_evidence_url !~ '^https://' OR
      NEW.workflow_mode_version IS NULL OR NEW.mode_assessed_at IS NULL) THEN
    RAISE EXCEPTION 'agentic assessment requires evidence URL, version, and assessment date';
  END IF;
  UPDATE public.metric_snapshots
  SET workflow_mode = NEW.workflow_mode,
      workflow_evidence_url = NEW.workflow_evidence_url,
      workflow_mode_version = NEW.workflow_mode_version,
      mode_assessed_at = NEW.mode_assessed_at
  WHERE source_submission_id = NEW.submission_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_board_workflow_assessment ON public.snapshot_submissions;
CREATE TRIGGER sync_board_workflow_assessment
AFTER UPDATE OF workflow_mode, workflow_evidence_url, workflow_mode_version, mode_assessed_at
ON public.snapshot_submissions
FOR EACH ROW EXECUTE FUNCTION public.sync_board_workflow_assessment();
REVOKE ALL ON FUNCTION public.sync_board_workflow_assessment() FROM PUBLIC, anon, authenticated;
