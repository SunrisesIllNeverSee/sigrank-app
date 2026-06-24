-- ============================================================================
-- SigRank — seed data.
--
-- Idempotent inserts (ON CONFLICT DO NOTHING) of:
--   * Ruleset v1.0 (rulesets) — RS.xx PLACEHOLDER values, OPERATOR_OVERRIDE_REQUIRED.
--   * ruleset_versions v1.0 — the trust-ledger row for chart markers.
--   * 16 badges BG.01–BG.16 (snake_case slugs).
--   * MO§ES — the one real operator (TransVaultOrigin / TheSignalVault), claimed.
--   * MO§ES metric_snapshots, rank_history, leaderboards_cached (global/30d).
--   * system_stats singleton.
--
-- These rows mirror lib/data/mock.ts exactly so the live DB and the mock
-- fallback agree. The app renders identically whether or not this seed is
-- applied (mock fallback when Supabase creds are absent).
--
-- IMPORTANT — RS.xx values below are PROVISIONAL placeholders from Ruleset v1.0
-- (mirrored from lib/scoring/ruleset.ts). They MUST be replaced with the real
-- Railway scoring-worker config before production. Each is marked with
-- `-- OPERATOR_OVERRIDE_REQUIRED RS.xx`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Ruleset v1.0 — effective 2026-05-14T00:00:00Z.
--   weight_json    → RS.01 SIGNA RATE composite weights (sum = 1.0)
--   threshold_json → RS.05 class breakpoints + RS.02 depth buckets + RS.03 recency
--   formula_json   → RS.01/RS.04 formula shape + RS.06/RS.07 flags
-- ----------------------------------------------------------------------------
INSERT INTO rulesets (
  ruleset_version, effective_from, effective_to,
  formula_json, threshold_json, weight_json, notes
) VALUES (
  '1.0',
  '2026-05-14T00:00:00Z',
  NULL,
  -- formula_json -------------------------------------------------------------
  '{
    "signa_rate": "0.30*comp + 0.20*sd + 0.20*pc + 0.15*ct + 0.15*tt",
    "normalization": {
      "comp": "compression_ratio * 100",
      "sd": "RS.02 session-depth bucketization",
      "pc": "prompt_complexity clamped [0,100]",
      "ct": "cross_thread clamped [0,100]",
      "tt": "min(100, 20*log10(token_throughput+1))"
    },
    "signal_force": "log_norm((total_messages_lifetime * session_depth) / account_age_days)",
    "recency": "live_signa_rate = signa_rate * RS.03 recency_modifier",
    "pc_subscore_weights": {
      "instruction_layers": 0.25, "recursion": 0.20, "entities": 0.20,
      "constraints": 0.15, "symbolic": 0.10, "response_shaping": 0.10
    },
    "anti_gaming_enabled": false,
    "promotion_cycles": 3
  }'::jsonb,  -- OPERATOR_OVERRIDE_REQUIRED RS.01 / OPERATOR_OVERRIDE_REQUIRED RS.04 / OPERATOR_OVERRIDE_REQUIRED RS.06 / OPERATOR_OVERRIDE_REQUIRED RS.07
  -- threshold_json -----------------------------------------------------------
  '{
    "class_thresholds": [
      {"class": "TRANSMITTER", "comp_min": 0.85, "signa_min": 85},
      {"class": "ARCH+",       "comp_min": 0.75, "signa_min": 75},
      {"class": "ARCH",        "comp_min": 0.65, "signa_min": 65},
      {"class": "POWER",       "comp_min": 0.50, "signa_min": 50},
      {"class": "BASE",        "comp_min": 0.40, "signa_min": null},
      {"class": "SEEKER",      "comp_min": 0.30, "signa_min": null},
      {"class": "REFINER",     "comp_min": 0.20, "signa_min": null},
      {"class": "BEARER",      "comp_min": 0.15, "signa_min": null},
      {"class": "IGNITER",     "comp_min": 0.00, "signa_min": null}
    ],
    "depth_buckets": [[30,100],[25,92],[20,84],[15,72],[10,58],[5,42]],
    "depth_fallback": 25,
    "recency_curve": [[24,1.00],[72,0.97],[168,0.94],[336,0.88],[720,0.80]],
    "recency_fallback": 0.65
  }'::jsonb,  -- OPERATOR_OVERRIDE_REQUIRED RS.05 / OPERATOR_OVERRIDE_REQUIRED RS.02 / OPERATOR_OVERRIDE_REQUIRED RS.03
  -- weight_json --------------------------------------------------------------
  '{
    "comp": 0.30,
    "sd": 0.20,
    "pc": 0.20,
    "ct": 0.15,
    "tt": 0.15
  }'::jsonb,  -- OPERATOR_OVERRIDE_REQUIRED RS.01
  'Ruleset v1.0 — PROVISIONAL placeholder weights/thresholds mirroring lib/scoring/ruleset.ts. Penalties disabled for MVP (RS.06 off). Replace all RS.xx values before production. OPERATOR_OVERRIDE_REQUIRED.'
)
ON CONFLICT (ruleset_version) DO NOTHING;

