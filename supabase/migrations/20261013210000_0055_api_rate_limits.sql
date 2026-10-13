-- 0055_api_rate_limits.sql
--
-- Postgres-backed fixed-window rate limiter, used by
-- lib/infra/distributed-rate-limit.ts when Upstash Redis is not configured.
-- Gives one shared count across all serverless instances at no extra cost,
-- so fail-closed routes stay enforceable without Redis.
--
-- Idempotent; service_role only.

BEGIN;

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  bucket       text        NOT NULL,
  window_start timestamptz NOT NULL,
  hits         integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.api_rate_limits TO service_role;
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window_start
  ON public.api_rate_limits (window_start);

-- Atomically counts one hit for p_bucket in the current window and returns the
-- new count plus seconds until the window resets. Callers compare against
-- their own max.
CREATE OR REPLACE FUNCTION public.api_rate_limit_hit(p_bucket text, p_window_seconds integer)
RETURNS TABLE (hits integer, reset_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_epoch  double precision := extract(epoch FROM clock_timestamp());
  v_window timestamptz;
  v_hits   integer;
BEGIN
  IF p_bucket IS NULL OR length(p_bucket) > 512 OR p_window_seconds IS NULL OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid rate limit arguments';
  END IF;

  v_window := to_timestamp(floor(v_epoch / p_window_seconds) * p_window_seconds);

  INSERT INTO public.api_rate_limits AS r (bucket, window_start, hits)
  VALUES (p_bucket, v_window, 1)
  ON CONFLICT (bucket, window_start) DO UPDATE SET hits = r.hits + 1
  RETURNING r.hits INTO v_hits;

  -- Opportunistic cleanup of expired windows (~1% of calls).
  IF random() < 0.01 THEN
    DELETE FROM public.api_rate_limits WHERE window_start < clock_timestamp() - interval '2 days';
  END IF;

  hits := v_hits;
  reset_seconds := greatest(1, ceil(extract(epoch FROM v_window) + p_window_seconds - v_epoch)::integer);
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.api_rate_limit_hit(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.api_rate_limit_hit(text, integer) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
