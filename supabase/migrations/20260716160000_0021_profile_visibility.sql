-- 0021_profile_visibility.sql
-- Re-add profile visibility controls (owner 2026-07-16: "private user name...
-- control who sees your profile").
--
-- The original privacy_level column was dropped in 0017 (the "public-by-default
-- lock" era). The owner has now reversed that decision — users should be able to
-- control who sees their profile details. This migration:
--   (a) re-adds the column as `profile_visibility` (distinct name so there's no
--       confusion with the old `privacy_level` semantics),
--   (b) adds it to the operators_public view so the app can read it,
--   (c) backfills existing rows to 'public' (preserves current behaviour).
--
-- Values:
--   'public'  — default, current behaviour: all profile fields visible to everyone
--   'private' — only codename + computed metrics (rank, yield, class) are public;
--               display_name, handle, avatar, bio, location, links are visible only
--               to the owner. The board row shows codename only.

ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (profile_visibility IN ('public', 'private'));

-- Backfill: every existing operator stays public (no behaviour change).
UPDATE operators SET profile_visibility = 'public'
  WHERE profile_visibility IS NULL OR profile_visibility NOT IN ('public', 'private');

-- Expose the column through the public view so the app can read + branch on it.
CREATE OR REPLACE VIEW operators_public
  WITH (security_invoker = true) AS
  SELECT
    operator_id,
    codename,
    display_name,
    handle,
    avatar_url,
    bio,
    links,
    location,
    status,
    verification_status,
    primary_domain,
    account_age_days,
    total_messages_lifetime,
    current_supporter_tier,
    claimed,
    claimed_at,
    operator_domains,
    profile_visibility
  FROM operators;

COMMENT ON VIEW operators_public IS
  'Public read surface for operators — every profile column except the auth '
  'identity (claim_contact) + payment ids (claim_payment_id, stripe_customer_id). '
  'security_invoker so the base-table RLS still governs row visibility. P5 fix (0008). '
  'profile_visibility added 0021 so the app can gate display fields.';

-- Re-grant (CREATE OR REPLACE VIEW drops grants in some PG versions).
GRANT SELECT ON operators_public TO anon, authenticated;

-- Column-level grant: add profile_visibility to the allowed set.
GRANT SELECT (
    operator_id, codename, display_name, handle, avatar_url, bio, links, location,
    status, verification_status, primary_domain, account_age_days,
    total_messages_lifetime, current_supporter_tier, claimed, claimed_at,
    operator_domains, profile_visibility
  ) ON operators TO anon, authenticated;
