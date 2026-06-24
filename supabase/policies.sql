-- ============================================================================
-- SigRank — Row Level Security (RLS) policies.
--
-- Posture for MVP:
--   * RLS is ENABLED on every table (default-deny once enabled).
--   * Public (anon + authenticated) gets read-only SELECT on the public-read
--     tables — the leaderboard, profiles, badges, rulesets, and the
--     anonymous-by-codename operator rows.
--   * WRITES are NOT granted to public yet. All writes go through the Supabase
--     SERVICE ROLE (scoring worker, webhook handler, claim handler), which
--     BYPASSES RLS entirely — so no write policy is required for them to work.
--   * Operator-scoped self-service writes (e.g. an authed owner editing their
--     own claimed profile) are DEFERRED to Phase 2. See TODO(RLS.PHASE2).
--
-- Anonymity note: operators are anonymous by codename. Public SELECT exposes
-- ONLY non-PII identity columns at the application layer (lib/data). The
-- claim_contact column is PII-adjacent and must never be selected into public
-- responses — Phase 2 should add a column-restricted view or a policy that
-- excludes it. TODO(RLS.PII): restrict claim_contact exposure.
--
-- Idempotent: policies use DROP POLICY IF EXISTS before CREATE so this file can
-- be re-applied. The app runs entirely on mock data without any of this — RLS
-- only matters once live Supabase data is present.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable RLS on ALL tables (default-deny until a policy grants access).
-- ----------------------------------------------------------------------------
ALTER TABLE operators               ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_submissions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_summaries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_rollups_daily   ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_snapshots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_history            ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_badges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards_cached     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rulesets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruleset_versions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_stats            ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_metric_snapshots ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Public read tables — anon + authenticated may SELECT.
-- These back every public-facing page (leaderboard, profiles, hall, circles).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS p_operators_public_select ON operators;
CREATE POLICY p_operators_public_select ON operators
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_metric_snapshots_public_select ON metric_snapshots;
CREATE POLICY p_metric_snapshots_public_select ON metric_snapshots
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_rank_history_public_select ON rank_history;
CREATE POLICY p_rank_history_public_select ON rank_history
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_leaderboards_cached_public_select ON leaderboards_cached;
CREATE POLICY p_leaderboards_cached_public_select ON leaderboards_cached
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_badges_public_select ON badges;
CREATE POLICY p_badges_public_select ON badges
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_operator_badges_public_select ON operator_badges;
CREATE POLICY p_operator_badges_public_select ON operator_badges
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_rulesets_public_select ON rulesets;
CREATE POLICY p_rulesets_public_select ON rulesets
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_ruleset_versions_public_select ON ruleset_versions;
CREATE POLICY p_ruleset_versions_public_select ON ruleset_versions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_system_stats_public_select ON system_stats;
CREATE POLICY p_system_stats_public_select ON system_stats
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_audit_records_public_select ON audit_records;
CREATE POLICY p_audit_records_public_select ON audit_records
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_circles_public_select ON circles;
CREATE POLICY p_circles_public_select ON circles
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_circle_members_public_select ON circle_members;
CREATE POLICY p_circle_members_public_select ON circle_members
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS p_circle_metric_snapshots_public_select ON circle_metric_snapshots;
CREATE POLICY p_circle_metric_snapshots_public_select ON circle_metric_snapshots
  FOR SELECT TO anon, authenticated USING (true);

-- ----------------------------------------------------------------------------
-- NON-public tables — NO public policy. With RLS enabled and no SELECT policy
-- granted to anon/authenticated, these are default-deny to the public API.
-- Only the service role (which bypasses RLS) reads/writes them:
--   * devices               — agent registration internals
--   * snapshot_submissions   — raw signed payloads
--   * session_summaries      — per-session internals
--   * feature_rollups_daily  — reusable feature middle layer
--   * subscriptions          — Stripe billing state
--   * webhook_events         — Stripe webhook idempotency
--   * audit_log              — forensic / billing audit trail
-- No statements needed here: absence of a policy == denied for public roles.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Service role bypass.
-- The Supabase `service_role` BYPASSES RLS by design (it has BYPASSRLS), so the
-- scoring worker, the Stripe webhook handler, and the claim handler can write to
-- every table above WITHOUT an explicit write policy. This is the intended MVP
-- write path: all mutations are server-side, service-role-authenticated.
--
-- Therefore: NO public/anon INSERT/UPDATE/DELETE policies are defined for ANY
-- table in this file. Public roles are read-only on the public tables and have
-- no access at all to the non-public tables.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- TODO(RLS.PHASE2): Operator-scoped self-service writes.
-- Once Supabase Auth maps an authenticated user to an operator_id (e.g. via a
-- claim that links auth.uid() to operators.operator_id), add owner-scoped
-- policies so a claimed operator can edit their own profile, e.g.:
--
--   CREATE POLICY p_operators_owner_update ON operators
--     FOR UPDATE TO authenticated
--     USING  (operator_id = auth_operator_id())
--     WITH CHECK (operator_id = auth_operator_id());
--
-- and similar owner-scoped policies for circles / circle_members. Deferred until
-- the auth↔operator linkage lands. Until then, all writes are service-role only.
-- ----------------------------------------------------------------------------

-- End of policies.
