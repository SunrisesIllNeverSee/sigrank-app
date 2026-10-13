BEGIN;

DROP POLICY IF EXISTS p_operator_accounts_insert_own ON public.operator_accounts;
DROP POLICY IF EXISTS p_operators_owner_update ON public.operators;
REVOKE INSERT, UPDATE, DELETE ON public.operator_accounts, public.operators FROM anon, authenticated;
REVOKE SELECT ON public.operators FROM anon, authenticated;

DO $$
DECLARE t text; cols text;
BEGIN
  FOREACH t IN ARRAY ARRAY['operators', 'operator_accounts'] LOOP
    SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum) INTO cols
    FROM pg_attribute WHERE attrelid = ('public.' || t)::regclass
      AND attnum > 0 AND NOT attisdropped;
    EXECUTE format('REVOKE INSERT (%s), UPDATE (%s) ON public.%I FROM anon, authenticated', cols, cols, t);
    IF t = 'operators' THEN
      EXECUTE format('REVOKE SELECT (%s) ON public.operators FROM anon, authenticated', cols);
    END IF;
  END LOOP;
END $$;

GRANT SELECT (operator_id, codename, status, verification_status, account_age_days,
  total_messages_lifetime, current_supporter_tier, claimed, claimed_at, profile_visibility)
  ON public.operators TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'signalaf_public_projection') THEN
    CREATE ROLE signalaf_public_projection NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'signalaf_public_projection'
    AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb)) THEN
    RAISE EXCEPTION 'Unsafe public projection role';
  END IF;
END $$;

GRANT signalaf_public_projection TO CURRENT_USER WITH INHERIT FALSE, SET TRUE;
GRANT USAGE ON SCHEMA public TO signalaf_public_projection;
GRANT SELECT (operator_id, codename, display_name, handle, avatar_url, bio, links, location,
  status, verification_status, primary_domain, account_age_days, total_messages_lifetime,
  current_supporter_tier, claimed, claimed_at, operator_domains, profile_visibility)
  ON public.operators TO signalaf_public_projection;

DROP POLICY IF EXISTS p_operators_projection_select ON public.operators;
CREATE POLICY p_operators_projection_select ON public.operators
  FOR SELECT TO signalaf_public_projection USING (true);

GRANT CREATE ON SCHEMA public TO signalaf_public_projection;
DO $$
BEGIN
  IF (SELECT relowner FROM pg_class WHERE oid = 'public.operators_public'::regclass)
      <> (SELECT oid FROM pg_roles WHERE rolname = 'signalaf_public_projection') THEN
    ALTER VIEW public.operators_public OWNER TO signalaf_public_projection;
  END IF;
END $$;
SET LOCAL ROLE signalaf_public_projection;
CREATE OR REPLACE VIEW public.operators_public
  WITH (security_invoker = false, security_barrier = true) AS
  SELECT
    operator_id, codename,
    CASE WHEN profile_visibility = 'public' OR (SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')) = 'service_role' THEN display_name END AS display_name,
    CASE WHEN profile_visibility = 'public' OR (SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')) = 'service_role' THEN handle END AS handle,
    CASE WHEN profile_visibility = 'public' OR (SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')) = 'service_role' THEN avatar_url END AS avatar_url,
    CASE WHEN profile_visibility = 'public' OR (SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')) = 'service_role' THEN bio END AS bio,
    CASE WHEN profile_visibility = 'public' OR (SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')) = 'service_role' THEN links END AS links,
    CASE WHEN profile_visibility = 'public' OR (SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')) = 'service_role' THEN location END AS location,
    status, verification_status,
    CASE WHEN profile_visibility = 'public' OR (SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')) = 'service_role' THEN primary_domain END AS primary_domain,
    account_age_days, total_messages_lifetime, current_supporter_tier, claimed, claimed_at,
    CASE WHEN profile_visibility = 'public' OR (SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')) = 'service_role' THEN operator_domains END AS operator_domains,
    profile_visibility
  FROM public.operators;

REVOKE ALL ON public.operators_public FROM anon, authenticated;
GRANT SELECT ON public.operators_public TO anon, authenticated, service_role;
RESET ROLE;
REVOKE CREATE ON SCHEMA public FROM signalaf_public_projection;
NOTIFY pgrst, 'reload schema';

COMMIT;

