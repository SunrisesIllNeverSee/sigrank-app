-- 0007_identity_columns.sql
-- Phase-0 operator identity columns: handle, avatar_url, bio, links, location.
-- These fields are the data model behind the sign-in → profile UI shell
-- (ProfileEditForm.tsx, app/me/edit/page.tsx) built in the prior session.
--
-- ⚠️  APPLY POST-MOVE — do NOT run against the current Sigrank project.
--     Apply once on the NEW Supabase project after the repo move, alongside
--     the @supabase/ssr install + real auth wiring (Phase 2). The columns are
--     fully null-safe (ADD COLUMN IF NOT EXISTS) so running twice is idempotent.
--
-- Decisions (per PROFILE_PIPELINE_WORKORDER.md):
--   - handle: optional vanity handle, unique where set; codename stays primary.
--   - links: fixed slots { github, site, x } as JSONB (matches ProfileEditForm.tsx:31-33).
--   - public-by-default: no privacy_level / visibility toggles (scratched per roadmap).
--   - No email on the public profile (Phase 5, separate).
--   - avatar_url: display-only pre-move; Storage upload wires in Phase 3.

ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS handle      TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS bio         TEXT,
  ADD COLUMN IF NOT EXISTS links       JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS location    TEXT;

-- Nullable-unique index on handle: two NULL handles are allowed (NULL ≠ NULL in SQL),
-- but two operators cannot share the same non-null handle.
CREATE UNIQUE INDEX IF NOT EXISTS idx_operators_handle
  ON operators (handle)
  WHERE handle IS NOT NULL;
