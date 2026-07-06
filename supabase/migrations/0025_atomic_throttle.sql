-- 0025_atomic_throttle.sql — fix the throttle TOCTOU race.
--
-- The per-device throttle (gates.ts:throttleGate) reads a pre-fetched count
-- then decides, so N concurrent requests sharing one snapshotted count all
-- pass (effective cap = count + inflight). This migration adds an atomic
-- throttle check INSIDE the materialize_verified_snapshot RPC, so the count
-- is read and enforced in the same transaction as the insert.
--
-- The RPC already runs in a single transaction. Adding a count check at the
-- top of the RPC body makes it atomic: the count is read with the same
-- transactional visibility as the insert, so concurrent requests can't all
-- see the same pre-insert count.
--
-- Note: this is a defense-in-depth check. The gate-chain throttle (Gate 3)
-- stays as-is for the no-store/test path. The RPC check is the authoritative
-- one for the production path.
--
-- ⚠️ APPLY VIA `supabase db query --linked` OR the dashboard SQL editor — NEVER
--    `supabase db push` (re-runs ALL numbered migrations = catastrophic).
--
-- This migration:
--   1. DROPs both existing overloads (0013 without p_platform, 0015 with p_platform)
--   2. CREATEs a single new function with the 0015 signature + the throttle check
--   3. REVOKEs public access + GRANTs to service_role only

-- ── 1. Drop ALL existing overloads ───────────────────────────────────────────
-- There may be up to 3 overloads in the live DB:
--   (a) 0013's original (31 args, no p_platform)
--   (b) 0015's replacement (32 args, p_platform at end)
--   (c) the BAD 0025 overload (31 args, wrong types: integer class_tier,
--       numeric cross_thread/throughput, integer total_messages, no
--       p_submitted_at, p_platform in position 16, returns text)
--       — created by the first version of this migration if it was applied.
--       The REVOKE in that version failed, so this orphan exists but nothing
--       calls it. We drop all three, then create the correct one.

-- (a) 0013 overload (31 args, no p_platform):
DROP FUNCTION IF EXISTS public.materialize_verified_snapshot(
  uuid, uuid, text, timestamptz, timestamptz, text, text, jsonb, bigint, bigint, bigint, bigint,
  date, numeric, text,
  timestamptz, text, text, text, text, text,
  numeric, numeric, integer, numeric, bigint, numeric, numeric, integer, integer, bigint
);

-- (b) 0015 overload (32 args, with p_platform at end):
DROP FUNCTION IF EXISTS public.materialize_verified_snapshot(
  uuid, uuid, text, timestamptz, timestamptz, text, text, jsonb, bigint, bigint, bigint, bigint,
  date, numeric, text,
  timestamptz, text, text, text, text, text,
  numeric, numeric, integer, numeric, bigint, numeric, numeric, integer, integer, bigint,
  text
);

-- (c) BAD 0025 overload (31 args, wrong types — the orphan from the first
--     attempt at this migration). Signature: p_class_tier=integer,
--     p_platform in position 16 (after class_tier), no p_submitted_at,
--     p_cross_thread=numeric, p_token_throughput=numeric,
--     p_total_messages=integer, returns text.
DROP FUNCTION IF EXISTS public.materialize_verified_snapshot(
  uuid, uuid, text, timestamptz, timestamptz, text, text, jsonb, bigint, bigint, bigint, bigint,
  date, numeric, integer, text,
  text, text, text, text, text, text,
  numeric, numeric, numeric, numeric, numeric, numeric, numeric, integer, integer, integer
);

-- ── 2. Create the new function (0015 signature + throttle check) ────────────
CREATE FUNCTION public.materialize_verified_snapshot(
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
  v_throttle_count     INTEGER;
  v_throttle_cap       INTEGER := 24;   -- must match GATE_LIMITS.MAX_SUBMISSIONS_PER_WINDOW
  v_throttle_window_ms BIGINT  := 60000; -- must match THROTTLE_WINDOW_MS (60s)
  v_window_since       TIMESTAMPTZ;
BEGIN
  -- Atomic throttle check: count this device's submissions in the trailing
  -- window INSIDE the transaction. This closes the TOCTOU gap where N
  -- concurrent requests all read the same pre-fetched count from the app
  -- layer. The count here is read with the same transactional visibility as
  -- the insert below, so concurrent requests can't all see the same
  -- pre-insert count.
  v_window_since := now() - (v_throttle_window_ms || ' milliseconds')::interval;
  SELECT count(*) INTO v_throttle_count
  FROM public.snapshot_submissions
  WHERE device_id = p_device_id
    AND submitted_at >= v_window_since;

  IF v_throttle_count >= v_throttle_cap THEN
    RAISE EXCEPTION 'throttle_exceeded: device % submitted % times in the last 60s (cap %)',
      p_device_id, v_throttle_count, v_throttle_cap
      USING ERRCODE = 'P0001';
  END IF;

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

  -- ④ board read layer — live-upload UPSERT (§0.4), keyed per-platform (0015).
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

-- ── 3. Lock EXECUTE to service role only ────────────────────────────────────
-- Postgres grants EXECUTE to PUBLIC by default, which would expose this as an
-- anon/authenticated /rest/v1/rpc endpoint. The full argument-type signature
-- is required (functions resolve by signature).
REVOKE EXECUTE ON FUNCTION public.materialize_verified_snapshot(
  uuid, uuid, text, timestamptz, timestamptz, text, text, jsonb, bigint, bigint, bigint, bigint,
  date, numeric, text,
  timestamptz, text, text, text, text, text,
  numeric, numeric, integer, numeric, bigint, numeric, numeric, integer, integer, bigint,
  text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.materialize_verified_snapshot(
  uuid, uuid, text, timestamptz, timestamptz, text, text, jsonb, bigint, bigint, bigint, bigint,
  date, numeric, text,
  timestamptz, text, text, text, text, text,
  numeric, numeric, integer, numeric, bigint, numeric, numeric, integer, integer, bigint,
  text
) TO service_role;
