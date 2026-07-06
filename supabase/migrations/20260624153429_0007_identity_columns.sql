ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS handle      TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS bio         TEXT,
  ADD COLUMN IF NOT EXISTS links       JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS location    TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_operators_handle
  ON operators (handle)
  WHERE handle IS NOT NULL;;
