-- d7_insert_smoke.sql — PRE-FLIP GATE 3/3: real-Postgres submission-insert proof.
--
-- Proves the D7 RPCs succeed against the APPLIED schema (every NOT NULL satisfied,
-- types correct, FKs valid) — for materialize_verified_snapshot (0013) AND
-- enroll_device (0014). Run AFTER 0013 + 0014 are applied.
--
-- HOW TO RUN (LEAD / owner): paste this whole file into the Supabase SQL editor and
-- run it. It is wrapped in BEGIN … ROLLBACK, so it writes NOTHING to the live board —
-- all temp rows (operator, device, code, submission, metric_snapshot) are rolled back.
-- Success prints two NOTICEs ending in "GATE 3/3 PASS"; any NOT NULL / type / FK
-- problem raises an exception and aborts (the row would have failed in prod). Safe to
-- re-run. (Run against a Supabase PREVIEW BRANCH if you prefer total isolation.)
-- ============================================================================
BEGIN;

DO $$
DECLARE
  v_op            uuid;
  v_dev           uuid;
  v_metric        uuid;
  v_code          text := 'SIGR-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,5))
                                || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,5))
                                || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
  v_hash          text := 'sha256:smoke-' || gen_random_uuid()::text;
  v_sub_count     int;
  v_metric_count  int;
  v_enroll        record;
BEGIN
  -- temp operator + a trusted device (rolled back)
  INSERT INTO operators (codename, claimed)
    VALUES ('d7-smoke-' || substr(replace(gen_random_uuid()::text,'-',''),1,8), false)
    RETURNING operator_id INTO v_op;
  INSERT INTO devices (operator_id, agent_public_key, agent_version, trust_status)
    VALUES (v_op, 'ed25519:smoke', 'sigrank-mcp/smoke', 'trusted')
    RETURNING device_id INTO v_dev;

  -- (1) materialize_verified_snapshot — full required arg set (MO§ES pillars).
  v_metric := materialize_verified_snapshot(
    v_op, v_dev, '30d', now() - interval '30 days', now(),
    'sigrank-token-1', v_hash, '{"smoke":true}'::jsonb,
    1251211, 11296121, 128196310, 2555179769,   -- input, output, cacheCreate, cacheRead
    current_date, 96.40, 'TRANSMITTER'            -- snapshot_date, signa_rate, class_tier
  );
  SELECT count(*) INTO v_sub_count    FROM snapshot_submissions WHERE snapshot_hash = v_hash;
  SELECT count(*) INTO v_metric_count FROM metric_snapshots     WHERE operator_id = v_op;
  IF v_metric IS NULL OR v_sub_count <> 1 OR v_metric_count <> 1 THEN
    RAISE EXCEPTION 'GATE 3 FAIL (materialize): id=% submissions=% metrics=%', v_metric, v_sub_count, v_metric_count;
  END IF;
  RAISE NOTICE 'materialize_verified_snapshot OK → metric_snapshot_id=% (submissions=%, metrics=%)', v_metric, v_sub_count, v_metric_count;

  -- (1b) live-upload UPSERT: re-materialize the SAME cell (new hash, newer numbers) → still 1 metric row.
  PERFORM materialize_verified_snapshot(
    v_op, v_dev, '30d', now() - interval '30 days', now(),
    'sigrank-token-1', 'sha256:smoke2-' || gen_random_uuid()::text, '{"smoke":2}'::jsonb,
    1300000, 12000000, 130000000, 2600000000,
    current_date, 97.10, 'TRANSMITTER'
  );
  SELECT count(*) INTO v_metric_count FROM metric_snapshots WHERE operator_id = v_op AND window_type = '30d';
  IF v_metric_count <> 1 THEN
    RAISE EXCEPTION 'GATE 3 FAIL (live-upload upsert): expected 1 metric row for the cell, got %', v_metric_count;
  END IF;
  RAISE NOTICE 'live-upload UPSERT OK → same cell stays 1 row after a newer submission';

  -- (2) enroll_device — mint a code, redeem it, assert it binds a fresh device.
  INSERT INTO device_enroll_codes (code, operator_id, expires_at)
    VALUES (v_code, v_op, now() + interval '10 min');
  SELECT * INTO v_enroll FROM enroll_device(v_code, gen_random_uuid(), 'ed25519:smoke-dev2', 'smoke', 'sigrank-mcp/smoke');
  IF v_enroll.status <> 'enrolled' OR v_enroll.operator_id <> v_op THEN
    RAISE EXCEPTION 'GATE 3 FAIL (enroll_device): status=% operator=%', v_enroll.status, v_enroll.operator_id;
  END IF;
  RAISE NOTICE 'enroll_device OK → status=% operator=%', v_enroll.status, v_enroll.operator_id;

  RAISE NOTICE 'GATE 3/3 PASS — D7 RPCs satisfy every NOT NULL / type / FK against the applied schema (all rolled back).';
END $$;

ROLLBACK;