-- ----------------------------------------------------------------------------
-- ruleset_versions v1.0 — trust ledger row (chart markers).
-- ----------------------------------------------------------------------------
INSERT INTO ruleset_versions (version, effective_from, changelog, changed_params)
VALUES (
  '1.0',
  '2026-05-14T00:00:00Z',
  'Initial locked ruleset. RS.01 composite weights, RS.02 depth buckets, RS.03 recency curve, RS.05 class thresholds. Penalties (RS.06) off for MVP.',
  '["RS.01","RS.02","RS.03","RS.04","RS.05","RS.06","RS.07"]'::jsonb  -- OPERATOR_OVERRIDE_REQUIRED RS.xx
)
ON CONFLICT (version) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Badge catalog BG.01–BG.16 (snake_case slugs in badge_name).
--   badge_type: structural | event | prestige | audit | patron
--   rarity:     common | rare | epic | legendary
--   criteria_json carries the canonical id + public criteria summary.
-- ----------------------------------------------------------------------------
INSERT INTO badges (badge_name, badge_type, rarity, criteria_json) VALUES
  ('five_x_crown',          'structural', 'epic',      '{"id":"BG.01","glyph":"⭐","criteria":"Held #1 in all 5 Core metrics simultaneously (single window)."}'::jsonb),
  ('transmitter_class',     'structural', 'rare',      '{"id":"BG.02","glyph":"◈","criteria":"Compression >= 0.85 AND SIGNA RATE >= 85."}'::jsonb),
  ('architect_lock',        'prestige',   'rare',      '{"id":"BG.03","glyph":"▲","criteria":"Sustained ARCHITECT+ class for 14+ days."}'::jsonb),
  ('crossweaver',           'structural', 'rare',      '{"id":"BG.04","glyph":"🌊","criteria":"CT score in top 1% for the window."}'::jsonb),
  ('deep_channel',          'structural', 'rare',      '{"id":"BG.05","glyph":"⌬","criteria":"Session Depth raw >= 30 sustained 7 days."}'::jsonb),
  ('compression_forge',     'structural', 'epic',      '{"id":"BG.06","glyph":"⚒","criteria":"Compression >= 0.85 sustained through MV in top 10% (busy AND clean)."}'::jsonb),
  ('audit_verified',        'audit',      'rare',      '{"id":"BG.07","glyph":"🛡","criteria":"Pro-tier sig_army audit completed and confirmed."}'::jsonb),
  ('ghost_return',          'event',      'rare',      '{"id":"BG.08","glyph":"👻","criteria":"Reactivation after dormancy (>30d idle, then re-publishes)."}'::jsonb),
  ('lightning_strike',      'event',      'epic',      '{"id":"BG.09","glyph":"⚡","criteria":"Largest 24h SIGNA RATE rise on the leaderboard for that day."}'::jsonb),
  ('quiet_giant',           'structural', 'rare',      '{"id":"BG.10","glyph":"❄","criteria":"Compression >= 0.85 AND Message Volume in bottom 50%."}'::jsonb),
  ('iron_streak',           'prestige',   'rare',      '{"id":"BG.11","glyph":"🔥","criteria":"30+ consecutive active days."}'::jsonb),
  ('fivefold_hold',         'prestige',   'legendary', '{"id":"BG.12","glyph":"⭐⭐⭐⭐⭐","criteria":"Held BG.01 (5x Crown) for 7+ consecutive days."}'::jsonb),
  ('first_transmitter',     'event',      'legendary', '{"id":"BG.13","glyph":"◈⃝","criteria":"First-ever Transmitter-class assignment in their platform region."}'::jsonb),
  ('signal_patron',         'patron',     'common',    '{"id":"BG.14","glyph":"🍻","criteria":"Active Supporter tier (any payment)."}'::jsonb),
  ('circle_founder',        'event',      'rare',      '{"id":"BG.15","glyph":"🏛","criteria":"Founded a Circle with >= 5 active members."}'::jsonb),
  ('hall_of_signal',        'event',      'legendary', '{"id":"BG.16","glyph":"🏆","criteria":"Recipient of any Hall of Signal record."}'::jsonb)
