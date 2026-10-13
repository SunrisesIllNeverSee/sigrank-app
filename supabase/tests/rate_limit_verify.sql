-- Verifies 0055: counting, window isolation, and that client roles can't use it.
DO $$
DECLARE r record; ok boolean;
BEGIN
  SELECT * INTO r FROM public.api_rate_limit_hit('t:a', 3600);
  IF r.hits <> 1 OR r.reset_seconds < 1 OR r.reset_seconds > 3600 THEN RAISE EXCEPTION 'first hit wrong: %', r; END IF;
  SELECT * INTO r FROM public.api_rate_limit_hit('t:a', 3600);
  IF r.hits <> 2 THEN RAISE EXCEPTION 'second hit wrong: %', r; END IF;
  SELECT * INTO r FROM public.api_rate_limit_hit('t:b', 3600);
  IF r.hits <> 1 THEN RAISE EXCEPTION 'buckets not isolated: %', r; END IF;
  BEGIN PERFORM public.api_rate_limit_hit('t:a', 0); RAISE EXCEPTION 'zero window accepted';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM = 'zero window accepted' THEN RAISE; END IF; END;
  IF has_function_privilege('anon','public.api_rate_limit_hit(text,integer)','EXECUTE')
     OR has_function_privilege('authenticated','public.api_rate_limit_hit(text,integer)','EXECUTE') THEN
    RAISE EXCEPTION 'client roles can execute limiter';
  END IF;
  IF NOT has_function_privilege('service_role','public.api_rate_limit_hit(text,integer)','EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute limiter';
  END IF;
  IF has_table_privilege('anon','public.api_rate_limits','SELECT')
     OR has_table_privilege('authenticated','public.api_rate_limits','INSERT') THEN
    RAISE EXCEPTION 'client roles can touch api_rate_limits';
  END IF;
  DELETE FROM public.api_rate_limits WHERE bucket LIKE 't:%';
  RAISE NOTICE 'rate limit verify OK';
END $$;
