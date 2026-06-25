-- 0011_auth_operator_id_private.sql
-- HARDENING_0625 §3: clear the two SECURITY DEFINER advisor WARNs (lints 0028/0029,
-- "Public/Authenticated Can Execute SECURITY DEFINER Function") by moving
-- auth_operator_id() OUT of the PostgREST-exposed `public` schema into a non-exposed
-- `private` schema, so it is no longer reachable as a /rest/v1/rpc/ endpoint.
--
-- The function is otherwise UNCHANGED and remains safe-by-design (filters by auth.uid(),
-- search_path pinned empty). All 6 RLS policies that referenced it are recreated to call
-- private.auth_operator_id(). The app is unaffected: operator + avatar writes/reads run
-- via the service role (which bypasses RLS), so these policies are defense-in-depth for
-- any client-direct access. Idempotent.
--
-- NOTE: the `multiple_permissive_policies` perf WARN on operators is intentionally NOT
-- addressed here — scoping p_operators_public_select would touch the anon board-read path
-- through the security_invoker operators_public view; not worth the risk for a cosmetic
-- WARN on a ~20-row table (see HARDENING_0625 §1).

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.auth_operator_id()
  returns uuid
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select operator_id from public.operator_accounts where user_id = (select auth.uid())
$$;

revoke execute on function private.auth_operator_id() from public;
grant execute on function private.auth_operator_id() to authenticated;

-- ── operators policies (originally 0009) ─────────────────────────────────────
drop policy if exists p_operators_select_own on operators;
create policy p_operators_select_own on operators
  for select to authenticated
  using ( operator_id = private.auth_operator_id() );

drop policy if exists p_operators_owner_update on operators;
create policy p_operators_owner_update on operators
  for update to authenticated
  using ( operator_id = private.auth_operator_id() )
  with check ( operator_id = private.auth_operator_id() );

-- ── storage avatars policies (originally 0010) ───────────────────────────────
drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = private.auth_operator_id()::text
  );

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = private.auth_operator_id()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = private.auth_operator_id()::text
  );

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = private.auth_operator_id()::text
  );

drop policy if exists "avatars owner read" on storage.objects;
create policy "avatars owner read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = private.auth_operator_id()::text
  );

-- Nothing references public.auth_operator_id() now → drop it (clears the RPC-exposure WARNs).
drop function if exists public.auth_operator_id();
