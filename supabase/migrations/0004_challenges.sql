-- ============================================================================
-- Migration 0004 — Challenge system (throw-downs, signal drops, brackets).
--
-- Three new tables:
--   signal_prompts  — weekly/event prompt briefs
--   challenges      — 1v1 or group challenge records (all mechanics)
--   challenge_submissions — individual score submissions per challenge slot
--
-- Design:
--   - signal_prompts are the shared briefs used by all challenge formats.
--   - challenges.format distinguishes: throwdown | signal_drop | bracket_match
--   - challenges.circle_id is non-null for Circle Wars format.
--   - All challenge mechanics (1v1, drop, bracket) share one table via format.
--   - challenge_submissions stores the individual signal score + certificate
--     for each participant (one row per operator per challenge).
--   - winner_id is computed by the scoring worker; null until complete.
--   - RLS: public read on completed; write via service role only.
-- ============================================================================

-- ============================================================================
-- 20. signal_prompts — weekly / event prompt briefs.
-- ============================================================================
CREATE TABLE IF NOT EXISTS signal_prompts (
  prompt_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number       INTEGER,
                    -- ISO week number (null for event/bracket prompts)
  season            TEXT,
                    -- e.g. 'S1', 'S2' for seasonal hall-of-signal events
  format            TEXT NOT NULL DEFAULT 'signal_drop',
                    -- signal_drop | throwdown | bracket | event
  brief             TEXT NOT NULL,
                    -- the prompt operators respond to
  constraint_text   TEXT,
                    -- optional hard constraint (e.g. "under 200 tokens")
  domain_tags       TEXT[] DEFAULT '{}',
                    -- filter tags: code, legal, creative, research, multi
  active_from       TIMESTAMPTZ NOT NULL,
  active_to         TIMESTAMPTZ NOT NULL,
  published_at      TIMESTAMPTZ,
                    -- null until the drop window closes + scores published
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        TEXT NOT NULL DEFAULT 'system'
                    -- system (weekly cron) or operator codename (custom)
);
CREATE INDEX IF NOT EXISTS idx_signal_prompts_week
  ON signal_prompts(week_number DESC);
CREATE INDEX IF NOT EXISTS idx_signal_prompts_active
  ON signal_prompts(active_from, active_to);
CREATE INDEX IF NOT EXISTS idx_signal_prompts_format
  ON signal_prompts(format);
