-- 0016_revoke_rebind.sql — FIX N: allow a revoked device to re-enroll (re-bind)
--
-- WHY: enroll_device (0014) rejects ANY existing device_id with
-- `device_already_enrolled` (409) — it checks existence only, not trust_status.
-- revoke/route.ts sets trust_status='revoked' and never deletes the row. So after a
-- website revoke, re-enrolling the SAME device_id is permanently 409-blocked.
-- The client full-delete in FIX A (clearIdentity → fresh device_id) already escapes
-- this, BUT any reset path that KEEPS the device_id would 409-loop. This is the
-- belt-and-suspenders server fix: allow re-binding when the existing row is
-- `trust_status='revoked'` AND the code's operator matches → UPDATE back to 'trusted'
-- + the new public_key, instead of a blanket existence 409.
--
-- ⚠️ PRE-APPLY (touches a LIVE table):
--   Run inside a transaction with a smoke BEFORE committing to prod:
--     BEGIN;
--       \i 0016_revoke_rebind.sql
--       -- expect: the function signature is unchanged (same name + arg types), so
--       -- existing callers (enroll route) work verbatim. Verify the new branch:
--       -- a revoked device + a fresh code for the SAME operator → 'enrolled' (re-bound).
--       -- a revoked device + a fresh code for a DIFFERENT operator → 'device_already_enrolled' (no cross-operator hijack).
--       -- a trusted device → 'device_already_enrolled' (unchanged).
--     ROLLBACK;   -- inspect, then re-run with COMMIT once happy
--
-- Security: the re-bind is gated on BOTH (a) the existing row is 'revoked' (NOT
-- 'trusted' — a live trusted device can never be silently re-bound) AND (b) the
-- code's operator_id matches the device's operator_id (no cross-operator hijack —
-- a code for operator B cannot re-bind operator A's revoked device). The new
-- public_key overwrites the old (the device is now a different physical key).

CREATE OR REPLACE FUNCTION enroll_device(
  p_code          TEXT,
  p_device_id     UUID,
  p_public_key    TEXT,
  p_device_label  TEXT DEFAULT NULL,
  p_agent_version TEXT DEFAULT NULL
)
RETURNS TABLE(status TEXT, operator_id UUID, codename TEXT)
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_operator_id UUID;
  v_codename    TEXT;
  v_existing_op UUID;
  v_existing_trust TEXT;
BEGIN
  -- Lock the LIVE code row; FOR UPDATE serializes concurrent redeems of one code.
  SELECT c.operator_id INTO v_operator_id
  FROM public.device_enroll_codes c
  WHERE c.code = p_code
    AND c.consumed_at IS NULL
    AND c.expires_at > now()
  FOR UPDATE;

  IF v_operator_id IS NULL THEN
    RETURN QUERY SELECT 'code_invalid'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- FIX N: check the existing device row. Three cases:
  --   (a) no existing row → fresh enroll (unchanged from 0014).
  --   (b) existing row is 'revoked' AND the code's operator matches → RE-BIND
  --       (UPDATE trust_status='trusted' + new public_key — the device re-joins).
  --   (c) existing row is 'trusted' OR the operator does NOT match → 409
  --       (device_already_enrolled — no silent re-bind of a live device, no
  --       cross-operator hijack of a revoked device).
  SELECT d.operator_id, d.trust_status INTO v_existing_op, v_existing_trust
  FROM public.devices d
  WHERE d.device_id = p_device_id
  FOR UPDATE;  -- lock the device row so a concurrent revoke can't race the re-bind

  IF v_existing_op IS NOT NULL THEN
    IF v_existing_trust = 'revoked' AND v_existing_op = v_operator_id THEN
      -- FIX N: re-bind the revoked device to the same operator with the new key.
      UPDATE public.devices
         SET agent_public_key = p_public_key,
             trust_status     = 'trusted',
             device_label     = COALESCE(p_device_label, device_label),
             agent_version    = COALESCE(p_agent_version, agent_version),
             last_seen        = now()
       WHERE device_id = p_device_id;
    ELSE
      -- Trusted device (live, can't re-bind) OR operator mismatch (no hijack).
      RETURN QUERY SELECT 'device_already_enrolled'::TEXT, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
  ELSE
    -- Fresh enroll (no existing row) — unchanged from 0014.
    INSERT INTO public.devices (
      device_id, operator_id, agent_public_key, agent_version, device_label, trust_status, last_seen
    ) VALUES (
      p_device_id, v_operator_id, p_public_key, COALESCE(p_agent_version, 'sigrank-mcp'),
      p_device_label, 'trusted', now()
    );
  END IF;

  -- Consume the code (single-use).
  UPDATE public.device_enroll_codes
  SET consumed_at = now(), consumed_device_id = p_device_id
  WHERE code = p_code;

  SELECT o.codename INTO v_codename FROM public.operators o WHERE o.operator_id = v_operator_id;

  RETURN QUERY SELECT 'enrolled'::TEXT, v_operator_id, v_codename;
END;
$$;

-- Signature is unchanged (same name + arg types) → grants carry over. Re-issue for
-- hygiene so the service_role EXECUTE grant is explicit on the new function body.
REVOKE EXECUTE ON FUNCTION enroll_device(text, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION enroll_device(text, uuid, text, text, text) TO service_role;
