-- 0015_platform_slots.sql — per-(platform, window) board slots (FIX H)
ALTER TABLE public.metric_snapshots
  ADD COLUMN IF NOT EXISTS platform TEXT;

UPDATE public.metric_snapshots m
   SET platform = o.primary_domain
  FROM public.operators o
 WHERE m.operator_id = o.operator_id
   AND m.platform IS NULL
   AND o.primary_domain IS NOT NULL;

UPDATE public.metric_snapshots
   SET platform = 'claude'
 WHERE platform IS NULL;

ALTER TABLE public.metric_snapshots
  ALTER COLUMN platform SET DEFAULT 'claude',
  ALTER COLUMN platform SET NOT NULL;

DO $$
DECLARE
  c text;
BEGIN
  SELECT con.conname INTO c
    FROM pg_constraint con
   WHERE con.conrelid = 'public.metric_snapshots'::regclass
     AND con.contype = 'u'
     AND (
       SELECT array_agg(a.attname ORDER BY a.attname)
         FROM unnest(con.conkey) AS k(attnum)
         JOIN pg_attribute a
           ON a.attrelid = con.conrelid AND a.attnum = k.attnum
     ) = ARRAY['operator_id','snapshot_date','window_type']::name[]
   LIMIT 1;
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.metric_snapshots DROP CONSTRAINT %I', c);
  END IF;
END $$;

ALTER TABLE public.metric_snapshots
  ADD CONSTRAINT metric_snapshots_operator_date_window_platform_key
  UNIQUE (operator_id, snapshot_date, window_type, platform);

CREATE INDEX IF NOT EXISTS ix_metric_snapshots_operator_platform
  ON public.metric_snapshots (operator_id, platform);

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
  p_platform           TEXT        DEFAULT 'claude'
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_metric_snapshot_id UUID;
BEGIN
  INSERT INTO public.snapshot_submissions (
    operator_id, device_id, submitted_at, window_type, window_start, window_end,
    schema_version, ruleset_version, snapshot_hash, signature, payload_json,
    codename, tier, verification_tier, status,
    input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens
  ) VALUES (
    p_operator_id, p_device_id, COALESCE(p_submitted_at, now()),
    p_window_type, p_window_start, p_window_end,
    p_schema_version, p_ruleset_version, p_snapshot_hash, p_signature, p_payload_json,
    p_codename, p_tier, p_verification_tier, 'scored',
    p_input, p_output, p_cache_creation, p_cache_read
  );

  INSERT INTO public.metric_snapshots AS m (
    operator_id, snapshot_date, window_type, platform,
    input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens,
    signa_rate, class_tier, ruleset_version,
    compression_ratio, prompt_complexity, cross_thread, session_depth, token_throughput,
    signal_force, live_signa_rate, message_volume, account_age_days, total_messages,
    last_seen, movement_24h, movement_7d, generated_at
  ) VALUES (
    p_operator_id, p_snapshot_date, p_window_type, p_platform,
    p_input, p_output, p_cache_creation, p_cache_read,
    p_signa_rate, p_class_tier, p_ruleset_version,
    p_compression_ratio, p_prompt_complexity, p_cross_thread, p_session_depth, p_token_throughput,
    p_signal_force, p_live_signa_rate, p_message_volume, p_account_age_days, p_total_messages,
    now(), 0, 0, now()
  )
  ON CONFLICT (operator_id, snapshot_date, window_type, platform) DO UPDATE SET
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
$$;;
