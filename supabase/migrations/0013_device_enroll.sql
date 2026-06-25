-- ============================================================================
-- 0013_device_enroll.sql — D7 ingest: connect-code device enrollment, submission
--                          verification tier, dedup backstop, and the atomic
--                          verified-snapshot materialization RPC.
--
-- Depends on (ALL already applied to prod):
--   operators                         (0001)
--   devices                           (0001)
--   snapshot_submissions              (0001 base + 0003 audit + 0005 pillars)
--   metric_snapshots                  (0001 base + 0005 pillars)
--   operator_accounts + private.auth_operator_id()  (0009 / 0011)
--   0012_identity_locks (OAuth provider-sync lock-on-edit)  ← prev number; this is 0013.
--
-- This migration is ADDITIVE ONLY and SAFE TO RE-RUN:
--   CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT
--   EXISTS / CREATE OR REPLACE FUNCTION. It does NOT recreate operator_accounts
--   or auth_operator_id() (would collide and re-open the 0011 advisor hardening).
--
-- Security posture (matches the 0009/0011 convention, confirmed by adversarial
-- review 2026-06-25): the materialize RPC is search_path-pinned + execution-locked
-- to service_role; device_enroll_codes is RLS-default-deny + table-grants revoked.
--
-- ⚠️ PRE-APPLY CHECK (review P3): the partial-unique index on snapshot_hash fails
-- to BUILD if prod already holds duplicate non-null hashes. Before applying, run:
--   SELECT snapshot_hash, count(*) FROM snapshot_submissions
--    WHERE snapshot_hash IS NOT NULL AND snapshot_hash <> '' GROUP BY 1 HAVING count(*) > 1;
-- Expect zero rows (the route persists nothing today; the board is fed via
-- metric_snapshots seeds). If non-zero, dedup first.
--
-- Scope: only genuinely-new objects for D7 (design doc §4.1 + §6.2).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- (a) CONNECT CODES — web-minted, single-use, short-lived device enrollment codes.
--     Format is enforced in the mint endpoint (§4.2), not the column:
--       SIGR-XXXXX-XXXXX-XXXXX  (Crockford base32, ~75-bit, 10-min expiry,
--       single-use, one live code per operator, per-IP mint cap).
--     A code is VALID iff  consumed_at IS NULL AND expires_at > now().
--     Redemption (§4.3) sets consumed_at + consumed_device_id in the SAME
--     transaction that inserts the devices row.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_enroll_codes (
  code               TEXT PRIMARY KEY,
  operator_id        UUID NOT NULL REFERENCES operators(operator_id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at         TIMESTAMPTZ NOT NULL,            -- created_at + 10 min (set by mint)
  consumed_at        TIMESTAMPTZ,                     -- set when redeemed (single-use)
  consumed_device_id UUID REFERENCES devices(device_id),
  created_ip         TEXT                             -- best-effort, for the per-IP mint cap
);
CREATE INDEX IF NOT EXISTS idx_enroll_codes_operator ON device_enroll_codes(operator_id);
-- Fast "does this operator already have a live code?" check (§4.2 rate-limit).
CREATE INDEX IF NOT EXISTS idx_enroll_codes_live
  ON device_enroll_codes(operator_id, expires_at)
  WHERE consumed_at IS NULL;

-- RLS: service-role only. The endpoints use the service-role client (which bypasses
-- RLS by design); no public policy is granted, so no anon/auth client can read codes.
ALTER TABLE device_enroll_codes ENABLE ROW LEVEL SECURITY;
-- Defense-in-depth for a secrets-bearing table (single-use enrollment codes): revoke
-- table privileges from anon/authenticated outright rather than relying solely on the
-- empty-policy default-deny. service_role bypasses RLS (BYPASSRLS), so mint/enroll work.
REVOKE ALL ON device_enroll_codes FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- (b) verification_tier on submissions — stored decision so the materialize gate
--     (§6.3) and any later audit can read the tier off the row.
--       verified | flagged | unverified
-- ----------------------------------------------------------------------------
ALTER TABLE snapshot_submissions
  ADD COLUMN IF NOT EXISTS verification_tier TEXT;

-- ----------------------------------------------------------------------------
-- (c) DEFENSE-IN-DEPTH: a duplicate snapshot_hash can never be persisted twice.
--     Backstops the dedup gate (which can race under concurrency). Partial-unique
--     on the non-null/non-empty hash so legacy/empty rows are unaffected. A second
--     insert with the same hash raises unique_violation → the route returns 422.
--     (See the PRE-APPLY CHECK in the header re: building on a populated table.)
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_submissions_snapshot_hash
  ON snapshot_submissions (snapshot_hash)
  WHERE snapshot_hash IS NOT NULL AND snapshot_hash <> '';

-- ----------------------------------------------------------------------------
-- (d) materialize_verified_snapshot(...) — the ATOMIC verified-path RPC (§6.2).
--
-- A plpgsql function body is a single transaction, so the append-only
-- snapshot_submissions INSERT and the board-layer metric_snapshots UPSERT either
-- both commit or both roll back. Called ONLY on the verified+accept path; the
-- non-verified path inserts the submission row directly (status 'validated') and
-- does NOT call this function (§6.3).
--
-- Live-upload model (§0.4): newer numbers for the same
-- (operator_id, snapshot_date, window_type) cell UPSERT the standing board row;
-- an exact-hash replay hits uq_submissions_snapshot_hash → unique_violation →
-- the whole tx aborts → the route maps it to 422 duplicate_snapshot.
--
-- SECURITY (review P2): the function lives in `public` because the app calls it via
-- supabase-js .rpc() which routes through PostgREST (PostgREST only exposes `public`;
-- a `private` function would be uncallable). To avoid the auto-exposed anon RPC
-- surface, EXECUTE is REVOKEd from public/anon/authenticated and GRANTed only to
-- service_role (below). search_path is pinned empty with schema-qualified refs
-- (matches 0009/0011) to clear the function_search_path_mutable advisor + close the
-- search-path-injection surface. SECURITY INVOKER (default): the caller is the
-- service-role client (full table access, bypasses RLS).
--
-- The board ranks by Υ Yield recomputed ON READ from the 4 raw pillar columns,
-- so cascade values (yield_/velocity/leverage/snr/dev10x) are deliberately NOT
-- stored here — storing them would double-source the truth.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION materialize_verified_snapshot(
  -- snapshot_submissions row (constraint-complete) -----------------------------
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
  -- metric_snapshots row (board read layer) -----------------------------------
  p_snapshot_date      DATE,
  p_signa_rate         NUMERIC,
  p_class_tier         TEXT,
  -- optional / nullable fields (defaults so callers can omit) ------------------
  p_submitted_at       TIMESTAMPTZ DEFAULT NULL,   -- COALESCE'd to now()
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
  p_total_messages     BIGINT      DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = ''                       -- P2 (review): pin; matches 0009/0011 convention
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

  -- ④ board read layer — live-upload UPSERT (§0.4). Aliased AS m so DO UPDATE can
  -- reference the existing row unambiguously under search_path=''.
  INSERT INTO public.metric_snapshots AS m (
    operator_id, snapshot_date, window_type,
    input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens,
    signa_rate, class_tier, ruleset_version,
    compression_ratio, prompt_complexity, cross_thread, session_depth, token_throughput,
    signal_force, live_signa_rate, message_volume, account_age_days, total_messages,
    last_seen, movement_24h, movement_7d, generated_at
  ) VALUES (
    p_operator_id, p_snapshot_date, p_window_type,
    p_input, p_output, p_cache_creation, p_cache_read,
    p_signa_rate, p_class_tier, p_ruleset_version,
    p_compression_ratio, p_prompt_complexity, p_cross_thread, p_session_depth, p_token_throughput,
    p_signal_force, p_live_signa_rate, p_message_volume, p_account_age_days, p_total_messages,
    now(), 0, 0, now()
  )
  ON CONFLICT (operator_id, snapshot_date, window_type) DO UPDATE SET
    -- load-bearing (the board ranks on these): newer numbers WIN — the §0.4 live-upload intent.
    input_tokens          = EXCLUDED.input_tokens,
    output_tokens         = EXCLUDED.output_tokens,
    cache_creation_tokens = EXCLUDED.cache_creation_tokens,
    cache_read_tokens     = EXCLUDED.cache_read_tokens,
    signa_rate            = EXCLUDED.signa_rate,
    class_tier            = EXCLUDED.class_tier,
    ruleset_version       = EXCLUDED.ruleset_version,
    -- display-only: COALESCE-preserve (review P3) so an omitting caller can never
    -- null a previously-populated cell.
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
    -- movement_24h / movement_7d deliberately NOT updated — no baseline this slice (§6.2).
  RETURNING m.metric_snapshot_id INTO v_metric_snapshot_id;

  RETURN v_metric_snapshot_id;
END;
$$;

-- P2 (review): lock EXECUTE to the service role. Postgres grants EXECUTE to PUBLIC by
-- default, which would expose this as an anon/authenticated /rest/v1/rpc endpoint. The
-- full argument-type signature is required (functions resolve by signature).
REVOKE EXECUTE ON FUNCTION materialize_verified_snapshot(
  uuid, uuid, text, timestamptz, timestamptz, text, text, jsonb, bigint, bigint, bigint, bigint,
  date, numeric, text,
  timestamptz, text, text, text, text, text,
  numeric, numeric, integer, numeric, bigint, numeric, numeric, integer, integer, bigint
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION materialize_verified_snapshot(
  uuid, uuid, text, timestamptz, timestamptz, text, text, jsonb, bigint, bigint, bigint, bigint,
  date, numeric, text,
  timestamptz, text, text, text, text, text,
  numeric, numeric, integer, numeric, bigint, numeric, numeric, integer, integer, bigint
) TO service_role;
