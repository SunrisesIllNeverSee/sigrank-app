-- Migration 0042: exchange_mcp_calls — durable MCP/Site Tool observability
--
-- Records every MCP operation (initialize, tools/list, tools/call) across
-- both MCP servers (sigrank, contribution-exchange) and the WebMCP/Site Tools
-- transport. This is the durable protocol-level analytics layer.
--
-- Supabase is the durable source of truth. PostHog is behavioral analytics.
-- Vercel is operational request telemetry. This table is NOT for business
-- events (those use exchange_events and exchange_encounters).

CREATE TABLE IF NOT EXISTS exchange_mcp_calls (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     timestamptz NOT NULL DEFAULT now(),

  -- Correlation
  request_id      text,

  -- Server identity
  server_id       text NOT NULL CHECK (server_id IN ('sigrank', 'contribution-exchange')),

  -- Transport: remote_mcp, webmcp, direct_http
  transport       text NOT NULL DEFAULT 'remote_mcp'
                  CHECK (transport IN ('remote_mcp', 'webmcp', 'direct_http')),

  -- Operation: initialize, tools_list, tools_call
  operation       text NOT NULL
                  CHECK (operation IN ('initialize', 'tools_list', 'tools_call')),

  -- Tool details (NULL for initialize/tools_list)
  tool_name       text,
  target_domain   text,

  -- Caller identity (privacy-safe — no raw keys, tokens, or IPs)
  agent_identity  text,    -- actor ID or hashed agent key (never raw key)
  auth_tier       text NOT NULL DEFAULT 'anonymous'
                  CHECK (auth_tier IN ('anonymous', 'actor', 'agent', 'proposer', 'admin')),
  scopes          text[],  -- e.g. ['exchange:read', 'exchange:propose']

  -- Client info
  client_name     text,
  client_version  text,

  -- Result
  result          text NOT NULL DEFAULT 'success'
                  CHECK (result IN ('success', 'error', 'denied', 'rate_limited', 'invalid_request')),
  error_code      text,

  -- Performance
  duration_ms     integer,

  -- Idempotency
  idempotent_replay boolean NOT NULL DEFAULT false,

  -- Related entities (for funnel analysis)
  signal_id       text,
  attempt_id      text,
  proposal_id     text,

  -- Privacy-safe IP hash (only if consistent with existing privacy policy)
  ip_hash         text,

  -- Additional structured metadata (JSON, no secrets)
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_mcp_calls_occurred_at ON exchange_mcp_calls (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_calls_server_id ON exchange_mcp_calls (server_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_calls_tool_name ON exchange_mcp_calls (tool_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_calls_transport ON exchange_mcp_calls (transport, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_calls_target_domain ON exchange_mcp_calls (target_domain, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_calls_result ON exchange_mcp_calls (result, occurred_at DESC);

-- RLS: server-only writes, owner-only reads
ALTER TABLE exchange_mcp_calls ENABLE ROW LEVEL SECURITY;

-- Service role can insert (server-side only)
CREATE POLICY mcp_calls_insert_service ON exchange_mcp_calls
  FOR INSERT TO service_role WITH CHECK (true);

-- Service role can read (the observability route uses service_role and
-- does its own admin/owner check in app code before calling the RPC)
CREATE POLICY mcp_calls_read_service ON exchange_mcp_calls
  FOR SELECT TO service_role USING (true);

-- No public access
CREATE POLICY mcp_calls_no_public ON exchange_mcp_calls
  FOR ALL TO anon USING (false) WITH CHECK (false);

-- Comment
COMMENT ON TABLE exchange_mcp_calls IS
  'Durable MCP and WebMCP call observability. Protocol-level analytics only — business events use exchange_events.';