ON CONFLICT (badge_name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- MO§ES — the one real operator. CLAIMED (one-time lifetime payment).
--   operator_id mirrors lib/data/mock.ts (op-moses-0001) for live/mock parity.
--   Anonymous-by-default model: claimed=true here so the display_name + claimed
--   pill render; claim_contact left NULL (no PII required).
-- ----------------------------------------------------------------------------
INSERT INTO operators (
  operator_id, codename, display_name, status, privacy_level, verification_status,
  primary_domain, account_age_days, total_messages_lifetime,
  current_supporter_tier, claimed, claimed_at, claim_payment_id, claim_contact
) VALUES (
  '00000000-0000-0000-0000-000000000591'::uuid,  -- deterministic seed UUID for MO§ES (op-moses-0001 mock parity)
  'TransVaultOrigin',
  'TheSignalVault',
  'active',
  'public',
  'audited',
  'claude',
  119,
  53960,
  'pro',
  true,
  '2026-05-14T00:00:00Z',
  'pi_moses_claim_0001',
  NULL
)
ON CONFLICT (codename) DO NOTHING;

-- ----------------------------------------------------------------------------
-- MO§ES metric_snapshots — 30d window, snapshot_date 2026-05-14.
--   sdot_score (C.02), sdrm_score (C.03), drift_ratio (E.02) all NULL (uncomputed).
-- ----------------------------------------------------------------------------
INSERT INTO metric_snapshots (
  operator_id, snapshot_date, window_type,
  compression_ratio, prompt_complexity, cross_thread, session_depth, token_throughput,
  message_volume, account_age_days, total_messages,
  signa_rate, sdot_score, sdrm_score, signal_force, drift_ratio,
  input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens,
  class_tier, last_seen, recency_modifier, live_signa_rate,
  movement_24h, movement_7d, ruleset_version
)
SELECT
  o.operator_id, DATE '2026-05-14', '30d',
  0.9694, 92, 37, 26.1, 18450,
  NULL, 119, 53960,
  96.4, NULL, NULL, 12.8, NULL,
  1251211, 11296121, 128196310, 2555179769,  -- §5b token-pillar spine (0005) → Υ 18436.98 on read
  'TRANSMITTER', '2026-05-14T00:00:00Z', 1.00, 96.4,
  0, 0, '1.0'
FROM operators o
WHERE o.codename = 'TransVaultOrigin'
ON CONFLICT (operator_id, snapshot_date, window_type) DO NOTHING;

-- ----------------------------------------------------------------------------
-- MO§ES rank_history — global #1, percentile 99.97.
-- ----------------------------------------------------------------------------
INSERT INTO rank_history (
  operator_id, snapshot_date, global_rank, class_rank,
  compression_rank, depth_rank, volume_rank, complexity_rank, cross_thread_rank,
  percentile
)
SELECT
  o.operator_id, DATE '2026-05-14', 1, 1,
  1, 1, 1, 1, 1,
  99.97
FROM operators o
WHERE o.codename = 'TransVaultOrigin'
ON CONFLICT (operator_id, snapshot_date) DO NOTHING;

-- ----------------------------------------------------------------------------
-- leaderboards_cached — global board, 30d window. Single-row payload (MO§ES #1).
--   The web app reads precomputed boards from here, not from live joins.
-- ----------------------------------------------------------------------------
INSERT INTO leaderboards_cached (
  board_type, scope, scope_value, window_type, ruleset_version, payload_json, expires_at
)
SELECT
  'global', 'global', NULL, '30d', '1.0',
  jsonb_build_array(
    jsonb_build_object(
      'rank', 1,
      'operator_id', o.operator_id,
      'codename', 'TransVaultOrigin',
      'display_name', 'TheSignalVault',
      'class_tier', 'TRANSMITTER',
      'signa_rate', 96.4,
      'live_signa_rate', 96.4,
      'compression_ratio', 0.9694,
      'percentile', 99.97
    )
  ),
  NULL
FROM operators o
WHERE o.codename = 'TransVaultOrigin';

-- ----------------------------------------------------------------------------
-- Token-pillar corpus — 11 tokscale operators (§5b, owner-directed 2026-06-18).
-- Pillars are LITERAL canon (mirror lib/data/mock.ts SEED_CORPUS); the facade
-- derives Υ/SNR/Leverage on read. Anonymous codenames; real handles internal.
-- ----------------------------------------------------------------------------
INSERT INTO operators (codename, display_name, current_supporter_tier, verification_status, primary_domain, account_age_days, total_messages_lifetime, claimed)
VALUES
  ('TransVaultOrigin·tokscale', NULL, 'pro', 'audited', 'claude', 119, 25234, false)
,  ('OrcaVanguard', NULL, 'pro', 'verified', 'claude', 110, 38000, false)
,  ('IronLattice', NULL, 'patron', 'verified', 'claude', 96, 33000, false)
,  ('PrismCartographer', NULL, 'free', 'unverified', 'gemini', 64, 27600, false)
,  ('MeridianScribe', NULL, 'patron', 'verified', 'claude', 58, 22100, false)
,  ('VectorHerald', NULL, 'circle_sponsor', 'audited', 'multi', 52, 19400, false)
,  ('EmberCoil', NULL, 'free', 'unverified', 'pi', 39, 11200, false)
,  ('DriftPilgrim', NULL, 'patron', 'verified', 'gemini', 34, 8600, false)
,  ('SignalFledgling', NULL, 'free', 'unverified', 'claude', 21, 4900, false)
,  ('QuietHollow', NULL, 'free', 'unverified', 'pi', 16, 2300, false)
,  ('AshIgnition', NULL, 'free', 'unverified', 'chatgpt', 9, 740, false)
ON CONFLICT (codename) DO NOTHING;

INSERT INTO metric_snapshots (operator_id, snapshot_date, window_type, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, signa_rate, compression_ratio, prompt_complexity, cross_thread, session_depth, token_throughput, signal_force, class_tier, last_seen, recency_modifier, live_signa_rate, movement_24h, movement_7d, ruleset_version)
SELECT o.operator_id, DATE '2026-05-14', '30d', v.input, v.output, v.cc, v.cr, v.signa, v.comp, v.pc, v.ct, v.sd, v.tt, v.sf, v.cls, TIMESTAMPTZ '2026-05-14T00:00:00Z', 1.00, v.signa, 0, 0, '1.0'
FROM (VALUES
  ('TransVaultOrigin·tokscale', 61349259::bigint, 17117729::bigint, 161665905::bigint, 3570556236::bigint, 96.4, 0.218, 92, 37, 26.1, 18450, 12.8, 'TRANSMITTER')
,  ('OrcaVanguard', 20500000000, 1900000000, 1400000000, 572400000000, 88.0, 0.88, 84, 36, 23.0, 16000, 11.4, 'TRANSMITTER')
,  ('IronLattice', 17000000000, 1300000000, 352600, 512000000000, 84.0, 0.84, 80, 33, 21.6, 14800, 10.6, 'TRANSMITTER')
,  ('PrismCartographer', 26900000000, 2000000000, 238300, 475400000000, 79.3, 0.792, 73, 28, 19.2, 12400, 9.4, 'ARCH+')
,  ('MeridianScribe', 16200000000, 1100000000, 1100000000, 361400000000, 76.1, 0.764, 70, 26, 17.8, 11200, 8.8, 'ARCH+')
,  ('VectorHerald', 8300000000, 495200000, 111400000, 210600000000, 71.0, 0.701, 66, 24, 16.0, 10100, 8.1, 'ARCH')
,  ('EmberCoil', 36900000000, 3000000000, 1000000000, 824400000000, 57.8, 0.561, 53, 18, 12.0, 7400, 6.2, 'POWER')
,  ('DriftPilgrim', 7400000000, 415100000, 223700000, 233400000000, 47.2, 0.452, 44, 14, 9.6, 5800, 5.1, 'BASE')
,  ('SignalFledgling', 67700000000, 64000000000, 168800000, 36800000000, 36.5, 0.354, 33, 10, 7.2, 4100, 3.9, 'SEEKER')
,  ('QuietHollow', 164100000000, 26000000000, 170100000, 296800000000, 24.0, 0.224, 21, 6, 5.4, 2600, 2.6, 'REFINER')
,  ('AshIgnition', 4036000000000, 1258000000000, 99000000000, 1661000000000, 11.8, 0.118, 12, 3, 2.8, 1200, 1.4, 'IGNITER')
) AS v(codename, input, output, cc, cr, signa, comp, pc, ct, sd, tt, sf, cls)
JOIN operators o ON o.codename = v.codename
ON CONFLICT (operator_id, snapshot_date, window_type) DO NOTHING;

-- ----------------------------------------------------------------------------
-- system_stats — singleton homepage aggregate block.
-- ----------------------------------------------------------------------------
INSERT INTO system_stats (
  id, total_operators, total_snapshots, total_tokens_scored,
  transmitter_count, top_operator_id, top_signa_rate
)
SELECT
  TRUE, 12, 12, 11053091503440,
  4, o.operator_id, 96.4
FROM operators o
WHERE o.codename = 'TransVaultOrigin'
ON CONFLICT (id) DO NOTHING;

-- End of seed.
