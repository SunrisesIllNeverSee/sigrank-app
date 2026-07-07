-- 0014_enroll_rpc.sql — D7 ingest: atomic device enrollment RPC.
-- Redeem a connect code → bind a device → consume the code, in ONE transaction.
-- SELECT ... FOR UPDATE serializes concurrent redeems of the same single-use code.
-- Additive + re-runnable. search_path pinned '' + EXECUTE locked to service_role.

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

  -- Immutable binding: a device_id enrolls exactly once.
  IF EXISTS (SELECT 1 FROM public.devices d WHERE d.device_id = p_device_id) THEN
    RETURN QUERY SELECT 'device_already_enrolled'::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Bind the device to the CODE's operator — trusted immediately (web-auth'd single-use code).
  INSERT INTO public.devices (
    device_id, operator_id, agent_public_key, agent_version, device_label, trust_status, last_seen
  ) VALUES (
    p_device_id, v_operator_id, p_public_key, COALESCE(p_agent_version, 'sigrank-mcp'),
    p_device_label, 'trusted', now()
  );

  -- Consume the code (single-use).
  UPDATE public.device_enroll_codes
  SET consumed_at = now(), consumed_device_id = p_device_id
  WHERE code = p_code;

  SELECT o.codename INTO v_codename FROM public.operators o WHERE o.operator_id = v_operator_id;

  RETURN QUERY SELECT 'enrolled'::TEXT, v_operator_id, v_codename;
END;
$$;

REVOKE EXECUTE ON FUNCTION enroll_device(text, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION enroll_device(text, uuid, text, text, text) TO service_role;;
