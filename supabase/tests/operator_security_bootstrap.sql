CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;
CREATE TABLE public.operators (
 operator_id uuid PRIMARY KEY, codename text, display_name text, handle text, avatar_url text,
 bio text, links jsonb, location text, status text, verification_status text, primary_domain text,
 account_age_days integer, total_messages_lifetime bigint, current_supporter_tier text,
 claimed boolean, claimed_at timestamptz, operator_domains text[], profile_visibility text, stripe_customer_id text
);
CREATE TABLE public.operator_accounts (user_id uuid PRIMARY KEY, operator_id uuid UNIQUE);
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_operators_public_select ON public.operators FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY p_operators_owner_update ON public.operators FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY p_operator_accounts_insert_own ON public.operator_accounts FOR INSERT TO authenticated WITH CHECK(true);
GRANT ALL ON public.operators,public.operator_accounts TO authenticated;
GRANT SELECT(display_name,handle,avatar_url,bio,links,location) ON public.operators TO anon,authenticated;
CREATE VIEW public.operators_public WITH(security_invoker=true) AS
 SELECT operator_id,codename,display_name,handle,avatar_url,bio,links,location,status,verification_status,
 primary_domain,account_age_days,total_messages_lifetime,current_supporter_tier,claimed,claimed_at,
 operator_domains,profile_visibility FROM public.operators;
GRANT SELECT ON public.operators_public TO anon,authenticated;
GRANT ALL ON public.operators,public.operator_accounts TO service_role;
INSERT INTO public.operators(operator_id,codename,display_name,handle,bio,links,primary_domain,operator_domains,profile_visibility)
 VALUES ('00000000-0000-0000-0000-000000000001','test-private','Private Name','private-handle','private-bio','{"github":"private"}','private-domain',ARRAY['private-domain'],'private'),
 ('00000000-0000-0000-0000-000000000002','test-public','Public Name','public-handle','public-bio','{"github":"public"}','public-domain',ARRAY['public-domain'],'public');
