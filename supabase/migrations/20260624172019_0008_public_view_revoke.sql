GRANT SELECT (
    operator_id, codename, display_name, handle, avatar_url, bio, links, location,
    status, verification_status, primary_domain, account_age_days,
    total_messages_lifetime, current_supporter_tier, claimed, claimed_at, operator_domains
  ) ON operators TO anon, authenticated;
REVOKE SELECT ON operators FROM anon, authenticated;;
