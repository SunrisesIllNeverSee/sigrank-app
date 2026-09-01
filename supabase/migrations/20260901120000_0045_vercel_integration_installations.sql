-- Migration 0045: Vercel Marketplace integration installations
--
-- Stores OAuth tokens and installation state for the SigRank Vercel
-- Marketplace integration. Each row represents one installation of the
-- integration by a Vercel user or team.

CREATE TABLE IF NOT EXISTS vercel_integrations (
  -- The Vercel configuration ID — the primary identifier Vercel uses for
  -- this installation. Used as the unique constraint.
  configuration_id TEXT PRIMARY KEY,

  -- The long-lived Vercel access token (encrypted at rest by Supabase).
  -- Used to call the Vercel API on behalf of the installation.
  access_token TEXT NOT NULL,

  -- Token type (typically "bearer").
  token_type TEXT NOT NULL DEFAULT 'bearer',

  -- OAuth scopes granted by the user.
  scope TEXT,

  -- The Vercel team ID that owns this installation (if team-scoped).
  team_id TEXT,

  -- The Vercel user ID that created this installation.
  user_id TEXT,

  -- Installation status: "active", "revoked", "pending_env".
  status TEXT NOT NULL DEFAULT 'active',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for looking up installations by team.
CREATE INDEX IF NOT EXISTS idx_vercel_integrations_team_id
  ON vercel_integrations (team_id)
  WHERE team_id IS NOT NULL;

-- Index for looking up installations by user.
CREATE INDEX IF NOT EXISTS idx_vercel_integrations_user_id
  ON vercel_integrations (user_id)
  WHERE user_id IS NOT NULL;

-- Index for filtering by status.
CREATE INDEX IF NOT EXISTS idx_vercel_integrations_status
  ON vercel_integrations (status);

-- Enable RLS — only the service role (server-side) should access this table.
ALTER TABLE vercel_integrations ENABLE ROW LEVEL SECURITY;

-- No policies are created: the table is accessed exclusively via the
-- service-role key on the server. RLS blocks anon/authenticated access.

COMMENT ON TABLE vercel_integrations IS
  'Vercel Marketplace integration installations. Stores OAuth tokens and installation state. Accessed only via the service role.';
