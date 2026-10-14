BEGIN;

CREATE OR REPLACE FUNCTION public.change_operator_codename(p_operator_id uuid, p_new_codename text)
RETURNS TABLE (status text, old_codename text, codename text, available_at timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_old text;
  v_last timestamptz;
  v_now timestamptz;
BEGIN
  IF p_new_codename IS NULL OR p_new_codename !~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
    OR p_new_codename = ANY(ARRAY['the-field','admin','sigrank','moses','system','null','undefined']) THEN
    RETURN QUERY SELECT 'invalid'::text, NULL::text, p_new_codename, NULL::timestamptz;
    RETURN;
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('signalaf:codename-change', 0));
  SELECT o.codename INTO v_old FROM public.operators o
    WHERE o.operator_id = p_operator_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::text, NULL::text, p_new_codename, NULL::timestamptz;
    RETURN;
  END IF;
  IF v_old = p_new_codename THEN
    RETURN QUERY SELECT 'unchanged'::text, v_old, p_new_codename, NULL::timestamptz;
    RETURN;
  END IF;

  v_now := pg_catalog.clock_timestamp();
  SELECT max(h.changed_at) INTO v_last FROM public.codename_history h WHERE h.operator_id = p_operator_id;
  IF v_last IS NOT NULL AND v_last + interval '720 hours' > v_now THEN
    RETURN QUERY SELECT 'cooldown'::text, v_old, p_new_codename, v_last + interval '720 hours';
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.codename_history h
    WHERE lower(h.old_codename) = p_new_codename AND h.operator_id <> p_operator_id
      AND h.changed_at >= v_now - interval '720 hours') THEN
    RETURN QUERY SELECT 'held'::text, v_old, p_new_codename, NULL::timestamptz;
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.operators o
    WHERE lower(o.codename) = p_new_codename AND o.operator_id <> p_operator_id) THEN
    RETURN QUERY SELECT 'taken'::text, v_old, p_new_codename, NULL::timestamptz;
    RETURN;
  END IF;

  UPDATE public.operators o SET codename = p_new_codename WHERE o.operator_id = p_operator_id;
  INSERT INTO public.codename_history(operator_id, old_codename, new_codename, changed_at)
    VALUES (p_operator_id, v_old, p_new_codename, v_now);
  RETURN QUERY SELECT 'changed'::text, v_old, p_new_codename, NULL::timestamptz;
EXCEPTION WHEN unique_violation THEN
  RETURN QUERY SELECT 'taken'::text, v_old, p_new_codename, NULL::timestamptz;
END;
$$;

REVOKE ALL ON FUNCTION public.change_operator_codename(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_operator_codename(uuid,text) TO service_role;
NOTIFY pgrst, 'reload schema';

COMMIT;
