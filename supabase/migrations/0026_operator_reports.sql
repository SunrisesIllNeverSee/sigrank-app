-- 0026_operator_reports.sql
-- Cascade Report System Phase 1 — store the report block from MCP submissions.
-- The report is computed locally in the MCP (pure math: mode detection + badges +
-- health score) and submitted alongside the 4 token pillars. The server stores
-- it as-is — does NOT recompute modes.
--
-- Privacy: report_visible defaults to FALSE. Only the operator sees their own
-- report when logged in. Visitors see Layer 1 only (yield, class, badges).
-- The operator can flip report_visible to TRUE to share the full Report tab.

CREATE TABLE IF NOT EXISTS operator_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  report JSONB NOT NULL,                  -- the full report block from the MCP
  report_visible BOOLEAN DEFAULT FALSE,   -- privacy toggle (off by default)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookup of an operator's latest report
CREATE INDEX IF NOT EXISTS idx_operator_reports_operator_id
  ON operator_reports(operator_id DESC, created_at DESC);

-- RLS: server-only writes (MCP submit uses service role key).
-- Public reads only when report_visible = true.
ALTER TABLE operator_reports ENABLE ROW LEVEL SECURITY;

-- Public reads: only visible reports (report_visible = true)
CREATE POLICY "public reads visible reports" ON operator_reports
  FOR SELECT USING (report_visible = true);

-- Server writes: service role bypasses RLS, but we add an explicit policy
-- for clarity. The MCP submit path uses the service role key.
CREATE POLICY "server writes reports" ON operator_reports
  FOR INSERT WITH CHECK (true);

-- Server updates: for the privacy toggle (operator flips report_visible)
CREATE POLICY "server updates reports" ON operator_reports
  FOR UPDATE USING (true);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_operator_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_operator_reports_updated_at
  BEFORE UPDATE ON operator_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_operator_reports_updated_at();
