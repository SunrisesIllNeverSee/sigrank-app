-- Run after operator_security_bootstrap + 0053 + security_pass2_bootstrap + 0054 (any number of times).
DO $$
DECLARE t text; r text; p text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vercel_integrations','agent_mailboxes','codename_history'] LOOP
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      FOREACH p IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
        IF has_table_privilege(r, 'public.' || t, p) THEN RAISE EXCEPTION '% has % on %', r, p, t; END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  IF NOT has_table_privilege('service_role', 'public.codename_history', 'INSERT') THEN RAISE EXCEPTION 'service_role lacks codename_history'; END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='operator_reports' AND policyname IN ('server writes reports','server updates reports')) THEN
    RAISE EXCEPTION 'always-true operator_reports policies survive'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='codename_history' AND indexdef ILIKE '%lower(old_codename%') THEN
    RAISE EXCEPTION 'lower(old_codename) index missing'; END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.codename_history'::regclass) THEN RAISE EXCEPTION 'codename_history RLS off'; END IF;
END $$;

-- Default privileges: a table created now must not be reachable by anon/authenticated.
CREATE TABLE public._pass2_default_priv_probe (id int);
DO $$ BEGIN
  IF has_table_privilege('anon','public._pass2_default_priv_probe','SELECT')
     OR has_table_privilege('authenticated','public._pass2_default_priv_probe','SELECT') THEN
    RAISE EXCEPTION 'default privileges still grant new tables'; END IF;
END $$;
DROP TABLE public._pass2_default_priv_probe;

SET ROLE authenticated;
SET request.jwt.claims = '{"role":"authenticated"}';
DO $$ BEGIN
  BEGIN INSERT INTO public.operator_reports(report) VALUES ('{}'); RAISE EXCEPTION 'authenticated insert on operator_reports allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM 1 FROM public.codename_history; RAISE EXCEPTION 'authenticated read codename_history allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  -- Missing actor_id claim must not match actor_id = ''
  IF (SELECT count(*) FROM public.signal_attempts) <> 0 THEN RAISE EXCEPTION 'empty claim matches attempts'; END IF;
  IF (SELECT count(*) FROM public.signal_qualifications) <> 0 THEN RAISE EXCEPTION 'empty claim matches qualifications'; END IF;
  IF (SELECT count(*) FROM public.signal_verifications) <> 0 THEN RAISE EXCEPTION 'empty claim matches verifications'; END IF;
END $$;
SET request.jwt.claims = '{"role":"authenticated","actor_id":"actor-x"}';
DO $$ BEGIN
  IF (SELECT count(*) FROM public.signal_attempts) <> 1 THEN RAISE EXCEPTION 'actor claim read broken'; END IF;
  IF (SELECT count(*) FROM public.signal_qualifications) <> 1 THEN RAISE EXCEPTION 'actor qual read broken'; END IF;
END $$;
RESET ROLE;
SET ROLE anon;
SET request.jwt.claims = '';
DO $$ BEGIN
  IF (SELECT count(*) FROM public.signal_attempts) <> 0 THEN RAISE EXCEPTION 'blank claims matches attempts'; END IF;
END $$;
RESET ROLE;
SET ROLE service_role;
DO $$ BEGIN
  INSERT INTO public.codename_history(operator_id, old_codename, new_codename)
    VALUES ('00000000-0000-0000-0000-000000000001', 'a-old', 'a-new');
  DELETE FROM public.codename_history;
END $$;
RESET ROLE;
SELECT 'security pass2 checks passed' AS result;
