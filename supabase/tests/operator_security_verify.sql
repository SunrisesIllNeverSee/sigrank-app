SET ROLE anon;
SET request.jwt.claim.role = 'anon';
DO $$ BEGIN
 IF (SELECT display_name IS NOT NULL OR handle IS NOT NULL OR bio IS NOT NULL OR links IS NOT NULL OR primary_domain IS NOT NULL OR operator_domains IS NOT NULL FROM public.operators_public WHERE codename='test-private') THEN RAISE EXCEPTION 'Private view leaked'; END IF;
 IF (SELECT display_name FROM public.operators_public WHERE codename='test-public') <> 'Public Name' THEN RAISE EXCEPTION 'Public identity broken'; END IF;
 IF (SELECT count(*) FROM public.operators_public) <> 2 THEN RAISE EXCEPTION 'Public board rows broken'; END IF;
 BEGIN PERFORM display_name FROM public.operators; RAISE EXCEPTION 'Direct identity access allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET ROLE authenticated;
SET request.jwt.claim.role = 'authenticated';
DO $$ BEGIN
 BEGIN INSERT INTO public.operator_accounts VALUES('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001'); RAISE EXCEPTION 'Ownership insertion allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN UPDATE public.operators SET current_supporter_tier='forged'; RAISE EXCEPTION 'Protected update allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN UPDATE public.operators SET display_name='direct bypass'; RAISE EXCEPTION 'Column grant survived'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF (SELECT display_name IS NOT NULL FROM public.operators_public WHERE codename='test-private') THEN RAISE EXCEPTION 'Authenticated view leaked'; END IF;
END $$;
RESET ROLE;
SET ROLE service_role;
SET request.jwt.claim.role = 'service_role';
DO $$ BEGIN
 IF (SELECT display_name FROM public.operators_public WHERE codename='test-private') <> 'Private Name' THEN RAISE EXCEPTION 'Server owner read broken'; END IF;
 INSERT INTO public.operator_accounts VALUES('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001');
 UPDATE public.operators SET display_name='Server Edit' WHERE codename='test-private';
 IF (SELECT display_name FROM public.operators_public WHERE codename='test-private') <> 'Server Edit' THEN RAISE EXCEPTION 'Server edit broken'; END IF;
END $$;
RESET ROLE;
SELECT 'security boundary regression checks passed' AS result;
