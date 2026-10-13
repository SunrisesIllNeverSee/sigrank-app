-- Owner-selected visual marks for the public operator profile.
-- Eligibility is derived from current leaderboard/Hall records in the app;
-- the stored values are preferences, not independent awards or score inputs.
ALTER TABLE public.operators
  ADD COLUMN IF NOT EXISTS profile_pixel_badge TEXT,
  ADD COLUMN IF NOT EXISTS profile_secondary_logo TEXT;

COMMENT ON COLUMN public.operators.profile_pixel_badge IS
  'Owner-selected earned Pixel badge id; eligibility is checked against live records.';
COMMENT ON COLUMN public.operators.profile_secondary_logo IS
  'Owner-selected earned record badge id; eligibility is checked against live Hall/leaderboard records.';
