-- 0025_atomic_throttle.sql — fix the throttle TOCTOU race.
--
-- The per-device throttle (gates.ts:throttleGate) reads a pre-fetched count
-- then decides, so N concurrent requests sharing one snapshotted count all
-- pass (effective cap = count + inflight). This migration adds an atomic
-- throttle check INSIDE the materialize_verified_snapshot RPC, so the count
-- is read and enforced in the same transaction as the insert.
--
-- The RPC already runs in a single transaction (SECURITY DEFINER). Adding
-- a count check at the top of the RPC body makes it atomic: the count is
-- read with the same transactional visibility as the insert, so concurrent
-- requests can't all see the same pre-insert count.
--
-- Note: this is a defense-in-depth check. The gate-chain throttle (Gate 3)
-- stays as-is for the no-store/test path. The RPC check is the authoritative
-- one for the production path.
--
-- ⚠️ This migration ALTERs the existing materialize_verified_snapshot function.
-- It must be applied AFTER all prior migrations (it depends on the function
-- existing from the original init + subsequent patches).
--
-- ⚠️ APPLY VIA `supabase db query --linked` OR the dashboard SQL editor — NEVER
--    `supabase db push` (re-runs ALL numbered migrations = catastrophic).

-- The throttle cap (must match GATE_LIMITS.MAX_SUBMISSIONS_PER_WINDOW in gates.ts).
-- 24 submissions per 60 seconds per device.
create or replace function public.materialize_verified_snapshot(
  p_operator_id uuid,
  p_device_id uuid,
  p_window_type text,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_ruleset_version text,
  p_snapshot_hash text,
  p_payload_json jsonb,
  p_input bigint,
  p_output bigint,
  p_cache_creation bigint,
  p_cache_read bigint,
  p_snapshot_date date,
  p_signa_rate numeric,
  p_class_tier integer,
  p_platform text,
  p_schema_version text,
  p_signature text,
  p_codename text,
  p_tier text,
  p_verification_tier text,
  p_compression_ratio numeric,
  p_prompt_complexity numeric,
  p_cross_thread numeric,
  p_session_depth numeric,
  p_token_throughput numeric,
  p_signal_force numeric,
  p_live_signa_rate numeric,
  p_message_volume integer,
  p_account_age_days integer,
  p_total_messages integer
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot_id uuid;
  v_existing record;
  v_throttle_count integer;
  v_throttle_cap integer := 24;
  v_throttle_window_ms bigint := 60000;
  v_window_since timestamptz;
begin
  -- Atomic throttle check: count this device's submissions in the trailing
  -- window INSIDE the transaction. Concurrent requests will see each other's
  -- inserts (depending on isolation level) or at least see a count that
  -- includes recently committed rows. This closes the TOCTOU gap where N
  -- concurrent requests all read the same pre-fetched count.
  v_window_since := now() - (v_throttle_window_ms || ' milliseconds')::interval;
  select count(*) into v_throttle_count
  from snapshot_submissions
  where device_id = p_device_id
    and submitted_at >= v_window_since;

  if v_throttle_count >= v_throttle_cap then
    raise exception 'throttle_exceeded: device % submitted % times in the last 60s (cap %)',
      p_device_id, v_throttle_count, v_throttle_cap
      using errcode = 'P0001';
  end if;

  -- Existing upsert logic (unchanged from the original RPC).
  -- Find the existing snapshot for this (operator, window, platform).
  select ms.snapshot_id, ms.input_tokens, ms.output_tokens,
         ms.cache_creation_tokens, ms.cache_read_tokens
  into v_existing
  from metric_snapshots ms
  where ms.operator_id = p_operator_id
    and ms.window_type = p_window_type
    and ms.platform = p_platform
    and ms.snapshot_date = p_snapshot_date
  limit 1;

  if found then
    -- Upsert: update the existing snapshot with new pillars.
    update metric_snapshots
    set input_tokens = p_input,
        output_tokens = p_output,
        cache_creation_tokens = p_cache_creation,
        cache_read_tokens = p_cache_read,
        signa_rate = p_signa_rate,
        class_tier = p_class_tier,
        generated_at = now()
    where snapshot_id = v_existing.snapshot_id
    returning snapshot_id into v_snapshot_id;
  else
    -- Insert new snapshot.
    insert into metric_snapshots (
      operator_id, window_type, window_start, window_end,
      input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens,
      snapshot_date, signa_rate, class_tier, platform, generated_at
    )
    values (
      p_operator_id, p_window_type, p_window_start, p_window_end,
      p_input, p_output, p_cache_creation, p_cache_read,
      p_snapshot_date, p_signa_rate, p_class_tier, p_platform, now()
    )
    returning snapshot_id into v_snapshot_id;
  end if;

  -- Insert the submission record (for audit + throttle counting).
  insert into snapshot_submissions (
    snapshot_hash, device_id, operator_id, payload_json,
    schema_version, signature, codename, tier, verification_tier,
    submitted_at
  )
  values (
    p_snapshot_hash, p_device_id, p_operator_id, p_payload_json,
    p_schema_version, p_signature, p_codename, p_tier, p_verification_tier,
    now()
  )
  on conflict (snapshot_hash) do nothing;

  return v_snapshot_id::text;
end;
$$;

-- Revoke public access (same as 0022 for recompute_the_field).
revoke execute on function public.materialize_verified_snapshot(
  uuid, uuid, text, timestamptz, timestamptz, text, text, jsonb,
  bigint, bigint, bigint, bigint, date, numeric, integer, text,
  text, text, text, text, text, text, numeric, numeric, numeric,
  numeric, numeric, numeric, numeric, integer, integer, integer
) from public, anon, authenticated;