-- ============================================================================
-- 21. challenges — one row per challenge match (all formats).
-- ============================================================================
CREATE TABLE IF NOT EXISTS challenges (
  challenge_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants (nullable for signal_drop format where all operators participate)
  challenger_id     UUID REFERENCES operators(operator_id),
  challenged_id     UUID REFERENCES operators(operator_id),

  -- Prompt
  prompt_id         UUID REFERENCES signal_prompts(prompt_id),
  prompt_brief      TEXT NOT NULL,
                    -- denormalized so the row is self-contained if prompt deleted

  -- Format
  format            TEXT NOT NULL DEFAULT 'throwdown',
                    -- throwdown | signal_drop | bracket_match | circle_war
  circle_id         UUID REFERENCES circles(circle_id),
                    -- non-null for circle_war format
  bracket_id        UUID,
                    -- self-referential bracket group id (no FK, avoids circular)
  bracket_round     INTEGER,
                    -- 1 = quarterfinal, 2 = semifinal, 3 = final

  -- Window
  window_open       TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_close      TIMESTAMPTZ NOT NULL,
                    -- typically +24h for throwdown, +7d for signal_drop

  -- Scores (filled by scoring worker when both submissions arrive)
  challenger_score  NUMERIC(5,2),
  challenged_score  NUMERIC(5,2),
  score_breakdown   JSONB,
                    -- { challenger: {density,clarity,fidelity,brevity,impact},
                    --   challenged: {density,clarity,fidelity,brevity,impact} }

  -- Outcome
  winner_id         UUID REFERENCES operators(operator_id),
                    -- null until status='complete'
  margin            NUMERIC(5,2),
                    -- abs(challenger_score - challenged_score)

  -- Status lifecycle
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','active','complete','expired','cancelled')),
                    -- pending   = challenged but not yet accepted
                    -- active    = window open, accepting submissions
                    -- complete  = both submitted, winner resolved
                    -- expired   = window closed with <2 submissions
                    -- cancelled = withdrawn before active

  -- Engine metadata (signal-Areana engine selection per participant)
  challenger_engine TEXT,
                    -- gemini | claude | gpt | grok | deepseek | perplexity
  challenged_engine TEXT,

  -- Audit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  ruleset_version   TEXT NOT NULL DEFAULT 'challenge-v1'
);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger
  ON challenges(challenger_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged
  ON challenges(challenged_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_status
  ON challenges(status, window_close);
CREATE INDEX IF NOT EXISTS idx_challenges_format
  ON challenges(format, status);
CREATE INDEX IF NOT EXISTS idx_challenges_bracket
  ON challenges(bracket_id, bracket_round)
  WHERE bracket_id IS NOT NULL;
-- ============================================================================
-- 22. challenge_submissions — one row per operator per challenge.
--     Stores the raw signal text + five-pillar scores + certificate artifact.
-- ============================================================================
CREATE TABLE IF NOT EXISTS challenge_submissions (
  submission_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id      UUID NOT NULL REFERENCES challenges(challenge_id),
  operator_id       UUID NOT NULL REFERENCES operators(operator_id),

  -- The signal text submitted
  signal_text       TEXT NOT NULL,

  -- Five-pillar scores (signal-Areana: Density/Clarity/Fidelity/Brevity/Impact)
  score_density     NUMERIC(5,2) NOT NULL,
  score_clarity     NUMERIC(5,2) NOT NULL,
  score_fidelity    NUMERIC(5,2) NOT NULL,
  score_brevity     NUMERIC(5,2) NOT NULL,
  score_impact      NUMERIC(5,2) NOT NULL,
  composite_score   NUMERIC(5,2) NOT NULL,
                    -- (density×0.30)+(clarity×0.20)+(fidelity×0.20)+(brevity×0.15)+(impact×0.15)

  -- Engine used
  engine            TEXT NOT NULL DEFAULT 'claude',
                    -- gemini | claude | gpt | grok | deepseek | perplexity

  -- Certificate artifact (for sharing / hall of signal)
  certificate_json  JSONB,
                    -- { score, engine, echo, signal, metrics } from signal-Areana

  -- Confidence (local-sim vs future real-api)
  scoring_mode      TEXT NOT NULL DEFAULT 'local_sim',
                    -- local_sim | api_verified

  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (challenge_id, operator_id)
                    -- one submission per operator per challenge
);
CREATE INDEX IF NOT EXISTS idx_challenge_subs_challenge
  ON challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_subs_operator
  ON challenge_submissions(operator_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_subs_score
  ON challenge_submissions(composite_score DESC);
-- ============================================================================
-- RLS policies (service-role writes; public read on completed challenges).
-- ============================================================================
ALTER TABLE signal_prompts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
-- Public can read published prompts
CREATE POLICY "signal_prompts_public_read"
  ON signal_prompts FOR SELECT
  USING (published_at IS NOT NULL);
-- Public can read completed / active challenges
CREATE POLICY "challenges_public_read"
  ON challenges FOR SELECT
  USING (status IN ('active', 'complete'));
-- Public can read submissions for completed challenges
CREATE POLICY "challenge_subs_public_read"
  ON challenge_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.challenge_id = challenge_submissions.challenge_id
        AND c.status = 'complete'
    )
  );
-- Writes via service role only (no INSERT/UPDATE policies for anon/authenticated)

-- ============================================================================
-- Add operator_domains column to operators table (for /transmitters discovery).
-- Supports domain tagging: code, legal, creative, research, multi.
-- ============================================================================
ALTER TABLE operators ADD COLUMN IF NOT EXISTS operator_domains TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_operators_domains
  ON operators USING gin (operator_domains);
-- ============================================================================
-- Add challenge_record columns to metric_snapshots (career W/L/draw).
-- Denormalized for fast profile reads.
-- ============================================================================
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS challenges_total  INTEGER DEFAULT 0;
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS challenges_won    INTEGER DEFAULT 0;
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS challenges_lost   INTEGER DEFAULT 0;
ALTER TABLE metric_snapshots ADD COLUMN IF NOT EXISTS signal_drop_best  NUMERIC(5,2);
-- best single signal drop score;
