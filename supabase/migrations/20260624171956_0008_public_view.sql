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

COMMENT ON VIEW operators_public IS
  'Public read surface for operators — every profile column except the auth identity (claim_contact) + payment ids (claim_payment_id, stripe_customer_id). security_invoker so the base-table RLS still governs row visibility. P5 fix (0008).';

GRANT SELECT ON operators_public TO anon, authenticated;;
