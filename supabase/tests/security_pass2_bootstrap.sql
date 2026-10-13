-- Minimal pre-0054 state for the tables 0054 touches (mimics Supabase default ALL grants).
CREATE TABLE public.operator_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), operator_id uuid REFERENCES public.operators(operator_id),
  report jsonb NOT NULL DEFAULT '{}', report_visible boolean DEFAULT false, updated_at timestamptz DEFAULT now());
ALTER TABLE public.operator_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads visible reports" ON public.operator_reports FOR SELECT USING (report_visible = true);
CREATE POLICY "server writes reports" ON public.operator_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "server updates reports" ON public.operator_reports FOR UPDATE USING (true);
CREATE FUNCTION public.update_operator_reports_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TABLE public.vercel_integrations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), access_token text);
CREATE TABLE public.agent_mailboxes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), address text);
ALTER TABLE public.vercel_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_mailboxes ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.signal_attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id text NOT NULL);
CREATE TABLE public.signal_qualifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subject_actor_id text NOT NULL);
CREATE TABLE public.signal_verifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attempt_id uuid);
ALTER TABLE public.signal_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_verifications ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.operator_reports, public.vercel_integrations, public.agent_mailboxes,
  public.signal_attempts, public.signal_qualifications, public.signal_verifications TO anon, authenticated, service_role;
INSERT INTO public.signal_attempts(id, actor_id) VALUES ('00000000-0000-0000-0000-0000000000a1', ''), ('00000000-0000-0000-0000-0000000000a2', 'actor-x');
INSERT INTO public.signal_qualifications(subject_actor_id) VALUES (''), ('actor-x');
INSERT INTO public.signal_verifications(attempt_id) VALUES ('00000000-0000-0000-0000-0000000000a1');
-- Pre-0054 (coalesce) policies: an empty claim matches '' rows.
CREATE POLICY actor_read_own_attempts ON public.signal_attempts FOR SELECT TO public
  USING (coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'actor_id', '') = actor_id);
CREATE POLICY actor_read_own_qualifications ON public.signal_qualifications FOR SELECT TO public
  USING (coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'actor_id', '') = subject_actor_id);
CREATE POLICY actor_read_own_verifications ON public.signal_verifications FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.signal_attempts a WHERE a.id = attempt_id
    AND coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'actor_id', '') = a.actor_id));
