-- 0015_platform_slots.sql — per-(platform, window) board slots (FIX H)
--
-- WHY: metric_snapshots' unique key is (operator_id, snapshot_date, window_type)
-- with NO platform dimension, so an operator who submits claude AND codex for the
-- same window COLLIDES onto one row (last write wins) — the board can only ever
-- show one platform per operator. The signed payload already carries
-- `platform.primary` (lib/payload/schema.ts, validated at ingest); the server just
-- discarded it. This migration adds the column, backfills it, widens the unique
-- key to include it, and threads it through materialize_verified_snapshot so each
-- (operator, platform, window) gets its own slot.
--
-- ⚠️ PRE-APPLY (this touches a LIVE table with real ranked rows):
--   Run inside a transaction with a smoke BEFORE committing to prod:
--     BEGIN;
--       \i 0015_platform_slots.sql
--       -- expect: every metric_snapshots row now has a non-null platform;
--       -- row count UNCHANGED (backfill mutates, never deletes);
--       SELECT platform, count(*) FROM public.metric_snapshots GROUP BY 1 ORDER BY 2 DESC;
--       SELECT count(*) FILTER (WHERE platform IS NULL) AS null_platforms FROM public.metric_snapshots; -- expect 0
--     ROLLBACK;   -- inspect, then re-run with COMMIT once happy
--
-- NOTE: no DB CHECK on platform values on purpose — the app-layer Zod enum
-- (platformPrimaryEnum) validates platform.primary at ingest, and the backfill
-- pulls operators.primary_domain which legitimately includes 'multi'/'other'.

-- ───────────────────────────────────────────────────────────────────────────
-- ① add the column (nullable first, so the backfill can populate it)
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.metric_snapshots
  ADD COLUMN IF NOT EXISTS platform TEXT;

-- ② backfill existing rows from the operator's declared primary_domain
UPDATE public.metric_snapshots m
   SET platform = o.primary_domain
  FROM public.operators o
 WHERE m.operator_id = o.operator_id
   AND m.platform IS NULL
   AND o.primary_domain IS NOT NULL;

-- ③ any still-null (operator with no primary_domain) → the live default
UPDATE public.metric_snapshots
   SET platform = 'claude'
 WHERE platform IS NULL;

-- ④ lock it down: default for new rows + NOT NULL now that every row is filled
ALTER TABLE public.metric_snapshots
  ALTER COLUMN platform SET DEFAULT 'claude',
  ALTER COLUMN platform SET NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- ⑤ widen the unique key: (operator, date, window) → (+ platform)
--    Name-agnostic drop: find the existing unique constraint by its EXACT column
--    set (order-independent) so we don't depend on the auto-generated name.
-- ───────────────────────────────────────────────────────────────────────────
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

-- ⑥ board-read helper index for the per-(operator, platform) dedupe path
CREATE INDEX IF NOT EXISTS ix_metric_snapshots_operator_platform
  ON public.metric_snapshots (operator_id, platform);

-- ───────────────────────────────────────────────────────────────────────────
-- ⑦ thread platform through the materialize RPC.
--    p_platform is appended at the END of the arg list with a DEFAULT, so this is
--    a valid CREATE OR REPLACE (same name + existing arg types unchanged) and is
--    backward-compatible (a caller omitting it lands on 'claude'). The body is the
--    0013 RPC verbatim + the platform column in the metric_snapshots upsert and a
--    platform-aware ON CONFLICT target matching the new unique key above.
-- ───────────────────────────────────────────────────────────────────────────
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
BEGIN
  -- ③ append-only canonical row. unique_violation on snapshot_hash aborts the tx.
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

  -- ④ board read layer — live-upload UPSERT (§0.4), now keyed per-platform.
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
$$;

-- EXECUTE stays service-role only (inherited from 0013's grant; the signature
-- identity is unchanged for grant purposes — same name, same leading arg types).
