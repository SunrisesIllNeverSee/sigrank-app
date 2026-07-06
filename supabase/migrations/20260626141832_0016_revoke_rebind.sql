-- 0016_revoke_rebind.sql — FIX N: allow a revoked device to re-enroll (re-bind)
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

  SELECT d.operator_id, d.trust_status INTO v_existing_op, v_existing_trust
  FROM public.devices d
  WHERE d.device_id = p_device_id
  FOR UPDATE;

  IF v_existing_op IS NOT NULL THEN
    IF v_existing_trust = 'revoked' AND v_existing_op = v_operator_id THEN
      UPDATE public.devices
         SET agent_public_key = p_public_key,
             trust_status     = 'trusted',
             device_label     = COALESCE(p_device_label, device_label),
             agent_version    = COALESCE(p_agent_version, agent_version),
             last_seen        = now()
       WHERE device_id = p_device_id;
    ELSE
      RETURN QUERY SELECT 'device_already_enrolled'::TEXT, NULL::UUID, NULL::TEXT;
      RETURN;
    END IF;
  ELSE
    INSERT INTO public.devices (
      device_id, operator_id, agent_public_key, agent_version, device_label, trust_status, last_seen
    ) VALUES (
      p_device_id, v_operator_id, p_public_key, COALESCE(p_agent_version, 'sigrank-mcp'),
      p_device_label, 'trusted', now()
    );
  END IF;

  UPDATE public.device_enroll_codes
  SET consumed_at = now(), consumed_device_id = p_device_id
  WHERE code = p_code;

  SELECT o.codename INTO v_codename FROM public.operators o WHERE o.operator_id = v_operator_id;

  RETURN QUERY SELECT 'enrolled'::TEXT, v_operator_id, v_codename;
END;
$$;

REVOKE EXECUTE ON FUNCTION enroll_device(text, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION enroll_device(text, uuid, text, text, text) TO service_role;;
