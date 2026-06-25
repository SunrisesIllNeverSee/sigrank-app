-- 0010_storage_avatars.sql — operator avatar Storage bucket + RLS.
-- AUTH_PROFILE_ROADMAP §3.3 / AUTH_LAUNCH_DIRECTIVES (avatar upload).
--
-- Public-read bucket (the board + profile render <img src> directly). Writes are
-- owner-scoped: each operator may write ONLY under a folder named by their own
-- operator_id. Depends on auth_operator_id() (SECURITY DEFINER) from 0009.
--
-- Idempotent: safe to re-run (ON CONFLICT on the bucket; DROP POLICY IF EXISTS first).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Read policy. Public buckets serve objects via their public URL (RLS-bypassing), so the
-- board/profile <img> needs NO broad SELECT policy. A broad `using (bucket_id='avatars')`
-- would let anyone LIST every object (enumerate operator ids + avatar paths) — flagged by
-- `supabase db advisors` as public_bucket_allows_listing. Instead use an OWNER-SCOPED read:
-- an operator may list only their OWN files, which also completes the INSERT+SELECT+UPDATE
-- triad required for owner upsert. (The service-role upload route bypasses RLS regardless.)
drop policy if exists "avatars public read" on storage.objects; -- reconcile any prior broad policy
drop policy if exists "avatars owner read" on storage.objects;
create policy "avatars owner read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth_operator_id()::text
  );

-- Owner-scoped writes: the first path segment must equal the writer's operator_id.
drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth_operator_id()::text
  );

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth_operator_id()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth_operator_id()::text
  );

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth_operator_id()::text
  );
