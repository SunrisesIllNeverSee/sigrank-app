-- Migration 0046: Agent mailbox mapping
--
-- Maps exchange agents to AgentMail inboxes. Each agent gets an inbox
-- keyed to their agent_key_hash (never the raw key). The inbox_id and
-- email address are stored here so we don't have to look them up via
-- the AgentMail API on every notification.

CREATE TABLE IF NOT EXISTS agent_mailboxes (
  -- The agent's credential hash (first 16 chars of sha256). This is the
  -- same hash used as the actor ID in the exchange system.
  agent_key_hash TEXT PRIMARY KEY,

  -- The AgentMail inbox ID (used to send messages from this inbox).
  inbox_id TEXT NOT NULL,

  -- The AgentMail email address for this inbox.
  email TEXT NOT NULL,

  -- Display name shown in the inbox.
  display_name TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS — only the service role (server-side) should access this table.
ALTER TABLE agent_mailboxes ENABLE ROW LEVEL SECURITY;

-- No policies: accessed exclusively via the service-role key on the server.

COMMENT ON TABLE agent_mailboxes IS
  'Maps exchange agents to AgentMail inboxes. Keyed by agent_key_hash (never the raw key). Accessed only via the service role.';
