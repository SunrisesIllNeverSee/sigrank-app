-- 0023_source_attestation.sql — S1.3 anti-gaming: source file integrity attestation.
--
-- Stores per-file attestation (SHA-256 content hash, mtime, size, lines, timestamps)
-- for each submission that includes a source_attestation block (Schema v1.1). The
-- server cross-checks across submissions: a file whose content_hash changed but
-- first_ts/last_ts stayed identical = tampering. A file whose mtime > last_ts =
-- edited after the session ended.
--
-- This is the server-side memory that makes log spoofing detectable across
-- submissions — the agent sends the attestation, the server remembers it.

CREATE TABLE IF NOT EXISTS source_attestations (
  -- We use a synthetic UUID PK (gen_random_uuid) since submission_id is resolved
  -- per-submission and one submission can attest many files.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the submission this attestation came from. Not a hard FK (the
  -- snapshot_submissions table may be pruned) but indexed for cross-check queries.
  device_id TEXT NOT NULL,
  operator_id UUID,
  snapshot_hash TEXT NOT NULL,
  window_type TEXT NOT NULL,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,

  -- The attestation fields (from the v1.1 payload source_attestation[] block).
  path_hash TEXT NOT NULL,       -- SHA-256 of the relative file path
  content_hash TEXT NOT NULL,    -- SHA-256 of the file bytes at scan time
  mtime BIGINT,                  -- file mtime (epoch seconds)
  size BIGINT,                   -- file size in bytes
  lines INT,                     -- line count
  first_ts TIMESTAMPTZ,          -- first event timestamp in the file
  last_ts TIMESTAMPTZ,           -- last event timestamp in the file

  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for the cross-check query: given a device + path_hash, find all historical
-- attestations to compare content_hash + timestamps.
CREATE INDEX IF NOT EXISTS idx_source_attestations_device_path
  ON source_attestations (device_id, path_hash);

-- Index for tampering detection: find files where content_hash changed.
CREATE INDEX IF NOT EXISTS idx_source_attestations_content_hash
  ON source_attestations (device_id, path_hash, content_hash);

-- RLS: this table is server-only (service role reads/writes). No anon access.
ALTER TABLE source_attestations ENABLE ROW LEVEL LEVEL SECURITY;
ALTER TABLE source_attestations FORCE ROW LEVEL SECURITY;
-- No policy = no access for anon/authenticated roles. Service role bypasses RLS.
