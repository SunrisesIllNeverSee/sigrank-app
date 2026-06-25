-- 0009_auth_accounts.sql
-- The AUTH keystone: links a Supabase auth user → a SigRank operator (the FREE
-- claim — logging in claims the profile, no payment). Plus the owner-scoped write
-- policy so an authenticated user can edit ONLY their own operator row.
--
-- ⚠️  APPLY POST — do NOT run until the Supabase Auth providers (GitHub OAuth +
--     email magic-link) are configured on the project. Apply to the Sigrank project
--     (copqtaqzsdvpdbhpwjmt) after 0007 + 0008. Idempotent (IF NOT EXISTS / OR REPLACE).
--     Run `supabase db advisors` (or MCP get_advisors) after applying.
--
-- Auth identity isolation (P5): the GitHub/email identity lives ONLY in auth.users +
-- this link table. It is NEVER copied into display_name/handle or any public column.

-- ── operator_accounts: one auth user ↔ one operator ──────────────────────────
CREATE TABLE IF NOT EXISTS operator_accounts (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES operators(operator_id) ON DELETE CASCADE,
  linked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operator_id)
);

ALTER TABLE operator_accounts ENABLE ROW LEVEL SECURITY;

-- A user may read/insert ONLY their own link row. `TO authenticated` + an ownership
-- predicate (not `TO authenticated` alone, which would be BOLA/IDOR). No UPDATE/DELETE
-- policy: links are immutable from the client; re-linking is a service-role operation.
DROP POLICY IF EXISTS p_operator_accounts_select_own ON operator_accounts;
CREATE POLICY p_operator_accounts_select_own ON operator_accounts
  FOR SELECT TO authenticated
  USING ( (select auth.uid()) = user_id );

DROP POLICY IF EXISTS p_operator_accounts_insert_own ON operator_accounts;
CREATE POLICY p_operator_accounts_insert_own ON operator_accounts
  FOR INSERT TO authenticated
  WITH CHECK ( (select auth.uid()) = user_id );

-- ── auth_operator_id(): the caller's operator_id, for use inside other RLS policies ──
-- SECURITY DEFINER is the standard Supabase helper pattern here AND is safe because the
-- body filters by auth.uid(): an anon caller (auth.uid() NULL) gets NULL; an authed
-- caller gets ONLY their own operator_id — it can never return another user's binding.
-- search_path is pinned empty (schema-qualified refs) to block search-path injection.
CREATE OR REPLACE FUNCTION auth_operator_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT operator_id FROM public.operator_accounts WHERE user_id = (select auth.uid())
$$;

-- ── owner-scoped writes on operators (activates the policies.sql TODO(RLS.PHASE2)) ──
-- An authenticated user may UPDATE ONLY their own operator row. Both USING (which rows
-- are updatable) and WITH CHECK (what the updated row may become) are required, else a
-- user could reassign the row to another operator. Column-level write restriction
-- (codename/claimed/current_supporter_tier/stripe_customer_id immutable) is enforced in
-- the authed API route allowlist; a BELT-AND-SUSPENDERS BEFORE UPDATE trigger can be
-- added later. NOTE: an UPDATE needs a SELECT path to the row — operators reads run via
-- the service role (RLS-bypassing) for the board, and an authenticated self-SELECT is
-- granted below so the authed edit path can read its own row before updating.
DROP POLICY IF EXISTS p_operators_select_own ON operators;
CREATE POLICY p_operators_select_own ON operators
  FOR SELECT TO authenticated
  USING ( operator_id = auth_operator_id() );

DROP POLICY IF EXISTS p_operators_owner_update ON operators;
CREATE POLICY p_operators_owner_update ON operators
  FOR UPDATE TO authenticated
  USING ( operator_id = auth_operator_id() )
  WITH CHECK ( operator_id = auth_operator_id() );

-- REMINDER: enabling RLS on `operators` (if not already enabled) must keep the public
-- board working. The app reads operators via the service role (bypasses RLS) and the
-- anon public path is the `operators_public` view (0008) — verify anon board curl is
-- still 200-with-rows after applying, and that `supabase db advisors` is clean.
