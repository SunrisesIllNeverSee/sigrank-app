-- 0051_operator_watches.sql
--
-- Operator watches — the board's "WATCH" pin made real. A signed-in user
-- (auth.users) marks an operator; the mark communicates approval back to
-- the operator ("N watching you") once their claimed account links an
-- auth user (operator_accounts.user_id → operators.operator_id).
--
-- Privacy contract: WHO watches is private to the watcher — no public
-- read of watcher ids. Aggregate counts are computed server-side with
-- the service role (bypasses RLS) and exposed through
-- /api/v1/operators/{codename}/watch, which returns only {count,
-- watching}. No SECURITY DEFINER count function is created in public.
--
-- Grant posture follows 0035_lockdown_table_grants: Supabase's default
-- is ALL privileges to anon+authenticated; revoke and re-grant the
-- minimum. anon gets NOTHING — watching requires a verified session,
-- and even the count is read via the service role server-side.

CREATE TABLE IF NOT EXISTS public.operator_watches (
  -- the human doing the watching (auth.users; NOT operator_id — a user
  -- may watch before claiming an operator, and watchers are people)
  watcher_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- the operator being watched
  operator_id UUID NOT NULL REFERENCES public.operators (operator_id) ON DELETE CASCADE,
  -- forward-compat: 'watch' today; room for 'endorse'/'follow' later
  kind TEXT NOT NULL DEFAULT 'watch' CHECK (kind = 'watch'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (watcher_user_id, operator_id)
);

-- reverse lookup: "who watches operator X" / count-per-operator
CREATE INDEX IF NOT EXISTS idx_operator_watches_operator
  ON public.operator_watches (operator_id);

ALTER TABLE public.operator_watches ENABLE ROW LEVEL SECURITY;

-- revoke the default ALL grants, then re-grant the minimum needed.
REVOKE ALL ON public.operator_watches FROM anon;
REVOKE ALL ON public.operator_watches FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.operator_watches TO authenticated;

-- own rows only: a user sees/creates/removes their own marks.
-- (select auth.uid()) — per-query stable, the supported pattern post-
-- auth.role() deprecation; UPDATE is intentionally not granted/policy'd:
-- a watch is created or removed, never mutated.
CREATE POLICY p_operator_watches_select_own ON public.operator_watches
  FOR SELECT TO authenticated
  USING ( watcher_user_id = (SELECT auth.uid()) );

CREATE POLICY p_operator_watches_insert_own ON public.operator_watches
  FOR INSERT TO authenticated
  WITH CHECK ( watcher_user_id = (SELECT auth.uid()) );

CREATE POLICY p_operator_watches_delete_own ON public.operator_watches
  FOR DELETE TO authenticated
  USING ( watcher_user_id = (SELECT auth.uid()) );

COMMENT ON TABLE public.operator_watches IS
  'Signed-in user → operator watch marks. Watcher identity is private (own-rows RLS); aggregate counts are served server-side via service-role reads through /api/v1/operators/{codename}/watch.';
