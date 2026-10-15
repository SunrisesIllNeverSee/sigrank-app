BEGIN;
GRANT SELECT (profile_pixel_badge) ON public.operators TO signalaf_public_projection;
GRANT CREATE ON SCHEMA public TO signalaf_public_projection;
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
    profile_visibility,
    CASE WHEN profile_visibility = 'public' AND claimed AND status IS DISTINCT FROM 'retired' THEN profile_pixel_badge END AS profile_pixel_badge
  FROM public.operators;

RESET ROLE;
REVOKE CREATE ON SCHEMA public FROM signalaf_public_projection;
NOTIFY pgrst, 'reload schema';
COMMIT;
