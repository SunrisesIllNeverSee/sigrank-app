-- ============================================================================
-- 0005_token_pillars.sql — token-pillar storage spine (ADDITIVE, reversible).
--
-- WHY: SigRank's canonical engine stores ONLY the four raw token pillars and
-- derives every cascade metric (Y Yield, SNR, Leverage, Velocity, 10xDEV) ON READ
-- via computeCascadeMetrics(pillars: RawPillars) in lib/ingest/bridge.ts. Before
-- this migration the four pillars had NO typed column home — they lived only
-- nested inside snapshot_submissions.payload_json (JSONB), so a board read could
-- not re-derive cascade metrics. This adds first-class pillar columns.
--
-- RATIFIED (lead, scratchpad 2026-06-18 — "ANSWERS"):
--   * Canonical column names: input_tokens / output_tokens /
--     cache_creation_tokens / cache_read_tokens (all BIGINT).
--   * metric_snapshots = rolled-up board read; snapshot_submissions = canonical
--     append-only layer. Per-session granularity (session_pillars) deferred → 0006.
--   * Word-era derived columns (signa_rate/sdot_score/sdrm_score/drift_ratio/
--     compression_ratio) are KEPT as nullable WARM — NOT dropped (canon: preserve
--     all word-based info). This migration touches none of them.
--
-- NULLABILITY (IDE-session refinement, flagged to lead in PILLAR_SCHEMA_GAP.md):
--   * metric_snapshots pillars are NULLABLE (no default) so an un-scored / legacy
--     row yields cascade=null on read instead of a divide-by-zero (leverage=Cr/I).
--   * snapshot_submissions pillars are NOT NULL DEFAULT 0 — append-only rows are
--     always written with real values.
--
-- INERT UNTIL WIRED: this migration only adds storage. It changes nothing visible
-- until, at the lead's cutover, (a) the facade read path maps these columns ->
-- RawPillars and calls computeCascadeMetrics(), and (b) the seed populates MOSES
-- pillars; and (c) the ingest route writes them [TODO(DATA.LIVE)]. Applying it
-- early is safe and unblocks all three. BIGINT (not INTEGER): token counts exceed
-- 2^31 (MOSES sum ~= 2.70B; values > 2^53 would need a string codec — see spec).
-- ============================================================================

-- metric_snapshots — board-grade read layer.
-- NULLABLE: a row with no pillars (un-scored / pre-spine) derives cascade=null.
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS input_tokens          BIGINT;
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS output_tokens         BIGINT;
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS cache_creation_tokens BIGINT;
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS cache_read_tokens     BIGINT;

-- snapshot_submissions — canonical, append-only, lossless replay layer.
-- NOT NULL DEFAULT 0: every submission row carries real pillar values.
ALTER TABLE snapshot_submissions ADD COLUMN IF NOT EXISTS input_tokens          BIGINT NOT NULL DEFAULT 0;
ALTER TABLE snapshot_submissions ADD COLUMN IF NOT EXISTS output_tokens         BIGINT NOT NULL DEFAULT 0;
ALTER TABLE snapshot_submissions ADD COLUMN IF NOT EXISTS cache_creation_tokens BIGINT NOT NULL DEFAULT 0;
ALTER TABLE snapshot_submissions ADD COLUMN IF NOT EXISTS cache_read_tokens     BIGINT NOT NULL DEFAULT 0;

-- DEFERRED -> 0006: a session_pillars table (per-session 4-pillar split +
-- started_at/ended_at timestamps) for the PARKED Benford/Cadence battery
-- (PARKED_EQUATIONS.md, post-launch). Not built now — per-session pillars can
-- regenerate from local ccusage sessions.json when that phase begins.

-- WARM word-era columns (signa_rate, sdot_score, sdrm_score, drift_ratio,
-- compression_ratio) are intentionally LEFT IN PLACE and nullable. Revisit any
-- drop / Pro-move only in a separate, deliberate, non-additive migration once
-- their formulas are ratified — never bundled with this pillar-storage fix.
-- ============================================================================
