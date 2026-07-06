-- P6 (exposure audit): revoke anon SELECT on the org-aggregation circle tables.
-- Feature is unmounted + all 3 tables empty; this closes the latent anon-key roster
-- read before the feature is ever populated. Service-role + authed paths unaffected.
REVOKE SELECT ON circles FROM anon;
REVOKE SELECT ON circle_members FROM anon;
REVOKE SELECT ON circle_metric_snapshots FROM anon;;
