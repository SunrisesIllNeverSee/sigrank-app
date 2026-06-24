-- 0008_public_view.sql
-- THE P5 PII FIX: a column-restricted public read surface for operators.
--
-- The base `operators` table carries auth-identity / payment columns
-- (claim_contact = an email captured at claim time, claim_payment_id,
-- stripe_customer_id). RLS is ROW-level, not column-level, so the old anon
-- whole-row SELECT (policies.sql) + an OPERATOR_COLUMNS list that named
-- claim_contact meant the app server SELECTed the PII email into operator
-- objects. Only a VIEW or a column-level GRANT can restrict columns.
--
-- ⚠️  APPLY POST-MOVE — do NOT run against the current Sigrank project.
--     Apply once on the NEW Supabase project after the repo move, AFTER
--     0007_identity_columns.sql (this view references handle/avatar_url/bio/
--     links/location, added by 0007). Idempotent: CREATE OR REPLACE VIEW.
--
-- Decisions (per AUTH_PROFILE_ROADMAP.md §5):
--   - Visibility is public-by-default (LOCKED 2026-06-22): NO per-field
--     `*_public` gating, NO privacy_level in the projection. The view exposes
--     the profile columns straight; the ONLY things it withholds are the auth
--     identity (claim_contact) + payment ids (claim_payment_id, stripe_customer_id).
--   - security_invoker = true: the view runs with the querying role's RLS, so
--     the existing operators RLS still governs row visibility (no SECURITY DEFINER
--     row-leak). Postgres ≥ 15.
--   - The §7.3 column-level GRANT + table-level REVOKE below are the PG-native
--     column restriction (RLS cannot restrict columns). Marked owner-to-bless —
--     the VIEW alone already stops the app from reading PII; the GRANT/REVOKE is
--     defense-in-depth so a raw anon table SELECT cannot reach the private columns
--     either. Service-role writes (the Stripe claim flow) bypass GRANTs, so the
--     claim_contact / claim_payment_id / stripe_customer_id WRITES still work.

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
    operator_domains
  FROM operators;
  -- EXCLUDED (the only private columns): claim_contact, claim_payment_id,
  -- stripe_customer_id, privacy_level (dropped per the public-by-default lock).

COMMENT ON VIEW operators_public IS
  'Public read surface for operators — every profile column except the auth '
  'identity (claim_contact) + payment ids (claim_payment_id, stripe_customer_id). '
  'security_invoker so the base-table RLS still governs row visibility. P5 fix (0008).';

GRANT SELECT ON operators_public TO anon, authenticated;

-- ── §7.3 column-level GRANT + table-level REVOKE (owner-to-bless hardening) ──
-- Belt-and-suspenders: even a raw anon SELECT on the base `operators` table can
-- only reach the safe columns. The view above is the ergonomic read surface; this
-- is the PG-native column gate. If the operator applying this prefers the view
-- alone (and to keep the existing table grant), the next two statements can be
-- skipped without reopening the app-side leak (the code no longer SELECTs PII).
GRANT SELECT (
    operator_id, codename, display_name, handle, avatar_url, bio, links, location,
    status, verification_status, primary_domain, account_age_days,
    total_messages_lifetime, current_supporter_tier, claimed, claimed_at, operator_domains
  ) ON operators TO anon, authenticated;
REVOKE SELECT ON operators FROM anon, authenticated;
